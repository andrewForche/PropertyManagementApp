namespace Property_Management_Api.Models.Response;

public sealed class WorkLogResponse
{
    public int WorkLogId { get; init; }
    public int ProjectId { get; init; }
    public string ProjectTitle { get; init; } = string.Empty;
    public DateTime ClockInTime { get; init; }
    public DateTime? ClockOutTime { get; init; }
    public string? GpsLocation { get; init; }
    public string? ProofPhotoUrl { get; init; }
    public string? WorkNotes { get; init; }
    public DateTime CreatedAt { get; init; }
}
