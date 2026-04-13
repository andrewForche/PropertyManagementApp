namespace Property_Management_Api.Models.Request;

public sealed class UpdatePropertyRequest
{
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public decimal MonthlyRent { get; init; }
    public string OccupancyStatus { get; init; } = "vacant";
}
