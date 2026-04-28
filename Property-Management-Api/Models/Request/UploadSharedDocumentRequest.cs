
namespace Property_Management_Api.Models.Request;

public sealed class UploadSharedDocumentRequest
{
    public int TenantId { get; init; }
    public string? Description { get; init; }
    public IFormFile File { get; init; } = null!;
}