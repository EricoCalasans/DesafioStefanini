using Catalog.Application.Products;
using Catalog.Domain.Products;
using MongoDB.Driver;

namespace Catalog.Infrastructure.Products;

internal sealed class MongoProductRepository(IMongoDatabase database) : IProductRepository
{
    private static readonly TimeSpan QueryMaximumTime = TimeSpan.FromSeconds(1);
    private readonly IMongoCollection<ProductDocument> _products =
        database.GetCollection<ProductDocument>("products");

    public async Task<Product?> FindByIdAsync(
        string id,
        CancellationToken cancellationToken)
    {
        var document = await ExecuteAsync(
            token => _products
                .Find(product => product.Id == id,
                    new FindOptions { MaxTime = QueryMaximumTime })
                .FirstOrDefaultAsync(token),
            cancellationToken);

        return document is null ? null : ToDomain(document);
    }

    public async Task<(IReadOnlyList<Product> Products, long TotalItems)> FindActivePageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var filter = Builders<ProductDocument>.Filter.Eq(product => product.Active, true);
        var total = await ExecuteAsync(
            token => _products.CountDocumentsAsync(
                filter,
                new CountOptions { MaxTime = QueryMaximumTime },
                token),
            cancellationToken);
        var offset = checked((page - 1) * pageSize);
        var documents = await ExecuteAsync(
            token => _products
                .Find(filter, new FindOptions { MaxTime = QueryMaximumTime })
                .SortBy(product => product.Id)
                .Skip(offset)
                .Limit(pageSize)
                .Project<ProductDocument>(Builders<ProductDocument>.Projection
                    .Include(product => product.Id)
                    .Include(product => product.Sku)
                    .Include(product => product.Name)
                    .Include(product => product.Currency)
                    .Include(product => product.PriceCents)
                    .Include(product => product.Active)
                    .Include(product => product.PriceVersion)
                    .Include(product => product.UpdatedAt))
                .ToListAsync(token),
            cancellationToken);

        return (documents.Select(ToDomain).ToArray(), total);
    }

    public async Task<IReadOnlyList<Product>> FindByIdsAsync(
        IReadOnlyList<string> ids,
        CancellationToken cancellationToken)
    {
        var filter = Builders<ProductDocument>.Filter.In(product => product.Id, ids);
        var documents = await ExecuteAsync(
            token => _products
                .Find(filter, new FindOptions { MaxTime = QueryMaximumTime })
                .Project<ProductDocument>(Builders<ProductDocument>.Projection
                    .Include(product => product.Id)
                    .Include(product => product.Sku)
                    .Include(product => product.Name)
                    .Include(product => product.Currency)
                    .Include(product => product.PriceCents)
                    .Include(product => product.Active)
                    .Include(product => product.PriceVersion)
                    .Include(product => product.UpdatedAt))
                .ToListAsync(token),
            cancellationToken);

        return documents.Select(ToDomain).ToArray();
    }

    private static Product ToDomain(ProductDocument document)
    {
        try
        {
            return Product.FromPersistence(
                document.Id,
                document.Sku,
                document.Name,
                document.Currency,
                document.PriceCents,
                document.Active,
                document.PriceVersion,
                document.UpdatedAt);
        }
        catch (InvalidDataException exception)
        {
            throw new InvalidDataException(
                "MongoDB contains a product outside the catalog domain.",
                exception);
        }
    }

    private static async Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> action,
        CancellationToken cancellationToken)
    {
        try
        {
            return await action(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (MongoException exception)
        {
            throw new CatalogPersistenceException(exception);
        }
    }
}

public sealed class CatalogPersistenceException(Exception innerException)
    : Exception("Catalog persistence is unavailable.", innerException);
