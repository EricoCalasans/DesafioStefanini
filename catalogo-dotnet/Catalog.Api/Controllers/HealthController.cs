using Catalog.Application.Health;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(ICatalogReadiness readiness) : ControllerBase
{
    [HttpGet("live")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Live() => Ok(new
    {
        status = "UP",
        service = "catalog",
        checks = Array.Empty<object>()
    });

    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        try
        {
            await readiness.CheckAsync(cancellationToken);
            return Ok(new
            {
                status = "UP",
                service = "catalog",
                checks = new[] { new { name = "mongo", status = "UP" } }
            });
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "DOWN",
                service = "catalog",
                checks = new[] { new { name = "mongo", status = "DOWN" } }
            });
        }
    }
}
