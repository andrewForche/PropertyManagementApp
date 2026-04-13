using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public sealed class TenantDataService : ITenantDataService
{
    private readonly string _connectionString;

    public TenantDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<TenantResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = TenantSelectSql + """
            ORDER BY t.TenantId;
            """;

        var tenants = new List<TenantResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            tenants.Add(MapTenant(reader));
        }

        return tenants;
    }

    public async Task<TenantResponse?> GetByIdAsync(int tenantId, CancellationToken cancellationToken)
    {
        const string sql = TenantSelectSql + """
            WHERE t.TenantId = @TenantId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TenantId", tenantId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return MapTenant(reader);
        }

        return null;
    }

    public async Task<TenantResponse> CreateAsync(CreateTenantRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO Tenants (
                FirstName,
                LastName,
                Email,
                PhoneNumber,
                PropertyId,
                LeaseStartDate,
                LeaseEndDate,
                TenantStatus
            )
            VALUES (
                @FirstName,
                @LastName,
                @Email,
                @PhoneNumber,
                @PropertyId,
                @LeaseStartDate,
                @LeaseEndDate,
                @TenantStatus
            );

            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        AddTenantParameters(command, request.FirstName, request.LastName, request.Email, request.PhoneNumber, request.PropertyId, request.LeaseStartDate, request.LeaseEndDate, request.TenantStatus);

        var createdTenantId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return await GetByIdAsync(createdTenantId, cancellationToken)
            ?? throw new InvalidOperationException("Tenant insert did not return a created record.");
    }

    public async Task<TenantResponse?> UpdateAsync(
        int tenantId,
        UpdateTenantRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE Tenants
            SET
                FirstName = @FirstName,
                LastName = @LastName,
                Email = @Email,
                PhoneNumber = @PhoneNumber,
                PropertyId = @PropertyId,
                LeaseStartDate = @LeaseStartDate,
                LeaseEndDate = @LeaseEndDate,
                TenantStatus = @TenantStatus
            WHERE TenantId = @TenantId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TenantId", tenantId);
        AddTenantParameters(command, request.FirstName, request.LastName, request.Email, request.PhoneNumber, request.PropertyId, request.LeaseStartDate, request.LeaseEndDate, request.TenantStatus);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affectedRows == 0)
        {
            return null;
        }

        return await GetByIdAsync(tenantId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM Tenants
            WHERE TenantId = @TenantId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TenantId", tenantId);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        return affectedRows > 0;
    }

    private static void AddTenantParameters(
        MySqlCommand command,
        string firstName,
        string lastName,
        string email,
        string phoneNumber,
        int propertyId,
        DateTime? leaseStartDate,
        DateTime? leaseEndDate,
        string tenantStatus)
    {
        command.Parameters.AddWithValue("@FirstName", firstName);
        command.Parameters.AddWithValue("@LastName", lastName);
        command.Parameters.AddWithValue("@Email", email);
        command.Parameters.AddWithValue("@PhoneNumber", phoneNumber);
        command.Parameters.AddWithValue("@PropertyId", propertyId);
        command.Parameters.AddWithValue("@LeaseStartDate", leaseStartDate.HasValue ? leaseStartDate.Value.Date : DBNull.Value);
        command.Parameters.AddWithValue("@LeaseEndDate", leaseEndDate.HasValue ? leaseEndDate.Value.Date : DBNull.Value);
        command.Parameters.AddWithValue("@TenantStatus", tenantStatus);
    }

    private static TenantResponse MapTenant(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");
        var leaseStartDateOrdinal = reader.GetOrdinal("LeaseStartDate");
        var leaseEndDateOrdinal = reader.GetOrdinal("LeaseEndDate");

        return new TenantResponse
        {
            TenantId = reader.GetInt32("TenantId"),
            FirstName = reader.GetString("FirstName"),
            LastName = reader.GetString("LastName"),
            FullName = reader.GetString("FullName"),
            Email = reader.GetString("Email"),
            PhoneNumber = reader.GetString("PhoneNumber"),
            PropertyId = reader.GetInt32("PropertyId"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            LeaseStartDate = reader.IsDBNull(leaseStartDateOrdinal) ? null : reader.GetDateTime("LeaseStartDate"),
            LeaseEndDate = reader.IsDBNull(leaseEndDateOrdinal) ? null : reader.GetDateTime("LeaseEndDate"),
            TenantStatus = reader.GetString("TenantStatus"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
            UpdatedAt = reader.GetDateTime("UpdatedAt"),
        };
    }

    private const string TenantSelectSql = """
        SELECT
            t.TenantId,
            t.FirstName,
            t.LastName,
            CONCAT(t.FirstName, ' ', t.LastName) AS FullName,
            t.Email,
            t.PhoneNumber,
            t.PropertyId,
            p.PropertyName,
            p.AddressLine1,
            p.UnitNumber,
            t.LeaseStartDate,
            t.LeaseEndDate,
            t.TenantStatus,
            t.CreatedAt,
            t.UpdatedAt
        FROM Tenants t
        INNER JOIN Properties p ON p.PropertyId = t.PropertyId
        
        """;
}
