using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public interface IRentCollectionDataService
{
    Task<IReadOnlyCollection<RentScheduleResponse>> GetSchedulesAsync(CancellationToken cancellationToken);
    Task<RentScheduleResponse?> UpdateScheduleAsync(int scheduleId, UpdateRentScheduleRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RentPaymentResponse>> GetPaymentsAsync(CancellationToken cancellationToken);
    Task<RentPaymentResponse> CreatePaymentAsync(CreateRentPaymentRequest request, CancellationToken cancellationToken);
    Task RefreshScheduleBalanceAsync(int scheduleId, CancellationToken cancellationToken);
}
