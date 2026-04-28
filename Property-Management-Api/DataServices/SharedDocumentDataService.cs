// DataServices/SharedDocumentDataService.cs
namespace Property_Management_Api.DataServices;

using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

public sealed class SharedDocumentDataService : ISharedDocumentDataService
{
    private readonly string _connectionString;

    public SharedDocumentDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<IReadOnlyCollection<SharedDocumentResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = SharedDocumentSelectSql + """
            ORDER BY sd.UploadedAt DESC;
            """;

        return await QueryDocumentsAsync(sql, null, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SharedDocumentResponse>> GetByTenantIdAsync(int tenantId, CancellationToken cancellationToken)
    {
        const string sql = SharedDocumentSelectSql + """
            WHERE sd.TenantId = @TenantId
            ORDER BY sd.UploadedAt DESC;
            """;

        return await QueryDocumentsAsync(
            sql,
            command => command.Parameters.AddWithValue("@TenantId", tenantId),
            cancellationToken);
    }

    public async Task<SharedDocumentResponse?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        const string sql = SharedDocumentSelectSql + """
            WHERE sd.DocumentId = @DocumentId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@DocumentId", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
            return MapDocument(reader);

        return null;
    }

    public async Task<SharedDocumentResponse> CreateAsync(
        UploadSharedDocumentRequest request,
        string fileName,
        string filePath,
        string mimeType,
        long fileSizeBytes,
        string uploadedByRole,
        int uploadedByUserId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO SharedDocuments (
                TenantId,
                FileName,
                FilePath,
                MimeType,
                FileSizeBytes,
                UploadedByRole,
                UploadedByUserId,
                Description,
                UploadedAt
            )
            VALUES (
                @TenantId,
                @FileName,
                @FilePath,
                @MimeType,
                @FileSizeBytes,
                @UploadedByRole,
                @UploadedByUserId,
                @Description,
                UTC_TIMESTAMP()
            );
            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TenantId", request.TenantId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@MimeType", mimeType);
        command.Parameters.AddWithValue("@FileSizeBytes", fileSizeBytes);
        command.Parameters.AddWithValue("@UploadedByRole", uploadedByRole);
        command.Parameters.AddWithValue("@UploadedByUserId", uploadedByUserId);
        command.Parameters.AddWithValue("@Description",
            string.IsNullOrWhiteSpace(request.Description) ? DBNull.Value : request.Description);

        var newId = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));

        return await GetByIdAsync(newId, cancellationToken)
            ?? throw new InvalidOperationException("Document insert did not return a created record.");
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM SharedDocuments
            WHERE DocumentId = @DocumentId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@DocumentId", id);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        return affectedRows > 0;
    }


    private async Task<IReadOnlyCollection<SharedDocumentResponse>> QueryDocumentsAsync(
        string sql,
        Action<MySqlCommand>? configureCommand,
        CancellationToken cancellationToken)
    {
        var documents = new List<SharedDocumentResponse>();

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        configureCommand?.Invoke(command);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            documents.Add(MapDocument(reader));

        return documents;
    }

    private static SharedDocumentResponse MapDocument(MySqlDataReader reader)
    {
        var descriptionOrdinal = reader.GetOrdinal("Description");

        return new SharedDocumentResponse
        {
            Id = reader.GetInt32("DocumentId"),
            TenantId = reader.GetInt32("TenantId"),
            TenantFullName = reader.GetString("TenantFullName"),
            FileName = reader.GetString("FileName"),
            MimeType = reader.GetString("MimeType"),
            FileSizeBytes = reader.GetInt64("FileSizeBytes"),
            UploadedByRole = reader.GetString("UploadedByRole"),
            Description = reader.IsDBNull(descriptionOrdinal) ? null : reader.GetString("Description"),
            UploadedAt = reader.GetDateTime("UploadedAt")
        };
    }

    private const string SharedDocumentSelectSql = """
        SELECT
            sd.DocumentId,
            sd.TenantId,
            CONCAT(t.FirstName, ' ', t.LastName) AS TenantFullName,
            sd.FileName,
            sd.MimeType,
            sd.FileSizeBytes,
            sd.UploadedByRole,
            sd.Description,
            sd.UploadedAt
        FROM SharedDocuments sd
        INNER JOIN Tenants t ON t.TenantId = sd.TenantId

        """;
        public async Task<string?> GetFilePathAsync(int id, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT FilePath
            FROM SharedDocuments
            WHERE DocumentId = @DocumentId;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@DocumentId", id);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is DBNull or null ? null : (string)result;
    }
}