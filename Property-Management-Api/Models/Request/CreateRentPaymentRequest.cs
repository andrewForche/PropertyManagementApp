namespace Property_Management_Api.Models.Request;

public sealed class CreateRentPaymentRequest
{
    public int ScheduleId { get; init; }
    public decimal AmountPaid { get; init; }
    public string PaymentMethod { get; init; } = "ACH";
    public DateTime PaymentDate { get; init; } = DateTime.UtcNow;
    public string? ReferenceNumber { get; init; }
}
