using MongoDB.Bson.Serialization.Attributes;

namespace Catalog.Infrastructure.Products;

[BsonIgnoreExtraElements]
internal sealed class ProductDocument
{
    [BsonId]
    [BsonElement("_id")]
    public string Id { get; init; } = string.Empty;

    [BsonElement("sku")]
    public string Sku { get; init; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("currency")]
    public string Currency { get; init; } = string.Empty;

    [BsonElement("priceCents")]
    public long PriceCents { get; init; }

    [BsonElement("active")]
    public bool Active { get; init; }

    [BsonElement("priceVersion")]
    public int PriceVersion { get; init; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; init; }
}
