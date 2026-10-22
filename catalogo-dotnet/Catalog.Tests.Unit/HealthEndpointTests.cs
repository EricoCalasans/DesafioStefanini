using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Catalog.Tests.Unit;

public sealed class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        var originalUri = Environment.GetEnvironmentVariable("CATALOG_MONGODB_URI");
        var originalDatabase = Environment.GetEnvironmentVariable("CATALOG_MONGODB_DATABASE");
        Environment.SetEnvironmentVariable("CATALOG_MONGODB_URI", "mongodb://localhost:27017");
        Environment.SetEnvironmentVariable("CATALOG_MONGODB_DATABASE", "catalog_test");

        try
        {
            _factory = factory.WithWebHostBuilder(builder =>
                builder.UseContentRoot(AppContext.BaseDirectory));
            _client = _factory.CreateClient();
        }
        finally
        {
            Environment.SetEnvironmentVariable("CATALOG_MONGODB_URI", originalUri);
            Environment.SetEnvironmentVariable("CATALOG_MONGODB_DATABASE", originalDatabase);
        }
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Live_endpoint_does_not_require_database_readiness()
    {
        var response = await _client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"service\":\"catalog\"", body, StringComparison.Ordinal);
        Assert.Contains("\"status\":\"UP\"", body, StringComparison.Ordinal);
    }
}
