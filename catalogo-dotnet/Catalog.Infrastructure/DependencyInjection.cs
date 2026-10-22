using Catalog.Application.Health;
using Catalog.Application.Products;
using Catalog.Infrastructure.Health;
using Catalog.Infrastructure.Products;
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

        if (string.IsNullOrWhiteSpace(databaseName) || databaseName.Length > 63 ||
            databaseName.IndexOfAny(['/', '\\', '.', '"', '$', '*', '<', '>', ':', '|', '?', '\0']) >= 0)
        {
            throw new InvalidOperationException(
                "CATALOG_MONGODB_DATABASE must be a valid MongoDB database name up to 63 characters.");
        }

        MongoClientSettings settings;
        try
        {
            settings = MongoClientSettings.FromConnectionString(connectionString);
        }
        catch (MongoConfigurationException)
        {
            throw new InvalidOperationException("CATALOG_MONGODB_URI is invalid.");
        }

        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(1);
        services.AddSingleton<IMongoClient>(_ => new MongoClient(settings));
        services.AddSingleton(provider =>
            provider.GetRequiredService<IMongoClient>().GetDatabase(databaseName));
        services.AddSingleton<ICatalogReadiness, MongoCatalogReadiness>();
        services.AddSingleton<IProductRepository, MongoProductRepository>();
        services.AddScoped<ProductQueries>();

        return services;
    }
}
