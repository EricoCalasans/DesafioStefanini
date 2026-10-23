using Catalog.Application.Products;
using Catalog.Domain.Products;

namespace Catalog.Tests.Unit;

public sealed class ProductQueriesTests
{
    private const string FirstId = "11111111-1111-4111-8111-111111111111";
    private const string SecondId = "22222222-2222-4222-8222-222222222222";
    private static readonly DateTime UpdatedAt = new(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Get_by_id_maps_found_products_and_preserves_missing_result()
    {
        var product = Product.FromPersistence(FirstId, "TEC-001", "Teclado", "BRL", 20_000, true, 2, UpdatedAt);
        var repository = new StubProductRepository([product]);
        var queries = new ProductQueries(repository);

        var result = await queries.GetByIdAsync(FirstId, CancellationToken.None);
        var missing = await queries.GetByIdAsync(SecondId, CancellationToken.None);

        Assert.Equal(FirstId, result?.Id);
        Assert.Equal("Teclado", result?.Name);
        Assert.Equal(UpdatedAt, result?.UpdatedAt.UtcDateTime);
        Assert.Null(missing);
        Assert.Equal(2, repository.FindByIdCalls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task List_maps_products_and_calculates_zero_or_rounded_up_page_counts()
    {
        var products = new[]
        {
            Product.FromPersistence(FirstId, "TEC-001", "Teclado", "BRL", 20_000, true, 1, UpdatedAt),
            Product.FromPersistence(SecondId, "MOU-001", "Mouse", "BRL", 10_000, true, 1, UpdatedAt)
        };
        var queries = new ProductQueries(new StubProductRepository(products, totalItems: 3));

        var result = await queries.ListActiveAsync(1, 2, CancellationToken.None);
        var empty = await new ProductQueries(new StubProductRepository([], totalItems: 0))
            .ListActiveAsync(1, 2, CancellationToken.None);

        Assert.Equal(2, result.Data.Count);
        Assert.Equal(2, result.Meta.TotalPages);
        Assert.Equal(0, empty.Meta.TotalPages);
        Assert.Empty(empty.Data);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Batch_sorts_products_and_missing_ids_without_filtering_inactive_products()
    {
        var inactive = Product.FromPersistence(SecondId, "MOU-001", "Mouse", "BRL", 10_000, false, 1, UpdatedAt);
        var first = Product.FromPersistence(FirstId, "TEC-001", "Teclado", "BRL", 20_000, true, 1, UpdatedAt);
        var repository = new StubProductRepository([inactive, first]);
        var queries = new ProductQueries(repository);
        var absentId = "33333333-3333-4333-8333-333333333333";

        var result = await queries.QueryByIdsAsync([SecondId, absentId, FirstId], CancellationToken.None);

        Assert.Equal(new[] { FirstId, SecondId }, result.Products.Select(product => product.Id));
        Assert.False(result.Products[1].Active);
        Assert.Equal(new[] { absentId }, result.MissingProductIds);
        Assert.Equal(1, repository.FindByIdsCalls);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Batch_rejects_duplicate_and_unrequested_repository_ids()
    {
        var first = Product.FromPersistence(FirstId, "TEC-001", "Teclado", "BRL", 20_000, true, 1, UpdatedAt);
        var duplicateRepository = new StubProductRepository([first]);
        var duplicateError = await Assert.ThrowsAsync<DuplicateProductIdsException>(() =>
            new ProductQueries(duplicateRepository).QueryByIdsAsync([FirstId, SecondId, FirstId], CancellationToken.None));
        Assert.Equal(new[] { FirstId }, duplicateError.DuplicateIds);
        Assert.Equal(0, duplicateRepository.FindByIdsCalls);

        var unrequested = await Assert.ThrowsAsync<InvalidDataException>(() =>
            new ProductQueries(new StubProductRepository([first]))
                .QueryByIdsAsync([SecondId], CancellationToken.None));
        Assert.Equal("MongoDB returned an unrequested product.", unrequested.Message);
    }

    private sealed class StubProductRepository(
        IReadOnlyList<Product> products,
        long totalItems = 0) : IProductRepository
    {
        public int FindByIdCalls { get; private set; }
        public int FindByIdsCalls { get; private set; }

        public Task<Product?> FindByIdAsync(string id, CancellationToken cancellationToken)
        {
            FindByIdCalls++;
            return Task.FromResult(products.FirstOrDefault(product => product.Id == id));
        }

        public Task<(IReadOnlyList<Product> Products, long TotalItems)> FindActivePageAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken) => Task.FromResult<(IReadOnlyList<Product>, long)>(
                (products.Where(product => product.Active).Take(pageSize).ToArray(), totalItems));

        public Task<IReadOnlyList<Product>> FindByIdsAsync(
            IReadOnlyList<string> ids,
            CancellationToken cancellationToken)
        {
            FindByIdsCalls++;
            return Task.FromResult(products);
        }
    }
}
