using System.Diagnostics;

namespace Catalog.Api.Errors;

public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public const string BatchItemCountKey = "Catalog.BatchItemCount";

    public async Task InvokeAsync(HttpContext context)
    {
        var startedAt = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            context.Items.TryGetValue(BatchItemCountKey, out var itemCount);
            logger.LogInformation(
                "Catalog HTTP request completed. Method={Method} Path={Path} StatusCode={StatusCode} " +
                "DurationMs={DurationMs} CorrelationId={CorrelationId} ProductIdCount={ProductIdCount}",
                context.Request.Method,
                context.Request.Path.Value ?? "/",
                context.Response.StatusCode,
                Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds,
                context.TraceIdentifier,
                itemCount);
        }
    }
}
