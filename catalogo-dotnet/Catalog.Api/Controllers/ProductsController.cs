using System.Globalization;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Catalog.Api.Errors;
using Catalog.Application.Products;
using Catalog.Domain.Products;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
public sealed class ProductsController(ProductQueries products) : ControllerBase
{
    private static readonly Regex DecimalPattern = new("^[0-9]+$", RegexOptions.CultureInvariant | RegexOptions.Compiled);

    [HttpGet]
    [ProducesResponseType<ProductPageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status503ServiceUnavailable, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status500InternalServerError, "application/problem+json")]
    public async Task<ActionResult<ProductPageResponse>> List(CancellationToken cancellationToken)
    {
        var (page, pageSize) = ParsePagination();
        return Ok(await products.ListActiveAsync(page, pageSize, cancellationToken));
    }

    [HttpGet("{productId}")]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status503ServiceUnavailable, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status500InternalServerError, "application/problem+json")]
    public async Task<ActionResult<ProductResponse>> GetById(string productId, CancellationToken cancellationToken)
    {
        if (!Product.IsCanonicalId(productId))
        {
            throw new ApiException(400, "VALIDATION_ERROR", "Requisição inválida",
                "productId deve ser um UUID canônico em letras minúsculas.",
                [new ApiFieldError("productId", "INVALID_PRODUCT_ID", "Informe um UUID canônico válido.")]);
        }

        var product = await products.GetByIdAsync(productId, cancellationToken);
        if (product is null)
        {
            throw new ApiException(404, "PRODUCT_NOT_FOUND", "Produto não encontrado",
                "Não existe produto com o identificador informado.");
        }

        return Ok(product);
    }

    [HttpPost("query")]
    [Consumes("application/json")]
    [ProducesResponseType<ProductQueryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status413PayloadTooLarge, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status415UnsupportedMediaType, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status422UnprocessableEntity, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status503ServiceUnavailable, "application/problem+json")]
    [ProducesResponseType(typeof(ApiProblem), StatusCodes.Status500InternalServerError, "application/problem+json")]
    public async Task<ActionResult<ProductQueryResponse>> Query(
        [FromBody] ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ProductIds is null || request.ProductIds.Count is < 1 or > 100)
        {
            throw new ApiException(400, "VALIDATION_ERROR", "Requisição inválida",
                "productIds deve conter entre 1 e 100 identificadores.",
                [new ApiFieldError("productIds", "INVALID_PRODUCT_IDS", "Informe entre 1 e 100 UUIDs.")]);
        }

        HttpContext.Items[RequestLoggingMiddleware.BatchItemCountKey] = request.ProductIds.Count;

        var invalidIds = request.ProductIds
            .Select((id, index) => (Id: id, Index: index))
            .Where(item => !Product.IsCanonicalId(item.Id))
            .Select(item => new ApiFieldError($"productIds[{item.Index}]", "INVALID_PRODUCT_ID",
                "Informe um UUID canônico válido."))
            .ToArray();
        if (invalidIds.Length > 0)
        {
            throw new ApiException(400, "VALIDATION_ERROR", "Requisição inválida",
                "Um ou mais identificadores de produto são inválidos.", invalidIds);
        }

        return Ok(await products.QueryByIdsAsync(request.ProductIds, cancellationToken));
    }

    private (int Page, int PageSize) ParsePagination()
    {
        var allowed = new HashSet<string>(["page", "pageSize"], StringComparer.Ordinal);
        var unknown = Request.Query.Keys.Where(key => !allowed.Contains(key)).ToArray();
        if (unknown.Length > 0)
        {
            throw new ApiException(400, "VALIDATION_ERROR", "Parâmetro inválido",
                "A consulta contém parâmetros não reconhecidos.",
                unknown.Select(key => new ApiFieldError(key, "UNKNOWN_QUERY_PARAMETER", "Parâmetro não permitido.")).ToArray());
        }

        var page = ParseInteger("page", defaultValue: 1, minimum: 1, maximum: 1_000_000);
        var pageSize = ParseInteger("pageSize", defaultValue: 20, minimum: 1, maximum: 100);
        return (page, pageSize);
    }

    private int ParseInteger(string name, int defaultValue, int minimum, int maximum)
    {
        if (!Request.Query.TryGetValue(name, out var values))
        {
            return defaultValue;
        }

        if (values.Count != 1 || !DecimalPattern.IsMatch(values[0] ?? string.Empty) ||
            !int.TryParse(values[0], NumberStyles.None, CultureInfo.InvariantCulture, out var value) ||
            value < minimum || value > maximum)
        {
            throw new ApiException(400, "VALIDATION_ERROR", "Parâmetro inválido",
                $"{name} deve ser um inteiro decimal entre {minimum} e {maximum}.",
                [new ApiFieldError(name, "INVALID_QUERY_PARAMETER", "Informe um valor dentro do intervalo permitido.")]);
        }

        return value;
    }
}

public sealed record ProductQueryRequest([param: Required] IReadOnlyList<string>? ProductIds);
