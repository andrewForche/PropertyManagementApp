using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Core.Interfaces.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;

    public PropertiesController(IPropertyService propertyService)
    {
        _propertyService = propertyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var properties = await _propertyService.GetAllAsync(cancellationToken);
        return Ok(properties);
    }
}
