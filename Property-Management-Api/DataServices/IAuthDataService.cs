using Property_Management_Api.Auth;

namespace Property_Management_Api.DataServices;

public interface IAuthDataService
{
    Task<AuthUserRecord?> GetByEmailAsync(string email, CancellationToken cancellationToken);
}
