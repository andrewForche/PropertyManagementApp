using System.Security.Claims;

namespace Property_Management_Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static int GetRequiredAuthUserId(this ClaimsPrincipal principal)
    {
        var rawValue = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(rawValue, out var authUserId)
            ? authUserId
            : throw new InvalidOperationException("Authenticated user id claim is missing.");
    }

    public static int? GetTenantId(this ClaimsPrincipal principal)
    {
        var rawValue = principal.FindFirst(CustomClaimTypes.TenantId)?.Value;

        return int.TryParse(rawValue, out var tenantId) ? tenantId : null;
    }

    public static string? GetEmailAddress(this ClaimsPrincipal principal)
    {
        return principal.FindFirst(ClaimTypes.Email)?.Value;
    }
}
