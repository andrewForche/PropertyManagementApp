using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class TenantService : ITenantService
{
    private readonly ITenantDataService _tenantDataService;

    public TenantService(ITenantDataService tenantDataService)
    {
        _tenantDataService = tenantDataService;
    }

    public Task<IReadOnlyCollection<TenantResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        return _tenantDataService.GetAllAsync(cancellationToken);
    }

    public Task<TenantResponse?> GetByIdAsync(int tenantId, CancellationToken cancellationToken)
    {
        return _tenantDataService.GetByIdAsync(tenantId, cancellationToken);
    }

    public Task<TenantResponse?> GetByAuthUserIdAsync(int authUserId, string? email, CancellationToken cancellationToken)
    {
        return _tenantDataService.GetByAuthUserIdAsync(authUserId, email, cancellationToken);
    }

    public Task<TenantResponse> CreateAsync(CreateTenantRequest request, CancellationToken cancellationToken)
    {
        return _tenantDataService.CreateAsync(request, cancellationToken);
    }

    public Task<TenantResponse?> UpdateAsync(int tenantId, UpdateTenantRequest request, CancellationToken cancellationToken)
    {
        return _tenantDataService.UpdateAsync(tenantId, request, cancellationToken);
    }

    public Task<bool> DeleteAsync(int tenantId, CancellationToken cancellationToken)
    {
        return _tenantDataService.DeleteAsync(tenantId, cancellationToken);
    }
}
