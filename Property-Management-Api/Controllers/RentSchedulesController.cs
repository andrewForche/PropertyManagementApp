using Microsoft.AspNetCore.Mvc;
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

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var schedules = await _rentCollectionService.GetSchedulesAsync(cancellationToken);
        return Ok(schedules);
    }

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
