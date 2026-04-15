using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Exceptions;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

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

    [HttpGet("{propertyId:int}")]
    public async Task<IActionResult> GetById(int propertyId, CancellationToken cancellationToken)
    {
        var property = await _propertyService.GetByIdAsync(propertyId, cancellationToken);

        if (property is null)
        {
            return NotFound();
        }

        return Ok(property);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePropertyRequest request,
        CancellationToken cancellationToken)
    {
        var createdProperty = await _propertyService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { propertyId = createdProperty.PropertyId }, createdProperty);
    }

    [HttpPut("{propertyId:int}")]
    public async Task<IActionResult> Update(
        int propertyId,
        [FromBody] UpdatePropertyRequest request,
        CancellationToken cancellationToken)
    {
        var updatedProperty = await _propertyService.UpdateAsync(propertyId, request, cancellationToken);

        if (updatedProperty is null)
        {
            return NotFound();
        }

        return Ok(updatedProperty);
    }

    [HttpDelete("{propertyId:int}")]
    public async Task<IActionResult> Delete(int propertyId, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _propertyService.DeleteAsync(propertyId, cancellationToken);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (DeleteConflictException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
