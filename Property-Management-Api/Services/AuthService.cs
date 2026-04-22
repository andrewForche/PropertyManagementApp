using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Property_Management_Api.Auth;
using Property_Management_Api.Configuration;
using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly IAuthDataService _authDataService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAuthDataService authDataService,
        IPasswordHasher passwordHasher,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _authDataService = authDataService;
        _passwordHasher = passwordHasher;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<AuthTokenResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "AuthService JWT settings loaded. Issuer={Issuer}, Audience={Audience}, SigningKey={SigningKey}, SigningKeyLength={SigningKeyLength}, AccessTokenExpirationMinutes={AccessTokenExpirationMinutes}",
            _jwtSettings.Issuer,
            _jwtSettings.Audience,
            _jwtSettings.SigningKey,
            _jwtSettings.SigningKey.Length,
            _jwtSettings.AccessTokenExpirationMinutes);

        var authUser = await _authDataService.GetByEmailAsync(request.Email, cancellationToken);
        if (authUser is null)
        {
            _logger.LogWarning("Login failed. Email={Email}, Reason=Auth user not found.", request.Email);
            return null;
        }

        if (!authUser.IsActive)
        {
            _logger.LogWarning(
                "Login failed. Email={Email}, AuthUserId={AuthUserId}, Role={Role}, Reason=Auth user is inactive.",
                authUser.Email,
                authUser.AuthUserId,
                authUser.RoleName);
            return null;
        }

        if (!_passwordHasher.VerifyPassword(request.Password, authUser.PasswordHash))
        {
            _logger.LogWarning(
                "Login failed. Email={Email}, AuthUserId={AuthUserId}, Role={Role}, Reason=Invalid password.",
                authUser.Email,
                authUser.AuthUserId,
                authUser.RoleName);
            return null;
        }

        if (string.Equals(authUser.RoleName, UserRoles.Tenant, StringComparison.Ordinal) &&
            authUser.TenantId is null)
        {
            _logger.LogWarning(
                "Login failed. Email={Email}, AuthUserId={AuthUserId}, Role={Role}, IsActive={IsActive}, Reason=Tenant user has no tenant mapping.",
                authUser.Email,
                authUser.AuthUserId,
                authUser.RoleName,
                authUser.IsActive);
            return null;
        }

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, authUser.AuthUserId.ToString()),
            new(ClaimTypes.NameIdentifier, authUser.AuthUserId.ToString()),
            new(ClaimTypes.Email, authUser.Email),
            new(ClaimTypes.Role, authUser.RoleName),
            new(JwtRegisteredClaimNames.Email, authUser.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        if (authUser.TenantId.HasValue)
        {
            claims.Add(new Claim(CustomClaimTypes.TenantId, authUser.TenantId.Value.ToString()));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SigningKey));
        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: signingCredentials);
        var serializedToken = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogInformation(
            "JWT issued successfully. UserId={UserId}, Email={Email}, Role={Role}, TenantId={TenantId}, ExpiresAtUtc={ExpiresAtUtc}, TokenSegments={TokenSegments}",
            authUser.AuthUserId,
            authUser.Email,
            authUser.RoleName,
            authUser.TenantId,
            expiresAtUtc,
            serializedToken.Split('.').Length);

        return new AuthTokenResponse
        {
            AccessToken = serializedToken,
            ExpiresAtUtc = expiresAtUtc,
            UserId = authUser.AuthUserId,
            Role = authUser.RoleName,
            TenantId = authUser.TenantId,
            Email = authUser.Email
        };
    }
}
