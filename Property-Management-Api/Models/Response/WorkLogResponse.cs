namespace Property_Management_Api.Models.Response;

public sealed class WorkLogResponse
{
    public int WorkLogId { get; init; }
    public int ProjectId { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public string PropertyName { get; init; } = string.Empty;
    public string AddressLine1 { get; init; } = string.Empty;
    public string? UnitNumber { get; init; }
    public string? AssignedVendor { get; init; }
    public string ProjectStatus { get; init; } = string.Empty;
    public DateTime ClockInTime { get; init; }
    public DateTime? ClockOutTime { get; init; }
    public string? GpsLocation { get; init; }
    public string? ProofPhotoUrl { get; init; }
    public string? WorkNotes { get; init; }
    public DateTime CreatedAt { get; init; }
}
