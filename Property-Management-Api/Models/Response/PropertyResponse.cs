namespace Property_Management_Api.Models.Response;

public sealed class PropertyResponse
{
    public int PropertyId { get; init; }
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public decimal MonthlyRent { get; init; }
    public string OccupancyStatus { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
