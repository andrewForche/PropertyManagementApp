namespace Property_Management_Api.Models.Response;

public sealed class RentScheduleResponse
{
    public int ScheduleId { get; init; }
    public int TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public DateTime DueDate { get; init; }
    public string ScheduleStatus { get; init; } = string.Empty;
    public decimal BaseRent { get; init; }
    public decimal LateFeeAmount { get; init; }
    public decimal BalanceDue { get; init; }
    public int ReminderCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
