using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Auth;
using Property_Management_Api.Exceptions;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var tenants = await _tenantService.GetAllAsync(cancellationToken);
        return Ok(tenants);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpGet("{tenantId:int}")]
    public async Task<IActionResult> GetById(int tenantId, CancellationToken cancellationToken)
    {
        var tenant = await _tenantService.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
        {
            return NotFound();
        }

        return Ok(tenant);
    }

    [AuthorizeRoles(UserRoles.Tenant)]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyTenant(CancellationToken cancellationToken)
    {
        var authUserId = User.GetRequiredAuthUserId();
        var tenant = await _tenantService.GetByAuthUserIdAsync(
            authUserId,
            User.GetEmailAddress(),
            cancellationToken);

        if (tenant is null)
        {
            return Forbid();
        }

        var claimedTenantId = User.GetTenantId();
        if (claimedTenantId.HasValue && claimedTenantId.Value != tenant.TenantId)
        {
            return Forbid();
        }

        return Ok(tenant);
    }

    [AuthorizeRoles(UserRoles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateTenantRequest request,
        CancellationToken cancellationToken)
    {
        var createdTenant = await _tenantService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { tenantId = createdTenant.TenantId }, createdTenant);
    }

    [AuthorizeRoles(UserRoles.Admin)]
    [HttpPut("{tenantId:int}")]
    public async Task<IActionResult> Update(
        int tenantId,
        [FromBody] UpdateTenantRequest request,
        CancellationToken cancellationToken)
    {
        var updatedTenant = await _tenantService.UpdateAsync(tenantId, request, cancellationToken);

        if (updatedTenant is null)
        {
            return NotFound();
        }

        return Ok(updatedTenant);
    }

    [AuthorizeRoles(UserRoles.Admin)]
    [HttpDelete("{tenantId:int}")]
    public async Task<IActionResult> Delete(int tenantId, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _tenantService.DeleteAsync(tenantId, cancellationToken);

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
