namespace Property_Management_Api.Models.Response;

public sealed class AuthTokenResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string TokenType { get; init; } = "Bearer";
    public DateTime ExpiresAtUtc { get; init; }
    public int UserId { get; init; }
    public string Role { get; init; } = string.Empty;
    public int? TenantId { get; init; }
    public string Email { get; init; } = string.Empty;
}
