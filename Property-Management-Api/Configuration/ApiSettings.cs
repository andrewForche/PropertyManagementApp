namespace Property_Management_Api.Configuration;

public sealed class ApiSettings
{
    public const string SectionName = "ApiSettings";
    public const string JwtSectionName = "Jwt";

    public string ApplicationName { get; init; } = "Property Management API";

    public string EnvironmentName { get; init; } = "Development";
}

public sealed class JwtSettings
{
    public string Issuer { get; init; } = "PropertyManagementApp";

    public string Audience { get; init; } = "PropertyManagementApp.Client";

    public string SigningKey { get; init; } = "replace-with-a-secure-32-character-minimum-key";

    public int AccessTokenExpirationMinutes { get; init; } = 60;
}
