namespace Property_Management_Api.Models.Response;

public sealed class InvoiceResponse
{
    public int InvoiceId { get; init; }
    public int ProjectId { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public string? AssignedVendor { get; init; }
    public decimal TotalAmount { get; init; }
    public string InvoiceStatus { get; init; } = string.Empty;
    public DateTime? IssuedOn { get; init; }
    public DateTime? PaidOn { get; init; }
    public bool IsExported { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
