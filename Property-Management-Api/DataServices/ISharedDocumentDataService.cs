// DataServices/ISharedDocumentDataService.cs
namespace Property_Management_Api.DataServices;

using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

public interface ISharedDocumentDataService
{
    Task<IReadOnlyCollection<SharedDocumentResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<SharedDocumentResponse>> GetByTenantIdAsync(int tenantId, CancellationToken cancellationToken);
    Task<SharedDocumentResponse?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<SharedDocumentResponse> CreateAsync(UploadSharedDocumentRequest request, string fileName, string filePath, string mimeType, long fileSizeBytes, string uploadedByRole, int uploadedByUserId, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<string?> GetFilePathAsync(int id, CancellationToken cancellationToken);
}