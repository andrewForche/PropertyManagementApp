// Controllers/SharedDocumentsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Property_Management_Api.DataServices;
using Property_Management_Api.Models.Request;
using Property_Management_Api.Models.Response;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SharedDocumentsController : ControllerBase
{
    private readonly ISharedDocumentDataService _docService;
    private readonly string _basePath;

    private static readonly string[] AllowedMimeTypes =
    [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    public SharedDocumentsController(
        ISharedDocumentDataService docService,
        IConfiguration config)
    {
        _docService = docService;
        _basePath = config["FileStorage:BasePath"]
                    ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
    }

    // GET /api/shareddocuments
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<SharedDocumentResponse>>> GetDocuments(
        CancellationToken ct)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;

        if (role == "Landlord" || role == "Admin")
        {
            var all = await _docService.GetAllAsync(ct);
            return Ok(all);
        }

        if (role == "Tenant" && int.TryParse(tenantIdClaim, out var tenantId))
        {
            var docs = await _docService.GetByTenantIdAsync(tenantId, ct);
            return Ok(docs);
        }

        return Forbid();
    }

    // POST /api/shareddocuments
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SharedDocumentResponse>> Upload(
        [FromForm] UploadSharedDocumentRequest request, 
        CancellationToken ct)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;

        if (role == "Tenant")
        {
            if (!int.TryParse(tenantIdClaim, out var claimTenantId) || claimTenantId != request.TenantId)
                return Forbid();
        }
        else if (role != "Landlord" && role != "Admin")
        {
            return Forbid();
        }

        if (request.File.Length == 0)
            return BadRequest("File is empty.");

        const long maxSizeBytes = 10 * 1024 * 1024;
        if (request.File.Length > maxSizeBytes)
            return BadRequest($"File is too large. Maximum size is 10MB (your file is {request.File.Length / 1024 / 1024:F1}MB).");

        if (!AllowedMimeTypes.Contains(request.File.ContentType))
            return BadRequest("File type not allowed. Use PDF, JPG, PNG, or Word documents.");

        var tenantFolder = Path.Combine(_basePath, $"tenant-{request.TenantId}");
        Directory.CreateDirectory(tenantFolder);

        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.File.FileName)}";
        var fullPath = Path.Combine(tenantFolder, safeFileName);

        await using (var stream = System.IO.File.Create(fullPath))
            await request.File.CopyToAsync(stream, ct);

        var doc = await _docService.CreateAsync(
            request,
            request.File.FileName,
            fullPath,
            request.File.ContentType,
            request.File.Length,
            role ?? "Unknown",
            int.TryParse(userIdClaim, out var uid) ? uid : 0,
            ct);

        return Ok(doc);
    }

    // GET /api/shareddocuments/{id}/download
    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken ct)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;

        var doc = await _docService.GetByIdAsync(id, ct);
        if (doc == null) return NotFound();

        if (role == "Tenant")
        {
            if (!int.TryParse(tenantIdClaim, out var tid) || tid != doc.TenantId)
                return Forbid();
        }
        else if (role != "Landlord" && role != "Admin")
        {
            return Forbid();
        }

        // FilePath is fetched separately since it's excluded from SharedDocumentResponse
        var filePath = await _docService.GetFilePathAsync(id, ct);
        if (filePath == null || !System.IO.File.Exists(filePath))
            return NotFound("File not found on server.");

        var stream = System.IO.File.OpenRead(filePath);
        return File(stream, doc.MimeType, doc.FileName);
    }

    // DELETE /api/shareddocuments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var tenantIdClaim = User.FindFirst("tenant_id")?.Value;

        var doc = await _docService.GetByIdAsync(id, ct);
        if (doc == null) return NotFound();

        if (role == "Tenant")
        {
            if (!int.TryParse(tenantIdClaim, out var tid) || tid != doc.TenantId
                || doc.UploadedByRole != "Tenant")
                return Forbid();
        }
        else if (role != "Landlord" && role != "Admin")
        {
            return Forbid();
        }

        var filePath = await _docService.GetFilePathAsync(id, ct);
        if (filePath != null && System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        await _docService.DeleteAsync(id, ct);
        return NoContent();
    }
}