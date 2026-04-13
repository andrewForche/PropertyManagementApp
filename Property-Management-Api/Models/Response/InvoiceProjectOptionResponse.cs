namespace Property_Management_Api.Models.Response;

public sealed class InvoiceProjectOptionResponse
{
    public int ProjectId { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public string? AssignedVendor { get; init; }
    public string ProjectStatus { get; init; } = string.Empty;
}
