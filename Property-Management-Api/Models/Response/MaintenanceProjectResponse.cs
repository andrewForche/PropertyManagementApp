namespace Property_Management_Api.Models.Response;

public sealed class MaintenanceProjectResponse
{
    public int ProjectId { get; init; }
    public int PropertyId { get; init; }
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public string? ProjectDescription { get; init; }
    public decimal? BidAmount { get; init; }
    public string ProjectStatus { get; init; } = string.Empty;
    public string? AssignedVendor { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
