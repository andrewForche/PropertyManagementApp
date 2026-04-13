using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Property_Management_Api.Configuration;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApiSettings _apiSettings;

    public HealthController(IOptions<ApiSettings> apiSettings)
    {
        _apiSettings = apiSettings.Value;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Ready",
            service = _apiSettings.ApplicationName,
            environment = _apiSettings.EnvironmentName,
            message = "API scaffold is configured and waiting for database integration."
        });
    }
}
