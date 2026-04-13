namespace Property_Management_Api.Models.Request;

public sealed class CreateTenantRequest
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public int PropertyId { get; init; }
    public DateTime? LeaseStartDate { get; init; }
    public DateTime? LeaseEndDate { get; init; }
    public string TenantStatus { get; init; } = "active";
}
