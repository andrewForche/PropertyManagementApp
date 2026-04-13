using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/work-logs")]
public class WorkLogsController : ControllerBase
{
    private readonly IMaintenanceService _maintenanceService;

    public WorkLogsController(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var workLogs = await _maintenanceService.GetAllWorkLogsAsync(cancellationToken);
        return Ok(workLogs);
    }
}
