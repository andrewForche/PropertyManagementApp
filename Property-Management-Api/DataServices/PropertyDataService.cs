using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Exceptions;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public sealed class PropertyDataService : IPropertyDataService
{
    private readonly string _connectionString;

    public PropertyDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<PropertyResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                PropertyId,
                PropertyName,
                AddressLine1,
                UnitNumber,
                MonthlyRent,
                OccupancyStatus,
                CreatedAt,
                UpdatedAt
            FROM Properties
            ORDER BY PropertyId;
            """;

        var properties = new List<PropertyResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            properties.Add(MapProperty(reader));
        }

        return properties;
    }

    public async Task<PropertyResponse?> GetByIdAsync(int propertyId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                PropertyId,
                PropertyName,
                AddressLine1,
                UnitNumber,
                MonthlyRent,
                OccupancyStatus,
                CreatedAt,
                UpdatedAt
            FROM Properties
            WHERE PropertyId = @PropertyId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PropertyId", propertyId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return MapProperty(reader);
        }

        return null;
    }

    public async Task<PropertyResponse> CreateAsync(CreatePropertyRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO Properties (
                PropertyName,
                AddressLine1,
                UnitNumber,
                MonthlyRent,
                OccupancyStatus
            )
            VALUES (
                @PropertyName,
                @AddressLine1,
                @UnitNumber,
                @MonthlyRent,
                @OccupancyStatus
            );

            SELECT
                PropertyId,
                PropertyName,
                AddressLine1,
                UnitNumber,
                MonthlyRent,
                OccupancyStatus,
                CreatedAt,
                UpdatedAt
            FROM Properties
            WHERE PropertyId = LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        AddPropertyParameters(command, request.PropertyName, request.AddressLine1, request.UnitNumber, request.MonthlyRent, request.OccupancyStatus);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return MapProperty(reader);
        }

        throw new InvalidOperationException("Property insert did not return a created record.");
    }

    public async Task<PropertyResponse?> UpdateAsync(
        int propertyId,
        UpdatePropertyRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE Properties
            SET
                PropertyName = @PropertyName,
                AddressLine1 = @AddressLine1,
                UnitNumber = @UnitNumber,
                MonthlyRent = @MonthlyRent,
                OccupancyStatus = @OccupancyStatus
            WHERE PropertyId = @PropertyId;

            SELECT
                PropertyId,
                PropertyName,
                AddressLine1,
                UnitNumber,
                MonthlyRent,
                OccupancyStatus,
                CreatedAt,
                UpdatedAt
            FROM Properties
            WHERE PropertyId = @PropertyId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PropertyId", propertyId);
        AddPropertyParameters(command, request.PropertyName, request.AddressLine1, request.UnitNumber, request.MonthlyRent, request.OccupancyStatus);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return MapProperty(reader);
        }

        return null;
    }

    public async Task<bool> DeleteAsync(int propertyId, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM Properties
            WHERE PropertyId = @PropertyId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        if (await HasTenantDependenciesAsync(connection, propertyId, cancellationToken))
        {
            throw new DeleteConflictException(
                "This property cannot be deleted because it still has one or more tenants assigned to it.");
        }

        if (await HasMaintenanceDependenciesAsync(connection, propertyId, cancellationToken))
        {
            throw new DeleteConflictException(
                "This property cannot be deleted because it still has maintenance projects tied to it.");
        }

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PropertyId", propertyId);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        return affectedRows > 0;
    }

    private static async Task<bool> HasTenantDependenciesAsync(
        MySqlConnection connection,
        int propertyId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM Tenants
                WHERE PropertyId = @PropertyId
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PropertyId", propertyId);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private static async Task<bool> HasMaintenanceDependenciesAsync(
        MySqlConnection connection,
        int propertyId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM MaintenanceProjects
                WHERE PropertyId = @PropertyId
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PropertyId", propertyId);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private static void AddPropertyParameters(
        MySqlCommand command,
        string propertyName,
        string addressLine1,
        string? unitNumber,
        decimal monthlyRent,
        string occupancyStatus)
    {
        command.Parameters.AddWithValue("@PropertyName", propertyName);
        command.Parameters.AddWithValue("@AddressLine1", addressLine1);
        command.Parameters.AddWithValue("@UnitNumber", string.IsNullOrWhiteSpace(unitNumber) ? DBNull.Value : unitNumber);
        command.Parameters.AddWithValue("@MonthlyRent", monthlyRent);
        command.Parameters.AddWithValue("@OccupancyStatus", occupancyStatus);
    }

    private static PropertyResponse MapProperty(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");

        return new PropertyResponse
        {
            PropertyId = reader.GetInt32("PropertyId"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            MonthlyRent = reader.GetDecimal("MonthlyRent"),
            OccupancyStatus = reader.GetString("OccupancyStatus"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
            UpdatedAt = reader.GetDateTime("UpdatedAt"),
        };
    }
}
