using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Exceptions;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public sealed class MaintenanceDataService : IMaintenanceDataService
{
    private readonly string _connectionString;

    public MaintenanceDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<MaintenanceProjectResponse>> GetProjectsAsync(CancellationToken cancellationToken)
    {
        const string sql = ProjectSelectSql + """
            ORDER BY mp.ProjectId DESC;
            """;

        var projects = new List<MaintenanceProjectResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            projects.Add(MapProject(reader));
        }

        return projects;
    }

    public async Task<MaintenanceProjectResponse?> GetProjectByIdAsync(int projectId, CancellationToken cancellationToken)
    {
        const string sql = ProjectSelectSql + """
            WHERE mp.ProjectId = @ProjectId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return MapProject(reader);
        }

        return null;
    }

    public async Task<MaintenanceProjectResponse> CreateProjectAsync(CreateMaintenanceProjectRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO MaintenanceProjects (
                PropertyId,
                ProjectTitle,
                ProjectDescription,
                BidAmount,
                ProjectStatus,
                AssignedVendor
            )
            VALUES (
                @PropertyId,
                @ProjectTitle,
                @ProjectDescription,
                @BidAmount,
                @ProjectStatus,
                @AssignedVendor
            );

            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        AddProjectParameters(command, request.PropertyId, request.ProjectTitle, request.ProjectDescription, request.BidAmount, request.ProjectStatus, request.AssignedVendor);

        var createdProjectId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return await GetProjectByIdAsync(createdProjectId, cancellationToken)
            ?? throw new InvalidOperationException("Maintenance project insert did not return a created record.");
    }

    public async Task<MaintenanceProjectResponse?> UpdateProjectAsync(
        int projectId,
        UpdateMaintenanceProjectRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE MaintenanceProjects
            SET
                PropertyId = @PropertyId,
                ProjectTitle = @ProjectTitle,
                ProjectDescription = @ProjectDescription,
                BidAmount = @BidAmount,
                ProjectStatus = @ProjectStatus,
                AssignedVendor = @AssignedVendor
            WHERE ProjectId = @ProjectId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);
        AddProjectParameters(command, request.PropertyId, request.ProjectTitle, request.ProjectDescription, request.BidAmount, request.ProjectStatus, request.AssignedVendor);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affectedRows == 0)
        {
            return null;
        }

        return await GetProjectByIdAsync(projectId, cancellationToken);
    }

    public async Task<bool> DeleteProjectAsync(int projectId, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM MaintenanceProjects
            WHERE ProjectId = @ProjectId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        if (await HasInvoiceDependenciesAsync(connection, projectId, cancellationToken))
        {
            throw new DeleteConflictException(
                "This maintenance project cannot be deleted because invoice records are still tied to it.");
        }

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        return affectedRows > 0;
    }

    private static async Task<bool> HasInvoiceDependenciesAsync(
        MySqlConnection connection,
        int projectId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM Invoices
                WHERE ProjectId = @ProjectId
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    public async Task<IReadOnlyCollection<WorkLogResponse>> GetAllWorkLogsAsync(CancellationToken cancellationToken)
    {
        const string sql = WorkLogSelectSql + """
            ORDER BY wl.ClockInTime DESC, wl.WorkLogId DESC;
            """;

        var workLogs = new List<WorkLogResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            workLogs.Add(MapWorkLog(reader));
        }

        return workLogs;
    }

    public async Task<IReadOnlyCollection<WorkLogResponse>> GetWorkLogsAsync(int projectId, CancellationToken cancellationToken)
    {
        const string sql = WorkLogSelectSql + """
            WHERE wl.ProjectId = @ProjectId
            ORDER BY wl.ClockInTime DESC, wl.WorkLogId DESC;
            """;

        var workLogs = new List<WorkLogResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            workLogs.Add(MapWorkLog(reader));
        }

        return workLogs;
    }

    public async Task<WorkLogResponse> CreateWorkLogAsync(int projectId, CreateWorkLogRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO WorkLogs (
                ProjectId,
                ClockInTime,
                ClockOutTime,
                GPSLocation,
                ProofPhotoUrl,
                WorkNotes
            )
            VALUES (
                @ProjectId,
                @ClockInTime,
                @ClockOutTime,
                @GPSLocation,
                @ProofPhotoUrl,
                @WorkNotes
            );

            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ProjectId", projectId);
        command.Parameters.AddWithValue("@ClockInTime", request.ClockInTime);
        command.Parameters.AddWithValue("@ClockOutTime", request.ClockOutTime.HasValue ? request.ClockOutTime.Value : DBNull.Value);
        command.Parameters.AddWithValue("@GPSLocation", string.IsNullOrWhiteSpace(request.GpsLocation) ? DBNull.Value : request.GpsLocation);
        command.Parameters.AddWithValue("@ProofPhotoUrl", string.IsNullOrWhiteSpace(request.ProofPhotoUrl) ? DBNull.Value : request.ProofPhotoUrl);
        command.Parameters.AddWithValue("@WorkNotes", string.IsNullOrWhiteSpace(request.WorkNotes) ? DBNull.Value : request.WorkNotes);

        var createdWorkLogId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return await GetWorkLogByIdAsync(createdWorkLogId, cancellationToken)
            ?? throw new InvalidOperationException("Work log insert did not return a created record.");
    }

    private async Task<WorkLogResponse?> GetWorkLogByIdAsync(int workLogId, CancellationToken cancellationToken)
    {
        const string sql = WorkLogSelectSql + """
            WHERE wl.WorkLogId = @WorkLogId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@WorkLogId", workLogId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapWorkLog(reader);
        }

        return null;
    }

    private static void AddProjectParameters(
        MySqlCommand command,
        int propertyId,
        string projectTitle,
        string? projectDescription,
        decimal? bidAmount,
        string projectStatus,
        string? assignedVendor)
    {
        command.Parameters.AddWithValue("@PropertyId", propertyId);
        command.Parameters.AddWithValue("@ProjectTitle", projectTitle);
        command.Parameters.AddWithValue("@ProjectDescription", string.IsNullOrWhiteSpace(projectDescription) ? DBNull.Value : projectDescription);
        command.Parameters.AddWithValue("@BidAmount", bidAmount.HasValue ? bidAmount.Value : DBNull.Value);
        command.Parameters.AddWithValue("@ProjectStatus", projectStatus);
        command.Parameters.AddWithValue("@AssignedVendor", string.IsNullOrWhiteSpace(assignedVendor) ? DBNull.Value : assignedVendor);
    }

    private static MaintenanceProjectResponse MapProject(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");
        var projectDescriptionOrdinal = reader.GetOrdinal("ProjectDescription");
        var bidAmountOrdinal = reader.GetOrdinal("BidAmount");
        var assignedVendorOrdinal = reader.GetOrdinal("AssignedVendor");

        return new MaintenanceProjectResponse
        {
            ProjectId = reader.GetInt32("ProjectId"),
            PropertyId = reader.GetInt32("PropertyId"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            ProjectTitle = reader.GetString("ProjectTitle"),
            ProjectDescription = reader.IsDBNull(projectDescriptionOrdinal) ? null : reader.GetString("ProjectDescription"),
            BidAmount = reader.IsDBNull(bidAmountOrdinal) ? null : reader.GetDecimal("BidAmount"),
            ProjectStatus = reader.GetString("ProjectStatus"),
            AssignedVendor = reader.IsDBNull(assignedVendorOrdinal) ? null : reader.GetString("AssignedVendor"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
            UpdatedAt = reader.GetDateTime("UpdatedAt"),
        };
    }

    private static WorkLogResponse MapWorkLog(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");
        var assignedVendorOrdinal = reader.GetOrdinal("AssignedVendor");
        var clockOutTimeOrdinal = reader.GetOrdinal("ClockOutTime");
        var gpsLocationOrdinal = reader.GetOrdinal("GPSLocation");
        var proofPhotoUrlOrdinal = reader.GetOrdinal("ProofPhotoUrl");
        var workNotesOrdinal = reader.GetOrdinal("WorkNotes");

        return new WorkLogResponse
        {
            WorkLogId = reader.GetInt32("WorkLogId"),
            ProjectId = reader.GetInt32("ProjectId"),
            ProjectTitle = reader.GetString("ProjectTitle"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            AssignedVendor = reader.IsDBNull(assignedVendorOrdinal) ? null : reader.GetString("AssignedVendor"),
            ProjectStatus = reader.GetString("ProjectStatus"),
            ClockInTime = reader.GetDateTime("ClockInTime"),
            ClockOutTime = reader.IsDBNull(clockOutTimeOrdinal) ? null : reader.GetDateTime("ClockOutTime"),
            GpsLocation = reader.IsDBNull(gpsLocationOrdinal) ? null : reader.GetString("GPSLocation"),
            ProofPhotoUrl = reader.IsDBNull(proofPhotoUrlOrdinal) ? null : reader.GetString("ProofPhotoUrl"),
            WorkNotes = reader.IsDBNull(workNotesOrdinal) ? null : reader.GetString("WorkNotes"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
        };
    }

    private const string ProjectSelectSql = """
        SELECT
            mp.ProjectId,
            mp.PropertyId,
            p.PropertyName,
            p.AddressLine1,
            p.UnitNumber,
            mp.ProjectTitle,
            mp.ProjectDescription,
            mp.BidAmount,
            mp.ProjectStatus,
            mp.AssignedVendor,
            mp.CreatedAt,
            mp.UpdatedAt
        FROM MaintenanceProjects mp
        INNER JOIN Properties p ON p.PropertyId = mp.PropertyId
        
        """;

    private const string WorkLogSelectSql = """
        SELECT
            wl.WorkLogId,
            wl.ProjectId,
            mp.ProjectTitle,
            p.PropertyName,
            p.AddressLine1,
            p.UnitNumber,
            mp.AssignedVendor,
            mp.ProjectStatus,
            wl.ClockInTime,
            wl.ClockOutTime,
            wl.GPSLocation,
            wl.ProofPhotoUrl,
            wl.WorkNotes,
            wl.CreatedAt
        FROM WorkLogs wl
        INNER JOIN MaintenanceProjects mp ON mp.ProjectId = wl.ProjectId
        INNER JOIN Properties p ON p.PropertyId = mp.PropertyId
        
        """;
}
