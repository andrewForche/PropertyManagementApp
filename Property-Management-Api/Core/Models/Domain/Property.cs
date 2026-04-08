namespace Property_Management_Api.Core.Models.Domain;

public sealed class Property
{
    public int Id { get; init; }

    public string PropertyName { get; init; } = string.Empty;

    public string AddressLine1 { get; init; } = string.Empty;

    public string City { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public string PostalCode { get; init; } = string.Empty;

    public string? UnitNumber { get; init; }

    public decimal MonthlyRent { get; init; }

    public string OccupancyStatus { get; init; } = "vacant";
}
