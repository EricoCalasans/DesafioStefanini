using Catalog.Application.Products;
using Catalog.Infrastructure;
using Catalog.Infrastructure.Products;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.Tests.Unit;

public sealed class MongoUnavailableTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task Server_selection_timeout_is_classified_as_persistence_unavailable()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["CATALOG_MONGODB_URI"] = "mongodb://127.0.0.1:1/?directConnection=true",
            ["CATALOG_MONGODB_DATABASE"] = "catalog_qa_unavailable"
        }).Build();
        using var provider = new ServiceCollection().AddCatalogInfrastructure(configuration).BuildServiceProvider();
        var repository = provider.GetRequiredService<IProductRepository>();

        await Assert.ThrowsAsync<CatalogPersistenceException>(() =>
            repository.FindByIdsAsync(["11111111-1111-4111-8111-111111111111"], CancellationToken.None));
    }
}
