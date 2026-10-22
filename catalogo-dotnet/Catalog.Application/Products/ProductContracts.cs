namespace Catalog.Application.Products;

public sealed record ProductResponse(
    string Id,
    string Sku,
    string Name,
    string Currency,
    long PriceCents,
    bool Active,
    int PriceVersion,
    DateTimeOffset UpdatedAt);

public sealed record PaginationResponse(
    int Page,
    int PageSize,
    long TotalItems,
    long TotalPages);

public sealed record ProductPageResponse(
    IReadOnlyList<ProductResponse> Data,
    PaginationResponse Meta);

public sealed record ProductQueryResponse(
    IReadOnlyList<ProductResponse> Products,
    IReadOnlyList<string> MissingProductIds,
    DateTimeOffset ObservedAt);

public sealed class DuplicateProductIdsException : Exception
{
    public DuplicateProductIdsException(IReadOnlyList<string> duplicateIds)
        : base("Product IDs in a batch query must be unique.")
    {
        DuplicateIds = duplicateIds;
    }

    public IReadOnlyList<string> DuplicateIds { get; }
}
