using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public interface IAuthService
{
    Task<AuthTokenResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
}
