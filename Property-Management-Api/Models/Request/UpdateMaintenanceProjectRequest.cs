namespace Property_Management_Api.Models.Request;

public sealed class UpdateMaintenanceProjectRequest
{
    public int PropertyId { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public string? ProjectDescription { get; init; }
    public decimal? BidAmount { get; init; }
    public string ProjectStatus { get; init; } = "Bid";
    public string? AssignedVendor { get; init; }
}
