using Property_Management_Api.Core.Interfaces.Repositories;
using Property_Management_Api.Core.Interfaces.Services;
using Property_Management_Api.Core.Models.Dtos;

namespace Property_Management_Api.Infrastructure.Services;

public sealed class PropertyService : IPropertyService
{
    private readonly IPropertyRepository _propertyRepository;

    public PropertyService(IPropertyRepository propertyRepository)
    {
        _propertyRepository = propertyRepository;
    }

    public async Task<IReadOnlyCollection<PropertyDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var properties = await _propertyRepository.GetAllAsync(cancellationToken);

        return properties
            .Select(property => new PropertyDto
            {
                Id = property.Id,
                PropertyName = property.PropertyName,
                AddressLine1 = property.AddressLine1,
                City = property.City,
                State = property.State,
                PostalCode = property.PostalCode,
                UnitNumber = property.UnitNumber,
                MonthlyRent = property.MonthlyRent,
                OccupancyStatus = property.OccupancyStatus
            })
            .ToArray();
    }
}
