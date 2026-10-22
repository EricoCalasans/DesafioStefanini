using Catalog.Application.Health;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Catalog.Infrastructure.Health;

internal sealed class MongoCatalogReadiness(IMongoDatabase database) : ICatalogReadiness
{
    public async Task CheckAsync(CancellationToken cancellationToken)
    {
        await database.RunCommandAsync<BsonDocument>(
            new BsonDocument("ping", 1),
            cancellationToken: cancellationToken);
    }
}
