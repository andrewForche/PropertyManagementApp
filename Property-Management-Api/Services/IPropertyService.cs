using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public interface IPropertyService
{
    Task<IReadOnlyCollection<PropertyResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<PropertyResponse?> GetByIdAsync(int propertyId, CancellationToken cancellationToken);
    Task<PropertyResponse?> GetByAuthUserIdAsync(int authUserId, string? email, CancellationToken cancellationToken);
    Task<PropertyResponse> CreateAsync(CreatePropertyRequest request, CancellationToken cancellationToken);
    Task<PropertyResponse?> UpdateAsync(int propertyId, UpdatePropertyRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int propertyId, CancellationToken cancellationToken);
}
