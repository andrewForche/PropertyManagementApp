namespace Property_Management_Api.Models.Request;

public sealed class CreateWorkLogRequest
{
    public DateTime ClockInTime { get; init; }
    public DateTime? ClockOutTime { get; init; }
    public string? GpsLocation { get; init; }
    public string? ProofPhotoUrl { get; init; }
    public string? WorkNotes { get; init; }
}
