namespace Property_Management_Api.Configuration;

public sealed class ApiSettings
{
    public const string SectionName = "ApiSettings";

    public string ApplicationName { get; init; } = "Property Management API";

    public string EnvironmentName { get; init; } = "Development";
}
