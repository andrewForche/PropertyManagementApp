namespace Property_Management_Api.Models.Response;

public sealed class RentPaymentResponse
{
    public int PaymentId { get; init; }
    public int ScheduleId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public decimal AmountPaid { get; init; }
    public string PaymentMethod { get; init; } = string.Empty;
    public DateTime PaymentDate { get; init; }
    public string? ReferenceNumber { get; init; }
}
