using Microsoft.AspNetCore.Mvc;
using Property_Management_Api.Auth;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Services;

namespace Property_Management_Api.Controllers;

[ApiController]
[Route("api/rent-payments")]
public class RentPaymentsController : ControllerBase
{
    private readonly IRentCollectionService _rentCollectionService;

    public RentPaymentsController(IRentCollectionService rentCollectionService)
    {
        _rentCollectionService = rentCollectionService;
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var payments = await _rentCollectionService.GetPaymentsAsync(cancellationToken);
        return Ok(payments);
    }

    [AuthorizeRoles(UserRoles.Tenant)]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyPayments(
        [FromServices] ITenantService tenantService,
        CancellationToken cancellationToken)
    {
        var tenant = await tenantService.GetByAuthUserIdAsync(
            User.GetRequiredAuthUserId(),
            User.GetEmailAddress(),
            cancellationToken);

        if (tenant is null)
        {
            return Forbid();
        }

        var claimedTenantId = User.GetTenantId();
        if (claimedTenantId.HasValue && claimedTenantId.Value != tenant.TenantId)
        {
            return Forbid();
        }

        var payments = await _rentCollectionService.GetPaymentsForTenantAsync(
            tenant.TenantId,
            cancellationToken);

        return Ok(payments);
    }

    [AuthorizeRoles(UserRoles.Admin, UserRoles.Landlord)]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateRentPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await _rentCollectionService.RecordPaymentAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { paymentId = payment.PaymentId }, payment);
    }
}
