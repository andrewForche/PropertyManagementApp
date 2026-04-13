using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class MaintenanceService : IMaintenanceService
{
    private readonly IMaintenanceDataService _maintenanceDataService;

    public MaintenanceService(IMaintenanceDataService maintenanceDataService)
    {
        _maintenanceDataService = maintenanceDataService;
    }

    public Task<IReadOnlyCollection<MaintenanceProjectResponse>> GetProjectsAsync(CancellationToken cancellationToken)
    {
        return _maintenanceDataService.GetProjectsAsync(cancellationToken);
    }

    public Task<MaintenanceProjectResponse?> GetProjectByIdAsync(int projectId, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.GetProjectByIdAsync(projectId, cancellationToken);
    }

    public Task<MaintenanceProjectResponse> CreateProjectAsync(CreateMaintenanceProjectRequest request, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.CreateProjectAsync(request, cancellationToken);
    }

    public Task<MaintenanceProjectResponse?> UpdateProjectAsync(int projectId, UpdateMaintenanceProjectRequest request, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.UpdateProjectAsync(projectId, request, cancellationToken);
    }

    public Task<bool> DeleteProjectAsync(int projectId, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.DeleteProjectAsync(projectId, cancellationToken);
    }

    public Task<IReadOnlyCollection<WorkLogResponse>> GetAllWorkLogsAsync(CancellationToken cancellationToken)
    {
        return _maintenanceDataService.GetAllWorkLogsAsync(cancellationToken);
    }

    public Task<IReadOnlyCollection<WorkLogResponse>> GetWorkLogsAsync(int projectId, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.GetWorkLogsAsync(projectId, cancellationToken);
    }

    public Task<WorkLogResponse> CreateWorkLogAsync(int projectId, CreateWorkLogRequest request, CancellationToken cancellationToken)
    {
        return _maintenanceDataService.CreateWorkLogAsync(projectId, request, cancellationToken);
    }
}
