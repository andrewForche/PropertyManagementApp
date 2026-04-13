using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public interface IRentCollectionService
{
    Task<IReadOnlyCollection<RentScheduleResponse>> GetSchedulesAsync(CancellationToken cancellationToken);
    Task<RentScheduleResponse?> UpdateScheduleAsync(int scheduleId, UpdateRentScheduleRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RentPaymentResponse>> GetPaymentsAsync(CancellationToken cancellationToken);
    Task<RentPaymentResponse> RecordPaymentAsync(CreateRentPaymentRequest request, CancellationToken cancellationToken);
}
