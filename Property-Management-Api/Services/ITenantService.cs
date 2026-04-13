using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public interface ITenantService
{
    Task<IReadOnlyCollection<TenantResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<TenantResponse?> GetByIdAsync(int tenantId, CancellationToken cancellationToken);
    Task<TenantResponse> CreateAsync(CreateTenantRequest request, CancellationToken cancellationToken);
    Task<TenantResponse?> UpdateAsync(int tenantId, UpdateTenantRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int tenantId, CancellationToken cancellationToken);
}
