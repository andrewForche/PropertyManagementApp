using Property_Management_Api.Core.Models.Domain;

namespace Property_Management_Api.Core.Interfaces.Repositories;

public interface IPropertyRepository
{
    Task<IReadOnlyCollection<Property>> GetAllAsync(CancellationToken cancellationToken);
}
