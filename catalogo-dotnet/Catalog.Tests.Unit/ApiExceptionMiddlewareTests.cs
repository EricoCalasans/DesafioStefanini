using System.Text.Json;
using Catalog.Api.Errors;
using Catalog.Application.Products;
using Catalog.Infrastructure.Products;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging.Abstractions;

namespace Catalog.Tests.Unit;

public sealed class ApiExceptionMiddlewareTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Maps_typed_api_errors_and_preserves_field_details()
    {
        var expectedError = new ApiFieldError("productId", "INVALID_PRODUCT_ID", "UUID inválido.");
        var (context, problem) = await InvokeAsync(new ApiException(
            400, "VALIDATION_ERROR", "Requisição inválida", "Informe um UUID canônico.", [expectedError]));

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        Assert.Equal("VALIDATION_ERROR", problem.Code);
        Assert.Equal("/api/v1/products/invalid", problem.Instance);
        Assert.Equal(expectedError, Assert.Single(problem.Errors!));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Maps_duplicate_ids_in_the_error_details()
    {
        var (_, problem) = await InvokeAsync(new DuplicateProductIdsException(["222", "111"]));

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.Status);
        Assert.Equal("DUPLICATE_PRODUCT_IDS", problem.Code);
        Assert.Equal(new[] { "222", "111" }, problem.Errors!.Select(error => error.ProductId));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Maps_persistence_failures_without_exposing_the_inner_exception()
    {
        var (_, problem) = await InvokeAsync(
            new CatalogPersistenceException(new InvalidOperationException("password=private")));

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, problem.Status);
        Assert.Equal("PERSISTENCE_UNAVAILABLE", problem.Code);
        Assert.DoesNotContain("private", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(413, "PAYLOAD_TOO_LARGE")]
    [InlineData(400, "INVALID_JSON")]
    [Trait("Category", "Unit")]
    public async Task Maps_request_size_and_json_errors(int statusCode, string expectedCode)
    {
        Exception exception = statusCode == StatusCodes.Status413PayloadTooLarge
            ? new BadHttpRequestException("body exceeds the limit", statusCode)
            : new JsonException("malformed body");

        var (context, problem) = await InvokeAsync(exception);

        Assert.Equal(statusCode, context.Response.StatusCode);
        Assert.Equal(expectedCode, problem.Code);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Maps_unexpected_errors_to_a_sanitized_internal_problem()
    {
        var (_, problem) = await InvokeAsync(new InvalidOperationException("private database details"));

        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
        Assert.Equal("INTERNAL_ERROR", problem.Code);
        Assert.Equal("Não foi possível concluir a requisição.", problem.Detail);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Stops_writing_when_the_caller_disconnects()
    {
        using var cancellation = new CancellationTokenSource();
        var context = CreateContext();
        context.RequestAborted = cancellation.Token;
        var middleware = new ApiExceptionMiddleware(_ =>
        {
            cancellation.Cancel();
            return Task.FromException(new OperationCanceledException());
        }, NullLogger<ApiExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(0, context.Response.Body.Length);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Rethrows_when_the_response_has_already_started()
    {
        var context = CreateContext();
        context.Features.Set<IHttpResponseFeature>(new StartedResponseFeature());
        var middleware = new ApiExceptionMiddleware(
            _ => Task.FromException(new InvalidOperationException("late failure")),
            NullLogger<ApiExceptionMiddleware>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(context));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Model_state_factory_distinguishes_nested_json_errors_from_validation_errors()
    {
        var jsonContext = CreateActionContext();
        jsonContext.ModelState.AddModelError("body", "temporary");
        var modelErrors = jsonContext.ModelState["body"]!.Errors;
        modelErrors.Clear();
        modelErrors.Add(new Exception("outer", new JsonException("invalid")));
        var jsonResult = Assert.IsType<ObjectResult>(ModelStateProblemFactory.Create(jsonContext));
        var jsonProblem = Assert.IsType<ApiProblem>(jsonResult.Value);

        var validationContext = CreateActionContext();
        validationContext.ModelState.AddModelError("page", "must be a positive integer");
        var validationResult = Assert.IsType<ObjectResult>(ModelStateProblemFactory.Create(validationContext));
        var validationProblem = Assert.IsType<ApiProblem>(validationResult.Value);

        Assert.Equal("INVALID_JSON", jsonProblem.Code);
        Assert.Equal("VALIDATION_ERROR", validationProblem.Code);
        Assert.Equal("application/problem+json", Assert.Single(jsonResult.ContentTypes));
    }

    private static async Task<(DefaultHttpContext Context, ApiProblem Problem)> InvokeAsync(Exception exception)
    {
        var context = CreateContext();
        var middleware = new ApiExceptionMiddleware(
            _ => Task.FromException(exception),
            NullLogger<ApiExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(context);
        context.Response.Body.Position = 0;
        var problem = await JsonSerializer.DeserializeAsync<ApiProblem>(context.Response.Body, JsonOptions);
        return (context, Assert.IsType<ApiProblem>(problem));
    }

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.TraceIdentifier = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
        context.Request.Path = "/api/v1/products/invalid";
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static ActionContext CreateActionContext() => new(
        CreateContext(),
        new RouteData(),
        new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());

    private sealed class StartedResponseFeature : IHttpResponseFeature
    {
        public int StatusCode { get; set; } = StatusCodes.Status200OK;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = new MemoryStream();
        public bool HasStarted => true;

        public void OnStarting(Func<object, Task> callback, object state) { }
        public void OnCompleted(Func<object, Task> callback, object state) { }
    }
}
