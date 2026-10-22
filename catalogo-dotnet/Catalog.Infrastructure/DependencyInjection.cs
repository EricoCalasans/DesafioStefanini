using Catalog.Application.Health;
using Catalog.Infrastructure.Health;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;

namespace Catalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCatalogInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration["CATALOG_MONGODB_URI"];
        var databaseName = configuration["CATALOG_MONGODB_DATABASE"];

        if (string.IsNullOrWhiteSpace(connectionString) ||
            !(connectionString.StartsWith("mongodb://", StringComparison.Ordinal) ||
              connectionString.StartsWith("mongodb+srv://", StringComparison.Ordinal)))
        {
            throw new InvalidOperationException("CATALOG_MONGODB_URI must be a MongoDB connection string.");
        }

        if (string.IsNullOrWhiteSpace(databaseName) || databaseName.Length > 63)
        {
            throw new InvalidOperationException("CATALOG_MONGODB_DATABASE must be a database name up to 63 characters.");
        }

        var settings = MongoClientSettings.FromConnectionString(connectionString);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(2);
        services.AddSingleton<IMongoClient>(_ => new MongoClient(settings));
        services.AddSingleton(provider =>
            provider.GetRequiredService<IMongoClient>().GetDatabase(databaseName));
        services.AddSingleton<ICatalogReadiness, MongoCatalogReadiness>();

        return services;
    }
}
