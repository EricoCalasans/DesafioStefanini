using System.Text;
using System.Text.RegularExpressions;

namespace Catalog.Domain.Products;

public sealed record Product(
    string Id,
    string Sku,
    string Name,
    string Currency,
    long PriceCents,
    bool Active,
    int PriceVersion,
    DateTimeOffset UpdatedAt)
{
    private static readonly Regex ProductIdPattern = new(
        "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\z",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static bool IsCanonicalId(string? value) =>
        value is not null && ProductIdPattern.IsMatch(value);

    public static bool HasValidText(string? value, int maximumCodePoints)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var codePoints = 0;
        foreach (var rune in value.EnumerateRunes())
        {
            if (rune.Value <= 0x1F || rune.Value == 0x7F)
            {
                return false;
            }

            codePoints++;
            if (codePoints > maximumCodePoints)
            {
                return false;
            }
        }

        return codePoints > 0;
    }

    public static Product FromPersistence(
        string id,
        string sku,
        string name,
        string currency,
        long priceCents,
        bool active,
        int priceVersion,
        DateTime updatedAt)
    {
        if (!IsCanonicalId(id) ||
            !HasValidText(sku, 40) ||
            !HasValidText(name, 120) ||
            !string.Equals(currency, "BRL", StringComparison.Ordinal) ||
            priceCents is < 1 or > 100_000_000 ||
            priceVersion < 1 ||
            updatedAt.Kind != DateTimeKind.Utc)
        {
            throw new InvalidDataException("A persisted product does not satisfy the catalog domain rules.");
        }

        return new Product(
            id,
            sku,
            name,
            currency,
            priceCents,
            active,
            priceVersion,
            new DateTimeOffset(updatedAt, TimeSpan.Zero));
    }
}
