using Catalog.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.Tests.Unit;

public sealed class InfrastructureConfigurationTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Missing_mongodb_uri_fails_fast_with_configuration_key()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["CATALOG_MONGODB_DATABASE"] = "catalog" }).Build();

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddCatalogInfrastructure(configuration));

        Assert.Contains("CATALOG_MONGODB_URI", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("")]
    [InlineData("catalog/other")]
    [InlineData("catalog.name")]
    [InlineData("catalog\"name")]
    [Trait("Category", "Unit")]
    public void Invalid_database_name_fails_fast(string databaseName)
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["CATALOG_MONGODB_URI"] = "mongodb://localhost:27017",
                ["CATALOG_MONGODB_DATABASE"] = databaseName
            }).Build();

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddCatalogInfrastructure(configuration));

        Assert.Contains("CATALOG_MONGODB_DATABASE", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Invalid_uri_does_not_echo_credentials()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["CATALOG_MONGODB_URI"] = "https://user:secret@example.invalid",
                ["CATALOG_MONGODB_DATABASE"] = "catalog"
            }).Build();

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddCatalogInfrastructure(configuration));

        Assert.DoesNotContain("secret", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
