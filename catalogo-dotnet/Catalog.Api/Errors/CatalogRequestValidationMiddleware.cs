using System.Text.Json;

namespace Catalog.Api.Errors;

public sealed class CatalogRequestValidationMiddleware(RequestDelegate next)
{
    private const int MaximumBodyBytes = 65_536;
    private const string QueryPath = "/api/v1/products/query";

    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsPost(context.Request.Method) ||
            !context.Request.Path.Equals(QueryPath, StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (context.Request.ContentLength is > MaximumBodyBytes)
        {
            await RespondAsync(context, 413, "PAYLOAD_TOO_LARGE", "Requisição muito grande",
                "O corpo da requisição excede o limite de 64 KiB.");
            return;
        }

        var mediaType = context.Request.ContentType?.Split(';', 2)[0].Trim();
        if (!string.Equals(mediaType, "application/json", StringComparison.OrdinalIgnoreCase))
        {
            await RespondAsync(context, 415, "UNSUPPORTED_MEDIA_TYPE", "Tipo de mídia não suportado",
                "Use Content-Type application/json.");
            return;
        }

        await using var buffer = new MemoryStream();
        var chunk = new byte[8_192];
        var total = 0;
        while (true)
        {
            var read = await context.Request.Body.ReadAsync(chunk, context.RequestAborted);
            if (read == 0)
            {
                break;
            }

            total += read;
            if (total > MaximumBodyBytes)
            {
                await RespondAsync(context, 413, "PAYLOAD_TOO_LARGE", "Requisição muito grande",
                    "O corpo da requisição excede o limite de 64 KiB.");
                return;
            }

            await buffer.WriteAsync(chunk.AsMemory(0, read), context.RequestAborted);
        }

        buffer.Position = 0;
        try
        {
            using var document = await JsonDocument.ParseAsync(buffer, cancellationToken: context.RequestAborted);
        }
        catch (JsonException)
        {
            await RespondAsync(context, 400, "INVALID_JSON", "JSON inválido",
                "O corpo da requisição não contém JSON válido.");
            return;
        }

        buffer.Position = 0;
        var originalBody = context.Request.Body;
        context.Request.Body = buffer;
        try
        {
            await next(context);
        }
        finally
        {
            context.Request.Body = originalBody;
        }
    }

    private static Task RespondAsync(HttpContext context, int status, string code, string title, string detail) =>
        ApiProblems.Result(context, status, code, title, detail).ExecuteAsync(context);
}
