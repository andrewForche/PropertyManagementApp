using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class RentCollectionService : IRentCollectionService
{
    private readonly IRentCollectionDataService _rentCollectionDataService;

    public RentCollectionService(IRentCollectionDataService rentCollectionDataService)
    {
        _rentCollectionDataService = rentCollectionDataService;
    }

    public Task<IReadOnlyCollection<RentScheduleResponse>> GetSchedulesAsync(CancellationToken cancellationToken)
    {
        return _rentCollectionDataService.GetSchedulesAsync(cancellationToken);
    }

    public Task<IReadOnlyCollection<RentPaymentResponse>> GetPaymentsAsync(CancellationToken cancellationToken)
    {
        return _rentCollectionDataService.GetPaymentsAsync(cancellationToken);
    }

    public Task<RentScheduleResponse?> UpdateScheduleAsync(
        int scheduleId,
        UpdateRentScheduleRequest request,
        CancellationToken cancellationToken)
    {
        return _rentCollectionDataService.UpdateScheduleAsync(scheduleId, request, cancellationToken);
    }

    public async Task<RentPaymentResponse> RecordPaymentAsync(
        CreateRentPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await _rentCollectionDataService.CreatePaymentAsync(request, cancellationToken);
        await _rentCollectionDataService.RefreshScheduleBalanceAsync(request.ScheduleId, cancellationToken);
        return payment;
    }
}
