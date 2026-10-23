using Catalog.Domain.Products;

namespace Catalog.Tests.Unit;

public sealed class ProductDomainTests
{
    private const string ProductId = "abcdefab-cdef-4abc-8def-abcdefabcdef";

    [Fact]
    [Trait("Category", "Unit")]
    public void Canonical_ids_require_lowercase_uuid_text_and_reject_control_suffixes()
    {
        Assert.True(Product.IsCanonicalId(ProductId));
        Assert.False(Product.IsCanonicalId(null));
        Assert.False(Product.IsCanonicalId("not-a-uuid"));
        Assert.False(Product.IsCanonicalId(ProductId.ToUpperInvariant()));
        Assert.False(Product.IsCanonicalId(ProductId + "\n"));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Text_validation_counts_unicode_code_points_and_rejects_blank_or_control_text()
    {
        Assert.True(Product.HasValidText(string.Concat(Enumerable.Repeat("😀", 40)), 40));
        Assert.False(Product.HasValidText(string.Concat(Enumerable.Repeat("😀", 41)), 40));
        Assert.True(Product.HasValidText("Produto — ação", 120));
        Assert.False(Product.HasValidText(null, 40));
        Assert.False(Product.HasValidText(string.Empty, 40));
        Assert.False(Product.HasValidText("   ", 40));
        Assert.False(Product.HasValidText("before\u0000after", 40));
        Assert.False(Product.HasValidText("before\u001fafter", 40));
        Assert.False(Product.HasValidText("before\u007fafter", 40));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Persistence_mapping_returns_a_valid_utc_domain_product()
    {
        var instant = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);

        var product = Product.FromPersistence(ProductId, "TEC-001", "Teclado", "BRL", 20_000, true, 2, instant);

        Assert.Equal(ProductId, product.Id);
        Assert.Equal("TEC-001", product.Sku);
        Assert.Equal("Teclado", product.Name);
        Assert.Equal(20_000, product.PriceCents);
        Assert.Equal(2, product.PriceVersion);
        Assert.Equal(TimeSpan.Zero, product.UpdatedAt.Offset);
    }

    [Theory]
    [InlineData("id")]
    [InlineData("sku")]
    [InlineData("name")]
    [InlineData("currency")]
    [InlineData("price-zero")]
    [InlineData("price-overflow")]
    [InlineData("version")]
    [InlineData("timestamp-kind")]
    [Trait("Category", "Unit")]
    public void Persistence_mapping_rejects_values_outside_domain_rules(string invalidField)
    {
        var id = ProductId;
        var sku = "TEC-001";
        var name = "Teclado";
        var currency = "BRL";
        var price = 20_000L;
        var version = 1;
        var updatedAt = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);

        switch (invalidField)
        {
            case "id": id = ProductId.ToUpperInvariant(); break;
            case "sku": sku = new string('S', 41); break;
            case "name": name = new string('N', 121); break;
            case "currency": currency = "USD"; break;
            case "price-zero": price = 0; break;
            case "price-overflow": price = 100_000_001; break;
            case "version": version = 0; break;
            case "timestamp-kind": updatedAt = DateTime.SpecifyKind(updatedAt, DateTimeKind.Local); break;
            default: throw new ArgumentOutOfRangeException(nameof(invalidField));
        }

        Assert.Throws<InvalidDataException>(() =>
            Product.FromPersistence(id, sku, name, currency, price, true, version, updatedAt));
    }
}
