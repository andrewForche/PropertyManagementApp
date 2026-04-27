namespace Property_Management_Api.Auth;

public sealed class AuthUserRecord
{
    public int AuthUserId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PasswordHash { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public int? TenantId { get; init; }
}
