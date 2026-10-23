using Catalog.Api.Controllers;
using Catalog.Application.Health;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.Tests.Unit;

public sealed class HealthControllerTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Live_reports_process_health_without_readiness_checks()
    {
        var readiness = new StubReadiness(Task.FromException(new InvalidOperationException()));
        var controller = new HealthController(readiness);

        var result = Assert.IsType<OkObjectResult>(controller.Live());
        var body = Assert.IsType<HealthResponse>(result.Value);

        Assert.Equal("UP", body.Status);
        Assert.Equal("catalog", body.Service);
        Assert.Empty(body.Checks);
        Assert.Equal(0, readiness.Calls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Ready_reports_mongo_up_after_successful_ping()
    {
        var readiness = new StubReadiness(Task.CompletedTask);
        var controller = new HealthController(readiness);

        var result = Assert.IsType<OkObjectResult>(await controller.Ready(CancellationToken.None));
        var body = Assert.IsType<HealthResponse>(result.Value);

        Assert.Equal("UP", body.Status);
        Assert.Equal(new HealthCheck("mongo", "UP"), Assert.Single(body.Checks));
        Assert.Equal(1, readiness.Calls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Ready_reports_mongo_down_when_ping_fails()
    {
        var readiness = new StubReadiness(Task.FromException(new TimeoutException("server selection timeout")));
        var controller = new HealthController(readiness);

        var result = Assert.IsType<ObjectResult>(await controller.Ready(CancellationToken.None));
        var body = Assert.IsType<HealthResponse>(result.Value);

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, result.StatusCode);
        Assert.Equal("DOWN", body.Status);
        Assert.Equal(new HealthCheck("mongo", "DOWN"), Assert.Single(body.Checks));
        Assert.Equal(1, readiness.Calls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Ready_does_not_swallow_cancellation()
    {
        var readiness = new StubReadiness(Task.FromException(new OperationCanceledException()));
        var controller = new HealthController(readiness);

        await Assert.ThrowsAsync<OperationCanceledException>(() => controller.Ready(CancellationToken.None));
    }

    private sealed class StubReadiness(Task result) : ICatalogReadiness
    {
        public int Calls { get; private set; }

        public Task CheckAsync(CancellationToken cancellationToken)
        {
            Calls++;
            return result;
        }
    }
}
