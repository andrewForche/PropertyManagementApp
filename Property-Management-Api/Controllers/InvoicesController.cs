using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var invoices = await _invoiceService.GetAllAsync(cancellationToken);
        return Ok(invoices);
    }

    [HttpGet("project-options")]
    public async Task<IActionResult> GetProjectOptions(CancellationToken cancellationToken)
    {
        var projects = await _invoiceService.GetProjectOptionsAsync(cancellationToken);
        return Ok(projects);
    }

    [HttpGet("{invoiceId:int}")]
    public async Task<IActionResult> GetById(int invoiceId, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceService.GetByIdAsync(invoiceId, cancellationToken);

        if (invoice is null)
        {
            return NotFound();
        }

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceRequest request,
        CancellationToken cancellationToken)
    {
        var createdInvoice = await _invoiceService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { invoiceId = createdInvoice.InvoiceId }, createdInvoice);
    }

    [HttpPut("{invoiceId:int}")]
    public async Task<IActionResult> Update(
        int invoiceId,
        [FromBody] UpdateInvoiceRequest request,
        CancellationToken cancellationToken)
    {
        var updatedInvoice = await _invoiceService.UpdateAsync(invoiceId, request, cancellationToken);

        if (updatedInvoice is null)
        {
            return NotFound();
        }

        return Ok(updatedInvoice);
    }

    [HttpDelete("{invoiceId:int}")]
    public async Task<IActionResult> Delete(int invoiceId, CancellationToken cancellationToken)
    {
        var deleted = await _invoiceService.DeleteAsync(invoiceId, cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
