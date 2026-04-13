namespace Property_Management_Api.Models.Request;

public sealed class UpdateInvoiceRequest
{
    public int ProjectId { get; init; }
    public decimal TotalAmount { get; init; }
    public string InvoiceStatus { get; init; } = "Draft";
    public DateTime? IssuedOn { get; init; }
    public DateTime? PaidOn { get; init; }
    public bool IsExported { get; init; }
}
