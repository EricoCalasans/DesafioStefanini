using Catalog.Application.Health;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(ICatalogReadiness readiness) : ControllerBase
{
    [HttpGet("live")]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    public IActionResult Live() => Ok(new HealthResponse("UP", "catalog", []));

    [HttpGet("ready")]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        try
        {
            await readiness.CheckAsync(cancellationToken);
            return Ok(new HealthResponse("UP", "catalog", [new HealthCheck("mongo", "UP")]));
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new HealthResponse("DOWN", "catalog", [new HealthCheck("mongo", "DOWN")]));
        }
    }
}

public sealed record HealthResponse(string Status, string Service, IReadOnlyList<HealthCheck> Checks);

public sealed record HealthCheck(string Name, string Status);
