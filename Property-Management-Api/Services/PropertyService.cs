using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class PropertyService : IPropertyService
{
    private readonly IPropertyDataService _propertyDataService;

    public PropertyService(IPropertyDataService propertyDataService)
    {
        _propertyDataService = propertyDataService;
    }

    public Task<IReadOnlyCollection<PropertyResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        return _propertyDataService.GetAllAsync(cancellationToken);
    }

    public Task<PropertyResponse?> GetByIdAsync(int propertyId, CancellationToken cancellationToken)
    {
        return _propertyDataService.GetByIdAsync(propertyId, cancellationToken);
    }

    public Task<PropertyResponse> CreateAsync(CreatePropertyRequest request, CancellationToken cancellationToken)
    {
        return _propertyDataService.CreateAsync(request, cancellationToken);
    }

    public Task<PropertyResponse?> UpdateAsync(
        int propertyId,
        UpdatePropertyRequest request,
        CancellationToken cancellationToken)
    {
        return _propertyDataService.UpdateAsync(propertyId, request, cancellationToken);
    }

    public Task<bool> DeleteAsync(int propertyId, CancellationToken cancellationToken)
    {
        return _propertyDataService.DeleteAsync(propertyId, cancellationToken);
    }
}
