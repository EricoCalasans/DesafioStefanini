using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Catalog.Application.Products;
using Catalog.Domain.Products;
using Catalog.Infrastructure.Products;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Catalog.Tests.Unit;

public sealed class ProductsApiTests
{
    private const string FirstId = "11111111-1111-4111-8111-111111111111";
    private const string SecondId = "22222222-2222-4222-8222-222222222222";
    private const string InactiveId = "44444444-4444-4444-8444-444444444444";
    private readonly Product[] _products =
    [
        Product.FromPersistence(FirstId, "TEC-001", "Teclado", "BRL", 20_000, true, 1,
            DateTime.SpecifyKind(new DateTime(2026, 10, 21, 12, 0, 0), DateTimeKind.Utc)),
        Product.FromPersistence(SecondId, "MOU-001", "Mouse", "BRL", 10_000, true, 1,
            DateTime.SpecifyKind(new DateTime(2026, 10, 21, 12, 0, 0), DateTimeKind.Utc)),
        Product.FromPersistence(InactiveId, "INA-001", "Produto inativo", "BRL", 5_000, false, 1,
            DateTime.SpecifyKind(new DateTime(2026, 10, 21, 12, 0, 0), DateTimeKind.Utc))
    ];
    private int _batchQueryCalls;

    [Fact]
    [Trait("Category", "Unit")]
    public async Task List_returns_only_active_products_in_id_order_with_pagination_metadata()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/v1/products?page=1&pageSize=1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.Equal(FirstId, body.RootElement.GetProperty("data")[0].GetProperty("id").GetString());
        Assert.Equal(2, body.RootElement.GetProperty("meta").GetProperty("totalItems").GetInt32());
        Assert.Equal(2, body.RootElement.GetProperty("meta").GetProperty("totalPages").GetInt32());
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Batch_returns_inactive_products_and_classifies_missing_ids()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/products/query")
        {
            Content = JsonContent.Create(new { productIds = new[] { SecondId, "33333333-3333-4333-8333-333333333333", InactiveId, FirstId } })
        };
        request.Headers.Add("X-Correlation-Id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

        using var response = await client.SendAsync(request);

        Assert.Equal(1, _batchQueryCalls);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", response.Headers.GetValues("X-Correlation-Id").Single());
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var returnedProducts = body.RootElement.GetProperty("products");
        Assert.Equal(4, returnedProducts.GetArrayLength() + body.RootElement.GetProperty("missingProductIds").GetArrayLength());
        Assert.Equal(FirstId, returnedProducts[0].GetProperty("id").GetString());
        Assert.Equal(SecondId, returnedProducts[1].GetProperty("id").GetString());
        Assert.Equal(InactiveId, returnedProducts[2].GetProperty("id").GetString());
        Assert.False(returnedProducts[2].GetProperty("active").GetBoolean());
        Assert.Equal("33333333-3333-4333-8333-333333333333",
            body.RootElement.GetProperty("missingProductIds")[0].GetString());
        Assert.True(DateTimeOffset.TryParse(body.RootElement.GetProperty("observedAt").GetString(), out _));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Duplicate_ids_return_422_problem_details()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/v1/products/query",
            new { productIds = new[] { FirstId, FirstId } });

