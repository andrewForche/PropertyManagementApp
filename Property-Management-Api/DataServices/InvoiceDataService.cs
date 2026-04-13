using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public sealed class InvoiceDataService : IInvoiceDataService
{
    private readonly string _connectionString;

    public InvoiceDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<InvoiceResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = InvoiceSelectSql + """
            ORDER BY i.InvoiceId DESC;
            """;

        var invoices = new List<InvoiceResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            invoices.Add(MapInvoice(reader));
        }

        return invoices;
    }

    public async Task<InvoiceResponse?> GetByIdAsync(int invoiceId, CancellationToken cancellationToken)
    {
        const string sql = InvoiceSelectSql + """
            WHERE i.InvoiceId = @InvoiceId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@InvoiceId", invoiceId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapInvoice(reader);
        }

        return null;
    }

    public async Task<IReadOnlyCollection<InvoiceProjectOptionResponse>> GetProjectOptionsAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                mp.ProjectId,
                mp.ProjectTitle,
                p.PropertyName,
                p.AddressLine1,
                p.UnitNumber,
                mp.AssignedVendor,
                mp.ProjectStatus
            FROM MaintenanceProjects mp
            INNER JOIN Properties p ON p.PropertyId = mp.PropertyId
            ORDER BY mp.ProjectId DESC;
            """;

        var projects = new List<InvoiceProjectOptionResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            projects.Add(MapProjectOption(reader));
        }

        return projects;
    }

    public async Task<InvoiceResponse> CreateAsync(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO Invoices (
                ProjectId,
                TotalAmount,
                InvoiceStatus,
                IssuedOn,
                PaidOn,
                IsExported
            )
            VALUES (
                @ProjectId,
                @TotalAmount,
                @InvoiceStatus,
                @IssuedOn,
                @PaidOn,
                @IsExported
            );

            UPDATE MaintenanceProjects
            SET ProjectStatus = 'Invoiced'
            WHERE ProjectId = @ProjectId;

            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        AddInvoiceParameters(command, request.ProjectId, request.TotalAmount, request.InvoiceStatus, request.IssuedOn, request.PaidOn, request.IsExported);

        var createdInvoiceId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return await GetByIdAsync(createdInvoiceId, cancellationToken)
            ?? throw new InvalidOperationException("Invoice insert did not return a created record.");
    }

    public async Task<InvoiceResponse?> UpdateAsync(int invoiceId, UpdateInvoiceRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE Invoices
            SET
                ProjectId = @ProjectId,
                TotalAmount = @TotalAmount,
                InvoiceStatus = @InvoiceStatus,
                IssuedOn = @IssuedOn,
                PaidOn = @PaidOn,
                IsExported = @IsExported
            WHERE InvoiceId = @InvoiceId;

            UPDATE MaintenanceProjects
            SET ProjectStatus = 'Invoiced'
            WHERE ProjectId = @ProjectId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@InvoiceId", invoiceId);
        AddInvoiceParameters(command, request.ProjectId, request.TotalAmount, request.InvoiceStatus, request.IssuedOn, request.PaidOn, request.IsExported);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affectedRows == 0)
        {
            return null;
        }

        return await GetByIdAsync(invoiceId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int invoiceId, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM Invoices
            WHERE InvoiceId = @InvoiceId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@InvoiceId", invoiceId);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        return affectedRows > 0;
    }

    private static void AddInvoiceParameters(
        MySqlCommand command,
        int projectId,
        decimal totalAmount,
        string invoiceStatus,
        DateTime? issuedOn,
        DateTime? paidOn,
        bool isExported)
    {
        command.Parameters.AddWithValue("@ProjectId", projectId);
        command.Parameters.AddWithValue("@TotalAmount", totalAmount);
        command.Parameters.AddWithValue("@InvoiceStatus", invoiceStatus);
        command.Parameters.AddWithValue("@IssuedOn", issuedOn.HasValue ? issuedOn.Value.Date : DBNull.Value);
        command.Parameters.AddWithValue("@PaidOn", paidOn.HasValue ? paidOn.Value.Date : DBNull.Value);
        command.Parameters.AddWithValue("@IsExported", isExported);
    }

    private static InvoiceResponse MapInvoice(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");
        var assignedVendorOrdinal = reader.GetOrdinal("AssignedVendor");
        var issuedOnOrdinal = reader.GetOrdinal("IssuedOn");
        var paidOnOrdinal = reader.GetOrdinal("PaidOn");

        return new InvoiceResponse
        {
            InvoiceId = reader.GetInt32("InvoiceId"),
            ProjectId = reader.GetInt32("ProjectId"),
            ProjectTitle = reader.GetString("ProjectTitle"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            AssignedVendor = reader.IsDBNull(assignedVendorOrdinal) ? null : reader.GetString("AssignedVendor"),
            TotalAmount = reader.GetDecimal("TotalAmount"),
            InvoiceStatus = reader.GetString("InvoiceStatus"),
            IssuedOn = reader.IsDBNull(issuedOnOrdinal) ? null : reader.GetDateTime("IssuedOn"),
            PaidOn = reader.IsDBNull(paidOnOrdinal) ? null : reader.GetDateTime("PaidOn"),
            IsExported = reader.GetBoolean("IsExported"),
            CreatedAt = reader.GetDateTime("CreatedAt"),
            UpdatedAt = reader.GetDateTime("UpdatedAt"),
        };
    }

    private static InvoiceProjectOptionResponse MapProjectOption(MySqlDataReader reader)
    {
        var unitNumberOrdinal = reader.GetOrdinal("UnitNumber");
        var assignedVendorOrdinal = reader.GetOrdinal("AssignedVendor");

        return new InvoiceProjectOptionResponse
        {
            ProjectId = reader.GetInt32("ProjectId"),
            ProjectTitle = reader.GetString("ProjectTitle"),
            PropertyName = reader.GetString("PropertyName"),
            AddressLine1 = reader.GetString("AddressLine1"),
            UnitNumber = reader.IsDBNull(unitNumberOrdinal) ? null : reader.GetString("UnitNumber"),
            AssignedVendor = reader.IsDBNull(assignedVendorOrdinal) ? null : reader.GetString("AssignedVendor"),
            ProjectStatus = reader.GetString("ProjectStatus"),
        };
    }

    private const string InvoiceSelectSql = """
        SELECT
            i.InvoiceId,
            i.ProjectId,
            mp.ProjectTitle,
            p.PropertyName,
            p.AddressLine1,
            p.UnitNumber,
            mp.AssignedVendor,
            i.TotalAmount,
            i.InvoiceStatus,
            i.IssuedOn,
            i.PaidOn,
            i.IsExported,
            i.CreatedAt,
            i.UpdatedAt
        FROM Invoices i
        INNER JOIN MaintenanceProjects mp ON mp.ProjectId = i.ProjectId
        INNER JOIN Properties p ON p.PropertyId = mp.PropertyId
        
        """;
}
