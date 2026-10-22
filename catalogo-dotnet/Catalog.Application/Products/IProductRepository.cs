using Catalog.Domain.Products;

namespace Catalog.Application.Products;

public interface IProductRepository
{
    Task<Product?> FindByIdAsync(string id, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Product> Products, long TotalItems)> FindActivePageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Product>> FindByIdsAsync(
        IReadOnlyList<string> ids,
        CancellationToken cancellationToken);
}
