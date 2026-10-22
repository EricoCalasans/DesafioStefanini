using Catalog.Domain.Products;

namespace Catalog.Application.Products;

public sealed class ProductQueries(IProductRepository repository)
{
    public async Task<ProductResponse?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken)
    {
        var product = await repository.FindByIdAsync(id, cancellationToken);
        return product is null ? null : ToResponse(product);
    }

    public async Task<ProductPageResponse> ListActiveAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var (products, totalItems) = await repository.FindActivePageAsync(
            page,
            pageSize,
            cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (totalItems + pageSize - 1) / pageSize;

        return new ProductPageResponse(
            products.Select(ToResponse).ToArray(),
            new PaginationResponse(page, pageSize, totalItems, totalPages));
    }

    public async Task<ProductQueryResponse> QueryByIdsAsync(
        IReadOnlyList<string> ids,
        CancellationToken cancellationToken)
    {
        var duplicates = ids
            .GroupBy(id => id, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .Order(StringComparer.Ordinal)
            .ToArray();
        if (duplicates.Length > 0)
        {
            throw new DuplicateProductIdsException(duplicates);
        }

        var products = await repository.FindByIdsAsync(ids, cancellationToken);
        var productById = products.ToDictionary(product => product.Id, StringComparer.Ordinal);
        var requested = ids.ToHashSet(StringComparer.Ordinal);

        if (productById.Keys.Any(id => !requested.Contains(id)))
        {
            throw new InvalidDataException("MongoDB returned an unrequested product.");
        }

        var missingIds = ids
            .Where(id => !productById.ContainsKey(id))
            .Order(StringComparer.Ordinal)
            .ToArray();
        var orderedProducts = products
            .OrderBy(product => product.Id, StringComparer.Ordinal)
            .Select(ToResponse)
            .ToArray();

        return new ProductQueryResponse(
            orderedProducts,
            missingIds,
            DateTimeOffset.UtcNow);
    }

    private static ProductResponse ToResponse(Product product) =>
        new(
            product.Id,
            product.Sku,
            product.Name,
            product.Currency,
            product.PriceCents,
            product.Active,
            product.PriceVersion,
            product.UpdatedAt);
}
