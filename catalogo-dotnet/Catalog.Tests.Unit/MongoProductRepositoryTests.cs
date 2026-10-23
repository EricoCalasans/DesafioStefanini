using System.Reflection;
using Catalog.Domain.Products;
using Catalog.Infrastructure.Products;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;

namespace Catalog.Tests.Unit;

public sealed class MongoProductRepositoryTests
{
    private const string ProductId = "abcdefab-cdef-4abc-8def-abcdefabcdef";
    private static readonly DateTime UpdatedAt = new(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Find_by_id_maps_a_document_and_returns_null_when_missing()
    {
        var driver = FakeMongoDriver.Create([Document(ProductId)]);
        var repository = new MongoProductRepository(driver.Database.Object);

        var found = await repository.FindByIdAsync(ProductId, CancellationToken.None);
        var missing = await new MongoProductRepository(FakeMongoDriver.Create([]).Database.Object)
            .FindByIdAsync(ProductId, CancellationToken.None);

        Assert.Equal(ProductId, found?.Id);
        Assert.Equal(20_000, found?.PriceCents);
        Assert.Equal(UpdatedAt, found?.UpdatedAt.UtcDateTime);
        Assert.Null(missing);
        Assert.Equal(1, driver.FindCalls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Find_active_page_counts_and_applies_sort_skip_limit_and_max_time()
    {
        var driver = FakeMongoDriver.Create([Document(ProductId)], totalDocuments: 25);
        var repository = new MongoProductRepository(driver.Database.Object);

        var (products, total) = await repository.FindActivePageAsync(3, 5, CancellationToken.None);

        Assert.Equal(25, total);
        Assert.Equal(ProductId, Assert.Single(products).Id);
        Assert.Equal(1, driver.CountCalls);
        Assert.Equal(1, driver.FindCalls);
        Assert.Equal(CancellationToken.None, driver.LastCountCancellationToken);
        Assert.Equal(CancellationToken.None, driver.LastFindCancellationToken);
        Assert.Equal(10, OptionValue<int>(driver.LastFindOptions, "Skip"));
        Assert.Equal(5, OptionValue<int>(driver.LastFindOptions, "Limit"));
        Assert.Equal(TimeSpan.FromSeconds(1), OptionValue<TimeSpan>(driver.LastFindOptions, "MaxTime"));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Find_by_ids_maps_all_documents_with_one_batch_lookup()
    {
        const string secondId = "fedcbafe-dcba-4fed-8cba-fedcbafedcba";
        var driver = FakeMongoDriver.Create([Document(secondId), Document(ProductId)]);
        var repository = new MongoProductRepository(driver.Database.Object);

        var products = await repository.FindByIdsAsync([ProductId, secondId], CancellationToken.None);

        Assert.Equal(new[] { secondId, ProductId }, products.Select(product => product.Id));
        Assert.Equal(1, driver.FindCalls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Invalid_persisted_documents_are_rejected_with_a_sanitized_domain_error()
    {
        var driver = FakeMongoDriver.Create([Document(ProductId.ToUpperInvariant())]);
        var repository = new MongoProductRepository(driver.Database.Object);

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() =>
            repository.FindByIdAsync(ProductId, CancellationToken.None));

        Assert.Equal("MongoDB contains a product outside the catalog domain.", exception.Message);
        Assert.IsType<InvalidDataException>(exception.InnerException);
    }

    [Theory]
    [InlineData("mongo")]
    [InlineData("timeout")]
    [Trait("Category", "Unit")]
    public async Task Wraps_driver_and_server_selection_failures(string failureType)
    {
        var driver = FakeMongoDriver.Create([]);
        driver.FailFind(failureType == "mongo"
            ? new MongoDB.Driver.MongoException("private server detail")
            : new TimeoutException("private server detail"));
        var repository = new MongoProductRepository(driver.Database.Object);

        var exception = await Assert.ThrowsAsync<CatalogPersistenceException>(() =>
            repository.FindByIdsAsync([ProductId], CancellationToken.None));

        Assert.Equal("Catalog persistence is unavailable.", exception.Message);
        Assert.DoesNotContain("private", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Preserves_caller_cancellation_and_does_not_wrap_unexpected_errors()
    {
        var cancellation = new OperationCanceledException("cancelled");
        var cancelledDriver = FakeMongoDriver.Create([]);
        cancelledDriver.FailFind(cancellation);
        var cancelledRepository = new MongoProductRepository(cancelledDriver.Database.Object);
        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            cancelledRepository.FindByIdsAsync([ProductId], cancellationSource.Token));

        var unexpected = new InvalidOperationException("programming error");
        var brokenDriver = FakeMongoDriver.Create([]);
        brokenDriver.FailFind(unexpected);
        var brokenRepository = new MongoProductRepository(brokenDriver.Database.Object);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            brokenRepository.FindByIdsAsync([ProductId], CancellationToken.None));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Product_document_serialization_uses_storage_names_and_ignores_unknown_fields()
    {
        var document = BsonSerializer.Deserialize<ProductDocument>(new BsonDocument
        {
            ["_id"] = ProductId,
            ["sku"] = "TEC-001",
            ["name"] = "Teclado",
            ["currency"] = "BRL",
            ["priceCents"] = 20_000,
            ["active"] = true,
            ["priceVersion"] = 3,
            ["updatedAt"] = new BsonDateTime(UpdatedAt),
            ["ignored"] = "extra"
        });
        var serialized = document.ToBsonDocument();

        Assert.Equal(ProductId, document.Id);
        Assert.Equal("TEC-001", serialized["sku"].AsString);
        Assert.False(serialized.Contains("ignored"));
        Assert.Equal(new[] { "_id", "sku", "name", "currency", "priceCents", "active", "priceVersion", "updatedAt" },
            serialized.Names);
    }

    private static ProductDocument Document(string id) => new()
    {
        Id = id,
        Sku = "TEC-001",
        Name = "Teclado",
        Currency = "BRL",
        PriceCents = 20_000,
        Active = true,
        PriceVersion = 3,
        UpdatedAt = UpdatedAt
    };

    private static T OptionValue<T>(object? options, string propertyName)
    {
        Assert.NotNull(options);
        var property = options!.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(property);
        return Assert.IsType<T>(property!.GetValue(options));
    }
}
