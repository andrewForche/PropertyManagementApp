namespace Property_Management_Api.Models.Request;

public sealed class UpdateRentScheduleRequest
{
    public string ScheduleStatus { get; init; } = "Unpaid";
    public decimal LateFeeAmount { get; init; }
    public decimal BalanceDue { get; init; }
    public int ReminderCount { get; init; }
}
