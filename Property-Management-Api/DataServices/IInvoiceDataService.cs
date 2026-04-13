using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

namespace Property_Management_Api.DataServices;

public interface IInvoiceDataService
{
    Task<IReadOnlyCollection<InvoiceResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<InvoiceResponse?> GetByIdAsync(int invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<InvoiceProjectOptionResponse>> GetProjectOptionsAsync(CancellationToken cancellationToken);
    Task<InvoiceResponse> CreateAsync(CreateInvoiceRequest request, CancellationToken cancellationToken);
    Task<InvoiceResponse?> UpdateAsync(int invoiceId, UpdateInvoiceRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int invoiceId, CancellationToken cancellationToken);
}
