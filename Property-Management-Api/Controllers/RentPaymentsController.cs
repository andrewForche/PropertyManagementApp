using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RentPaymentsController : ControllerBase
{
    private readonly IRentCollectionService _rentCollectionService;

    public RentPaymentsController(IRentCollectionService rentCollectionService)
    {
        _rentCollectionService = rentCollectionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var payments = await _rentCollectionService.GetPaymentsAsync(cancellationToken);
        return Ok(payments);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateRentPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await _rentCollectionService.RecordPaymentAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { paymentId = payment.PaymentId }, payment);
    }
}
