using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public interface IMaintenanceService
{
    Task<IReadOnlyCollection<MaintenanceProjectResponse>> GetProjectsAsync(CancellationToken cancellationToken);
    Task<MaintenanceProjectResponse?> GetProjectByIdAsync(int projectId, CancellationToken cancellationToken);
    Task<MaintenanceProjectResponse> CreateProjectAsync(CreateMaintenanceProjectRequest request, CancellationToken cancellationToken);
    Task<MaintenanceProjectResponse?> UpdateProjectAsync(int projectId, UpdateMaintenanceProjectRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteProjectAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<WorkLogResponse>> GetWorkLogsAsync(int projectId, CancellationToken cancellationToken);
    Task<WorkLogResponse> CreateWorkLogAsync(int projectId, CreateWorkLogRequest request, CancellationToken cancellationToken);
}
