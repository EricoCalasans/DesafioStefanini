using System.Text;
using System.Text.Json;
using Catalog.Api.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.Tests.Unit;

public sealed class CatalogRequestValidationMiddlewareTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Skips_non_query_requests_and_non_post_methods()
    {
        var nonPost = await InvokeAsync(HttpMethods.Get, "/api/v1/products/query", "{}", "application/json");
        var otherPath = await InvokeAsync(HttpMethods.Post, "/api/v1/products", "{}", "application/json");

        Assert.Equal(1, nonPost.NextCalls);
        Assert.Equal(1, otherPath.NextCalls);
        Assert.Equal(StatusCodes.Status200OK, nonPost.Context.Response.StatusCode);
        Assert.Equal(StatusCodes.Status200OK, otherPath.Context.Response.StatusCode);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Rejects_declared_body_larger_than_the_limit_before_reading_it()
    {
        var result = await InvokeAsync(
            HttpMethods.Post,
            "/api/v1/products/query",
            "{}",
            "application/json",
            contentLength: 65_537);

        Assert.Equal(0, result.NextCalls);
        Assert.Equal(StatusCodes.Status413PayloadTooLarge, result.Context.Response.StatusCode);
        Assert.Equal("PAYLOAD_TOO_LARGE", result.Problem?.Code);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Rejects_missing_or_unsupported_media_type()
    {
        foreach (var mediaType in new string?[] { null, "text/plain" })
        {
            var result = await InvokeAsync(HttpMethods.Post, "/api/v1/products/query", "{}", mediaType);

            Assert.Equal(0, result.NextCalls);
            Assert.Equal(StatusCodes.Status415UnsupportedMediaType, result.Context.Response.StatusCode);
            Assert.Equal("UNSUPPORTED_MEDIA_TYPE", result.Problem?.Code);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Accepts_json_with_parameters_and_restores_the_request_body()
    {
        string? receivedBody = null;
        var result = await InvokeAsync(
            HttpMethods.Post,
            "/API/v1/PRODUCTS/query/",
            "{\"productIds\":[]}",
            "application/json; charset=utf-8",
            next: async context =>
            {
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                receivedBody = await reader.ReadToEndAsync();
            });

        Assert.Equal(1, result.NextCalls);
        Assert.Equal("{\"productIds\":[]}", receivedBody);
        Assert.Equal(StatusCodes.Status200OK, result.Context.Response.StatusCode);
        Assert.Null(result.Context.Response.ContentType);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Rejects_malformed_json_and_oversized_streams_without_content_length()
    {
        var malformed = await InvokeAsync(HttpMethods.Post, "/api/v1/products/query", "{", "application/json");
        var oversized = await InvokeAsync(
            HttpMethods.Post,
            "/api/v1/products/query",
            new string('x', 65_537),
            "application/json",
            useComputedLength: false);

        Assert.Equal(0, malformed.NextCalls);
        Assert.Equal(StatusCodes.Status400BadRequest, malformed.Context.Response.StatusCode);
        Assert.Equal("INVALID_JSON", malformed.Problem?.Code);
        Assert.Equal(0, oversized.NextCalls);
        Assert.Equal(StatusCodes.Status413PayloadTooLarge, oversized.Context.Response.StatusCode);
        Assert.Equal("PAYLOAD_TOO_LARGE", oversized.Problem?.Code);
    }

    private static async Task<(DefaultHttpContext Context, int NextCalls, ApiProblem? Problem)> InvokeAsync(
        string method,
        string path,
        string body,
        string? contentType,
        long? contentLength = null,
        bool useComputedLength = true,
        RequestDelegate? next = null)
    {
        var context = new DefaultHttpContext();
        context.RequestServices = new ServiceCollection().AddOptions().AddLogging().BuildServiceProvider();
        context.Request.Method = method;
        context.Request.Path = path;
        context.Request.ContentType = contentType;
        context.Request.ContentLength = useComputedLength
            ? contentLength ?? Encoding.UTF8.GetByteCount(body)
            : null;
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        context.Response.Body = new MemoryStream();
        var nextCalls = 0;
        var middleware = new CatalogRequestValidationMiddleware(async request =>
        {
            nextCalls++;
            if (next is not null)
            {
                await next(request);
            }
        });

        await middleware.InvokeAsync(context);
        ApiProblem? problem = null;
        if (context.Response.Body.Length > 0)
        {
            context.Response.Body.Position = 0;
            problem = await JsonSerializer.DeserializeAsync<ApiProblem>(context.Response.Body, JsonOptions);
        }

        return (context, nextCalls, problem);
    }
}