        Assert.Equal(0, _batchQueryCalls);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.Equal("DUPLICATE_PRODUCT_IDS", body.RootElement.GetProperty("code").GetString());
        Assert.True(Guid.TryParse(body.RootElement.GetProperty("traceId").GetString(), out _));
    }

    [Theory]
    [InlineData("/api/v1/products?page=0", "VALIDATION_ERROR")]
    [InlineData("/api/v1/products?page=1&page=2", "VALIDATION_ERROR")]
    [InlineData("/api/v1/products?unexpected=true", "VALIDATION_ERROR")]
    [Trait("Category", "Unit")]
    public async Task Invalid_pagination_parameters_return_problem_details(string path, string expectedCode)
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(expectedCode, await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Unknown_json_fields_are_rejected()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        using var content = new StringContent($"{{\"productIds\":[\"{FirstId}\"],\"filter\":{{\"$where\":\"true\"}}}}");
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        using var response = await client.PostAsync("/api/v1/products/query", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("VALIDATION_ERROR", await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Malformed_json_returns_invalid_json_problem()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        using var content = new StringContent("{\"productIds\":[");
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        using var response = await client.PostAsync("/api/v1/products/query", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("INVALID_JSON", await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Batch_rejects_more_than_one_hundred_ids_before_querying()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/v1/products/query",
            new { productIds = Enumerable.Repeat(FirstId, 101).ToArray() });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("VALIDATION_ERROR", await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Batch_accepts_one_hundred_unique_ids_with_one_application_lookup()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var ids = Enumerable.Range(0, 100).Select(_ => Guid.NewGuid().ToString("D")).ToArray();

        using var response = await client.PostAsJsonAsync("/api/v1/products/query", new { productIds = ids });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, _batchQueryCalls);
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.Equal(100, body.RootElement.GetProperty("products").GetArrayLength() +
            body.RootElement.GetProperty("missingProductIds").GetArrayLength());
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Empty_catalog_returns_zero_pages_and_an_empty_data_array()
    {
        using var factory = CreateFactory(products: []);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/v1/products?page=9");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.Empty(body.RootElement.GetProperty("data").EnumerateArray());
        Assert.Equal(0, body.RootElement.GetProperty("meta").GetProperty("totalPages").GetInt32());
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Swagger_documents_problem_media_separately_from_success_json()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var query = document.RootElement.GetProperty("paths")
            .GetProperty("/api/v1/products/query").GetProperty("post");
        var successMedia = query.GetProperty("responses").GetProperty("200")
            .GetProperty("content").EnumerateObject().Select(property => property.Name).ToArray();
        var errorMedia = query.GetProperty("responses").GetProperty("400")
            .GetProperty("content").EnumerateObject().Select(property => property.Name).ToArray();
        Assert.Contains("application/json", successMedia);
        Assert.Contains("application/problem+json", errorMedia);
        Assert.DoesNotContain("application/json", errorMedia);
        Assert.True(query.GetProperty("responses").TryGetProperty("500", out _));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Unsupported_media_type_returns_problem_details()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        using var content = new StringContent($"{{\"productIds\":[\"{FirstId}\"]}}");
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");

        using var response = await client.PostAsync("/api/v1/products/query", content);

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
        Assert.Equal("UNSUPPORTED_MEDIA_TYPE", await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Oversized_body_returns_problem_details()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        using var content = new ByteArrayContent(new byte[65_537]);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        using var response = await client.PostAsync("/api/v1/products/query", content);

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Equal("PAYLOAD_TOO_LARGE", await ReadCodeAsync(response));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Invalid_and_unknown_product_ids_return_stable_errors()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        using var invalid = await client.GetAsync("/api/v1/products/NOT-A-UUID");
        using var missing = await client.GetAsync("/api/v1/products/33333333-3333-4333-8333-333333333333");

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Equal("VALIDATION_ERROR", await ReadCodeAsync(invalid));
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal("PRODUCT_NOT_FOUND", await ReadCodeAsync(missing));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Persistence_failure_is_sanitized_and_correlated()
    {
        using var factory = CreateFactory(new CatalogPersistenceException(new InvalidOperationException("password=secret")));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Correlation-Id", "not-a-uuid");

        using var response = await client.GetAsync("/api/v1/products");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var correlation = response.Headers.GetValues("X-Correlation-Id").Single();
        Assert.True(Guid.TryParse(correlation, out _));
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.Equal("PERSISTENCE_UNAVAILABLE", body.RootElement.GetProperty("code").GetString());
        Assert.Equal(correlation, body.RootElement.GetProperty("traceId").GetString());
        Assert.DoesNotContain("secret", body.RootElement.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    private WebApplicationFactory<Program> CreateFactory(
        Exception? repositoryException = null,
        IReadOnlyList<Product>? products = null)
    {
        var originalUri = Environment.GetEnvironmentVariable("CATALOG_MONGODB_URI");
        var originalDatabase = Environment.GetEnvironmentVariable("CATALOG_MONGODB_DATABASE");
        Environment.SetEnvironmentVariable("CATALOG_MONGODB_URI", "mongodb://localhost:27017");
        Environment.SetEnvironmentVariable("CATALOG_MONGODB_DATABASE", "catalog_api_tests");

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseContentRoot(AppContext.BaseDirectory);
            builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["CATALOG_MONGODB_URI"] = "mongodb://localhost:27017",
                    ["CATALOG_MONGODB_DATABASE"] = "catalog_api_tests"
                }));
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IProductRepository>();
                services.AddSingleton<IProductRepository>(new StubProductRepository(
                    products ?? _products,
                    repositoryException,
                    () => Interlocked.Increment(ref _batchQueryCalls)));
            });
        });

        try
        {
            using var warmup = factory.CreateClient();
        }
        catch
        {
            factory.Dispose();
            throw;
        }
        finally
        {
            Environment.SetEnvironmentVariable("CATALOG_MONGODB_URI", originalUri);
            Environment.SetEnvironmentVariable("CATALOG_MONGODB_DATABASE", originalDatabase);
        }

        return factory;
    }

    private static async Task<string?> ReadCodeAsync(HttpResponseMessage response)
    {
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        return body.RootElement.GetProperty("code").GetString();
    }

    private sealed class StubProductRepository(
        IReadOnlyList<Product> products,
        Exception? failure,
        Action onBatchQuery) : IProductRepository
    {
        public Task<Product?> FindByIdAsync(string id, CancellationToken cancellationToken)
        {
            ThrowIfRequested();
            return Task.FromResult(products.FirstOrDefault(product => product.Id == id));
        }

        public Task<(IReadOnlyList<Product> Products, long TotalItems)> FindActivePageAsync(
            int page, int pageSize, CancellationToken cancellationToken)
        {
            ThrowIfRequested();
            var active = products.Where(product => product.Active)
                .OrderBy(product => product.Id, StringComparer.Ordinal).ToArray();
            var pageItems = active.Skip((page - 1) * pageSize).Take(pageSize).ToArray();
            return Task.FromResult<(IReadOnlyList<Product>, long)>((pageItems, active.Length));
        }

        public Task<IReadOnlyList<Product>> FindByIdsAsync(
            IReadOnlyList<string> ids, CancellationToken cancellationToken) =>
            FindByIdsCore(ids);

        private Task<IReadOnlyList<Product>> FindByIdsCore(IReadOnlyList<string> ids)
        {
            ThrowIfRequested();
            onBatchQuery();
            return Task.FromResult<IReadOnlyList<Product>>(
                products.Where(product => ids.Contains(product.Id, StringComparer.Ordinal)).ToArray());
        }

        private void ThrowIfRequested()
        {
            if (failure is not null)
            {
                throw failure;
            }
        }
    }
}
