using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.Services;

public sealed class InvoiceService : IInvoiceService
{
    private readonly IInvoiceDataService _invoiceDataService;

    public InvoiceService(IInvoiceDataService invoiceDataService)
    {
        _invoiceDataService = invoiceDataService;
    }

    public Task<IReadOnlyCollection<InvoiceResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        return _invoiceDataService.GetAllAsync(cancellationToken);
    }

    public Task<InvoiceResponse?> GetByIdAsync(int invoiceId, CancellationToken cancellationToken)
    {
        return _invoiceDataService.GetByIdAsync(invoiceId, cancellationToken);
    }

    public Task<IReadOnlyCollection<InvoiceProjectOptionResponse>> GetProjectOptionsAsync(CancellationToken cancellationToken)
    {
        return _invoiceDataService.GetProjectOptionsAsync(cancellationToken);
    }

    public Task<InvoiceResponse> CreateAsync(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        return _invoiceDataService.CreateAsync(request, cancellationToken);
    }

    public Task<InvoiceResponse?> UpdateAsync(int invoiceId, UpdateInvoiceRequest request, CancellationToken cancellationToken)
    {
        return _invoiceDataService.UpdateAsync(invoiceId, request, cancellationToken);
    }

    public Task<bool> DeleteAsync(int invoiceId, CancellationToken cancellationToken)
    {
        return _invoiceDataService.DeleteAsync(invoiceId, cancellationToken);
    }
}
