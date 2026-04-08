using Property_Management_Api.Core.Interfaces.Repositories;
using Property_Management_Api.Core.Models.Domain;

namespace Property_Management_Api.Infrastructure.Repositories;

public sealed class PropertyRepository : IPropertyRepository
{
    public Task<IReadOnlyCollection<Property>> GetAllAsync(CancellationToken cancellationToken)
    {
        IReadOnlyCollection<Property> properties = Array.Empty<Property>();
        return Task.FromResult(properties);
    }
}
