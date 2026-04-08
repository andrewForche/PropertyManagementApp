using Property_Management_Api.Core.Models.Dtos;

namespace Property_Management_Api.Core.Interfaces.Services;

public interface IPropertyService
{
    Task<IReadOnlyCollection<PropertyDto>> GetAllAsync(CancellationToken cancellationToken);
}
