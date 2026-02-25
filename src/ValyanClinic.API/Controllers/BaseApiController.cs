using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller de bază — injecție MediatR + helper pentru maparea Result↔ActionResult.
/// Toate controller-ele sunt protejate cu [Authorize] implicit — endpoint-urile publice
/// (login, refresh) folosesc [AllowAnonymous] explicit.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    /// <summary>
    /// Transformă un Result{T} în ActionResult conform codului HTTP din result.
    /// </summary>
    protected ActionResult HandleResult<T>(Result<T> result) => result.StatusCode switch
    {
        200 => Ok(new ApiResponse<T>(true, result.Value, null, null)),
        201 => StatusCode(201, new ApiResponse<T>(true, result.Value, null, null)),
        204 => NoContent(),
        400 => BadRequest(new ApiResponse<T>(false, default, result.Error, null)),
        401 => Unauthorized(new ApiResponse<T>(false, default, result.Error, null)),
        404 => NotFound(new ApiResponse<T>(false, default, result.Error, null)),
        409 => Conflict(new ApiResponse<T>(false, default, result.Error, null)),
        _   => BadRequest(new ApiResponse<T>(false, default, result.Error, null))
    };
}
