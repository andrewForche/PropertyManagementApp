using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Auth;
using Property_Management_Api.Exceptions;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/maintenance-projects")]
public class MaintenanceProjectsController : ControllerBase
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceProjectsController(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord, UserRoles.Contractor)]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var projects = await _maintenanceService.GetProjectsAsync(cancellationToken);
        return Ok(projects);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord, UserRoles.Contractor)]
    [HttpGet("{projectId:int}")]
    public async Task<IActionResult> GetById(int projectId, CancellationToken cancellationToken)
    {
        var project = await _maintenanceService.GetProjectByIdAsync(projectId, cancellationToken);

        if (project is null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateMaintenanceProjectRequest request,
        CancellationToken cancellationToken)
    {
        var createdProject = await _maintenanceService.CreateProjectAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { projectId = createdProject.ProjectId }, createdProject);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpPut("{projectId:int}")]
    public async Task<IActionResult> Update(
        int projectId,
        [FromBody] UpdateMaintenanceProjectRequest request,
        CancellationToken cancellationToken)
    {
        var updatedProject = await _maintenanceService.UpdateProjectAsync(projectId, request, cancellationToken);

        if (updatedProject is null)
        {
            return NotFound();
        }

        return Ok(updatedProject);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpDelete("{projectId:int}")]
    public async Task<IActionResult> Delete(int projectId, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _maintenanceService.DeleteProjectAsync(projectId, cancellationToken);

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

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord, UserRoles.Contractor)]
    [HttpGet("{projectId:int}/work-logs")]
    public async Task<IActionResult> GetWorkLogs(int projectId, CancellationToken cancellationToken)
    {
        var workLogs = await _maintenanceService.GetWorkLogsAsync(projectId, cancellationToken);
        return Ok(workLogs);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Contractor)]
    [HttpPost("{projectId:int}/work-logs")]
    public async Task<IActionResult> CreateWorkLog(
        int projectId,
        [FromBody] CreateWorkLogRequest request,
        CancellationToken cancellationToken)
    {
        var createdWorkLog = await _maintenanceService.CreateWorkLogAsync(projectId, request, cancellationToken);
        return Ok(createdWorkLog);
    }
}
