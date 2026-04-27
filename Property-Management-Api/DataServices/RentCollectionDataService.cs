using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public sealed class RentCollectionDataService : IRentCollectionDataService
{
    private readonly string _connectionString;

    public RentCollectionDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<RentScheduleResponse>> GetSchedulesAsync(CancellationToken cancellationToken)
    {
        const string sql = RentScheduleSelectSql + """
            ORDER BY rs.DueDate DESC, rs.ScheduleId ASC;
            """;

        return await QuerySchedulesAsync(sql, null, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RentScheduleResponse>> GetSchedulesForTenantAsync(int tenantId, CancellationToken cancellationToken)
    {
        const string sql = RentScheduleSelectSql + """
            WHERE rs.TenantId = @TenantId
            ORDER BY rs.DueDate DESC, rs.ScheduleId ASC;
            """;

        return await QuerySchedulesAsync(sql, command => command.Parameters.AddWithValue("@TenantId", tenantId), cancellationToken);
    }

    public async Task<RentScheduleResponse?> UpdateScheduleAsync(
        int scheduleId,
        UpdateRentScheduleRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE RentSchedules
            SET
                ScheduleStatus = @ScheduleStatus,
                LateFeeAmount = @LateFeeAmount,
                BalanceDue = @BalanceDue,
                ReminderCount = @ReminderCount
            WHERE ScheduleId = @ScheduleId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ScheduleId", scheduleId);
        command.Parameters.AddWithValue("@ScheduleStatus", request.ScheduleStatus);
        command.Parameters.AddWithValue("@LateFeeAmount", request.LateFeeAmount);
        command.Parameters.AddWithValue("@BalanceDue", request.BalanceDue);
        command.Parameters.AddWithValue("@ReminderCount", request.ReminderCount);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

        if (affectedRows == 0)
        {
            return null;
        }

        return await GetScheduleByIdAsync(scheduleId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RentPaymentResponse>> GetPaymentsAsync(CancellationToken cancellationToken)
    {
        const string sql = RentPaymentSelectSql + """
            ORDER BY rp.PaymentDate DESC, rp.PaymentId DESC;
            """;

        return await QueryPaymentsAsync(sql, null, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RentPaymentResponse>> GetPaymentsForTenantAsync(int tenantId, CancellationToken cancellationToken)
    {
        const string sql = RentPaymentSelectSql + """
            WHERE rs.TenantId = @TenantId
            ORDER BY rp.PaymentDate DESC, rp.PaymentId DESC;
            """;

        return await QueryPaymentsAsync(sql, command => command.Parameters.AddWithValue("@TenantId", tenantId), cancellationToken);
    }

    public async Task<RentPaymentResponse> CreatePaymentAsync(
        CreateRentPaymentRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO RentPayments (
                ScheduleId,
                AmountPaid,
                PaymentMethod,
                PaymentDate,
                ReferenceNumber
            )
            VALUES (
                @ScheduleId,
                @AmountPaid,
                @PaymentMethod,
                @PaymentDate,
                @ReferenceNumber
            );
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ScheduleId", request.ScheduleId);
        command.Parameters.AddWithValue("@AmountPaid", request.AmountPaid);
        command.Parameters.AddWithValue("@PaymentMethod", request.PaymentMethod);
        command.Parameters.AddWithValue("@PaymentDate", request.PaymentDate);
        command.Parameters.AddWithValue("@ReferenceNumber", string.IsNullOrWhiteSpace(request.ReferenceNumber) ? DBNull.Value : request.ReferenceNumber);

        await command.ExecuteNonQueryAsync(cancellationToken);

        return await GetLatestPaymentForScheduleAsync(request.ScheduleId, cancellationToken)
            ?? throw new InvalidOperationException("Payment insert did not return a created record.");
    }

    public async Task RefreshScheduleBalanceAsync(int scheduleId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE RentSchedules rs
            LEFT JOIN (
                SELECT ScheduleId, COALESCE(SUM(AmountPaid), 0) AS TotalPaid
                FROM RentPayments
                WHERE ScheduleId = @ScheduleId
                GROUP BY ScheduleId
            ) rp ON rp.ScheduleId = rs.ScheduleId
            SET
                rs.BalanceDue = GREATEST((rs.BaseRent + rs.LateFeeAmount) - COALESCE(rp.TotalPaid, 0), 0),
                rs.ScheduleStatus = CASE
                    WHEN GREATEST((rs.BaseRent + rs.LateFeeAmount) - COALESCE(rp.TotalPaid, 0), 0) = 0 THEN 'Paid'
                    WHEN COALESCE(rp.TotalPaid, 0) > 0 THEN 'Partial'
                    ELSE rs.ScheduleStatus
                END
            WHERE rs.ScheduleId = @ScheduleId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ScheduleId", scheduleId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<RentScheduleResponse?> GetScheduleByIdAsync(int scheduleId, CancellationToken cancellationToken)
    {
        const string sql = RentScheduleSelectSql + """
            WHERE rs.ScheduleId = @ScheduleId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ScheduleId", scheduleId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapSchedule(reader);
        }

        return null;
    }

    private async Task<RentPaymentResponse?> GetLatestPaymentForScheduleAsync(int scheduleId, CancellationToken cancellationToken)
    {
        const string sql = RentPaymentSelectSql + """
            WHERE rp.ScheduleId = @ScheduleId
            ORDER BY rp.PaymentId DESC
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ScheduleId", scheduleId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapPayment(reader);
        }

        return null;
    }

    private async Task<IReadOnlyCollection<RentScheduleResponse>> QuerySchedulesAsync(
        string sql,
        Action<MySqlCommand>? configureCommand,
        CancellationToken cancellationToken)
    {
        var schedules = new List<RentScheduleResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        configureCommand?.Invoke(command);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            schedules.Add(MapSchedule(reader));
        }

        return schedules;
    }

    private async Task<IReadOnlyCollection<RentPaymentResponse>> QueryPaymentsAsync(
        string sql,
        Action<MySqlCommand>? configureCommand,
        CancellationToken cancellationToken)
    {
        var payments = new List<RentPaymentResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        configureCommand?.Invoke(command);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            payments.Add(MapPayment(reader));
        }

        return payments;
    }

    private static RentScheduleResponse MapSchedule(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");

        return new RentScheduleResponse
        {
            ScheduleId = reader.GetInt32("ScheduleId"),
            TenantId = reader.GetInt32("TenantId"),
            TenantName = reader.GetString("TenantName"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            DueDate = reader.GetDateTime("DueDate"),
            ScheduleStatus = reader.GetString("ScheduleStatus"),
            BaseRent = reader.GetDecimal("BaseRent"),
            LateFeeAmount = reader.GetDecimal("LateFeeAmount"),
            BalanceDue = reader.GetDecimal("BalanceDue"),
            ReminderCount = reader.GetInt32("ReminderCount"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
            UpdatedAt = reader.GetDateTime("UpdatedAt")
        };
    }

    private static RentPaymentResponse MapPayment(MySqlDataReader reader)
    {
        var referenceNumberOrdinal = reader.GetOrdinal("ReferenceNumber");

        return new RentPaymentResponse
        {
            PaymentId = reader.GetInt32("PaymentId"),
            ScheduleId = reader.GetInt32("ScheduleId"),
            TenantName = reader.GetString("TenantName"),
            AmountPaid = reader.GetDecimal("AmountPaid"),
            PaymentMethod = reader.GetString("PaymentMethod"),
            PaymentDate = reader.GetDateTime("PaymentDate"),
            ReferenceNumber = reader.IsDBNull(referenceNumberOrdinal) ? null : reader.GetString("ReferenceNumber")
        };
    }

    private const string RentScheduleSelectSql = """
        SELECT
            rs.ScheduleId,
            rs.TenantId,
            CONCAT(t.FirstName, ' ', t.LastName) AS TenantName,
            p.PropertyName,
            p.AddressLine1,
            p.UnitNumber,
            rs.DueDate,
            rs.ScheduleStatus,
            rs.BaseRent,
            rs.LateFeeAmount,
            rs.BalanceDue,
            rs.ReminderCount,
            rs.CreatedAt,
            rs.UpdatedAt
        FROM RentSchedules rs
        INNER JOIN Tenants t ON t.TenantId = rs.TenantId
        INNER JOIN Properties p ON p.PropertyId = t.PropertyId
        
        """;

    private const string RentPaymentSelectSql = """
        SELECT
            rp.PaymentId,
            rp.ScheduleId,
            CONCAT(t.FirstName, ' ', t.LastName) AS TenantName,
            rp.AmountPaid,
            rp.PaymentMethod,
            rp.PaymentDate,
            rp.ReferenceNumber
        FROM RentPayments rp
        INNER JOIN RentSchedules rs ON rs.ScheduleId = rp.ScheduleId
        INNER JOIN Tenants t ON t.TenantId = rs.TenantId
        
        """;
}
