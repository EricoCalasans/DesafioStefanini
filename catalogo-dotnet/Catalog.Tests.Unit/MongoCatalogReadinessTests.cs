using Catalog.Infrastructure.Health;

namespace Catalog.Tests.Unit;

public sealed class MongoCatalogReadinessTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task Sends_a_ping_with_the_request_cancellation_token()
    {
        var driver = FakeMongoDriver.Create([]);
        var readiness = new MongoCatalogReadiness(driver.Database.Object);
        using var cancellation = new CancellationTokenSource();

        await readiness.CheckAsync(cancellation.Token);

        Assert.Equal(1, driver.PingCalls);
        Assert.Equal(cancellation.Token, driver.LastPingCancellationToken);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Propagates_a_failed_ping_for_the_health_controller_to_classify()
    {
        var failure = new TimeoutException("server selection timeout");
        var driver = FakeMongoDriver.Create([]);
        driver.FailPing(failure);
        var readiness = new MongoCatalogReadiness(driver.Database.Object);

        await Assert.ThrowsAsync<TimeoutException>(() => readiness.CheckAsync(CancellationToken.None));
        Assert.Equal(1, driver.PingCalls);
    }
}
