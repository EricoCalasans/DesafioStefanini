namespace Catalog.Application.Health;

public interface ICatalogReadiness
{
    Task CheckAsync(CancellationToken cancellationToken);
}
