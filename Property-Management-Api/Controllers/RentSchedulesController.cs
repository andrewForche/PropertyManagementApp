using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Auth;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/rent-schedules")]
public class RentSchedulesController : ControllerBase
{
    private readonly IRentCollectionService _rentCollectionService;

    public RentSchedulesController(IRentCollectionService rentCollectionService)
    {
        _rentCollectionService = rentCollectionService;
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var schedules = await _rentCollectionService.GetSchedulesAsync(cancellationToken);
        return Ok(schedules);
    }

    [AuthorizeRoles(UserRoles.Tenant)]
    [HttpGet("me")]
    public async Task<IActionResult> GetMySchedules(
        [FromServices] ITenantService tenantService,
        CancellationToken cancellationToken)
    {
        var tenant = await tenantService.GetByAuthUserIdAsync(
            User.GetRequiredAuthUserId(),
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

        var schedules = await _rentCollectionService.GetSchedulesForTenantAsync(
            tenant.TenantId,
            cancellationToken);

        return Ok(schedules);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpPut("{scheduleId:int}")]
    public async Task<IActionResult> Update(
        int scheduleId,
        [FromBody] UpdateRentScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var updatedSchedule = await _rentCollectionService.UpdateScheduleAsync(scheduleId, request, cancellationToken);

        if (updatedSchedule is null)
        {
            return NotFound();
        }

        return Ok(updatedSchedule);
    }
}
