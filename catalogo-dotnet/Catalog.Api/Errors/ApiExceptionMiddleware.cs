using System.Text.Json;
using Catalog.Application.Products;
using Catalog.Infrastructure.Products;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.Api.Errors;

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // The caller disconnected. Do not attempt to write a response on a closed connection.
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                logger.LogError(exception, "Catalog request failed after the response started. TraceId={TraceId}",
                    context.TraceIdentifier);
                throw;
            }

            var (status, code, title, detail, errors) = Map(exception);
            if (status >= 500)
            {
                logger.LogError(
                    "Catalog request failed. Code={Code} ExceptionType={ExceptionType} TraceId={TraceId}",
                    code,
                    exception.GetType().Name,
                    context.TraceIdentifier);
            }

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await JsonSerializer.SerializeAsync(
                context.Response.Body,
                ApiProblems.Create(context, status, code, title, detail, errors),
                new JsonSerializerOptions(JsonSerializerDefaults.Web),
                context.RequestAborted);
        }
    }

    private static (int Status, string Code, string Title, string Detail, IReadOnlyList<ApiFieldError>? Errors)
        Map(Exception exception)
    {
        if (exception is ApiException api)
        {
            return (api.Status, api.Code, api.Title, api.Detail, api.Errors);
        }

        if (exception is DuplicateProductIdsException duplicates)
        {
            var errors = duplicates.DuplicateIds
                .Select(id => new ApiFieldError("productIds", "DUPLICATE_PRODUCT_ID",
                    "O identificador do produto aparece mais de uma vez.", id))
                .ToArray();
            return (422, "DUPLICATE_PRODUCT_IDS", "IDs de produto duplicados",
                "A lista contém identificadores de produto repetidos.", errors);
        }

        if (exception is CatalogPersistenceException)
        {
            return (503, "PERSISTENCE_UNAVAILABLE", "Catálogo indisponível",
                "Não foi possível consultar os produtos neste momento.", null);
        }

        if (exception is BadHttpRequestException badRequest && badRequest.StatusCode == StatusCodes.Status413PayloadTooLarge)
        {
            return (413, "PAYLOAD_TOO_LARGE", "Requisição muito grande",
                "O corpo da requisição excede o limite de 64 KiB.", null);
        }

        if (exception is JsonException)
        {
            return (400, "INVALID_JSON", "JSON inválido", "O corpo da requisição não contém JSON válido.", null);
        }

        return (500, "INTERNAL_ERROR", "Erro interno", "Não foi possível concluir a requisição.", null);
    }
}

public static class ModelStateProblemFactory
{
    public static IActionResult Create(ActionContext context)
    {
        var hasJsonError = context.ModelState.Values
            .SelectMany(value => value.Errors)
            .Any(error => ContainsJsonException(error.Exception));
        var status = StatusCodes.Status400BadRequest;
        var code = hasJsonError ? "INVALID_JSON" : "VALIDATION_ERROR";
        var title = hasJsonError ? "JSON inválido" : "Requisição inválida";
        var detail = hasJsonError ? "O corpo da requisição não contém JSON válido."
            : "Um ou mais campos da requisição são inválidos.";
        var problem = ApiProblems.Create(context.HttpContext, status, code, title, detail);
        return new ObjectResult(problem)
        {
            StatusCode = status,
            ContentTypes = { "application/problem+json" }
        };
    }

    private static bool ContainsJsonException(Exception? exception) =>
        exception is JsonException || (exception?.InnerException is not null && ContainsJsonException(exception.InnerException));
}
