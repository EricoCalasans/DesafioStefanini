using System.Text.Json.Serialization;

namespace Catalog.Api.Errors;

public sealed record ApiProblem(
    string Type,
    string Title,
    int Status,
    string Detail,
    string Instance,
    string Code,
    string TraceId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    IReadOnlyList<ApiFieldError>? Errors = null);

public sealed record ApiFieldError(
    string Field,
    string Code,
    string Message,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? ProductId = null);

public sealed class ApiException(
    int status,
    string code,
    string title,
    string detail,
    IReadOnlyList<ApiFieldError>? errors = null)
    : Exception(detail)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public string Title { get; } = title;
    public string Detail { get; } = detail;
    public IReadOnlyList<ApiFieldError>? Errors { get; } = errors;
}

public static class ApiProblems
{
    public static ApiProblem Create(HttpContext context, int status, string code, string title, string detail,
        IReadOnlyList<ApiFieldError>? errors = null) =>
        new("about:blank", title, status, detail, context.Request.Path.Value ?? "/", code,
            context.TraceIdentifier, errors);

    public static IResult Result(HttpContext context, int status, string code, string title, string detail,
        IReadOnlyList<ApiFieldError>? errors = null) =>
        Results.Json(Create(context, status, code, title, detail, errors), statusCode: status,
            contentType: "application/problem+json");
}
