// Models/Response/SharedDocumentResponse.cs
namespace Property_Management_Api.Models.Response;

public sealed class SharedDocumentResponse
{
    public int Id { get; init; }
    public int TenantId { get; init; }
    public string TenantFullName { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string MimeType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public string UploadedByRole { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime UploadedAt { get; init; }
}