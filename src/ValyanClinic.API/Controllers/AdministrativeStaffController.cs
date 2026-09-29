using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.CreateAdministrativeStaff;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.DeleteAdministrativeStaff;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.UpdateAdministrativeStaff;
using ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativePositions;
using ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffByClinic;
using ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffById;
using ValyanClinic.Application.Features.AdministrativeStaff.Queries.GetAdministrativeStaffList;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru personalul administrativ (recepționeri, manageri, administratori).
/// Protejat pe modulul `users`, ca și personalul medical: persoanele de aici există
/// pentru a primi conturi de utilizator.
/// </summary>
public class AdministrativeStaffController : BaseApiController
{
    /// <summary>Listare paginată personal administrativ cu filtre.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<PagedResult<AdministrativeStaffListDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? positionId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "LastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetAdministrativeStaffListQuery(search, departmentId, positionId,
            isActive, page, pageSize, sortBy, sortDir);
        return HandleResult(await Mediator.Send(query, ct));
    }

    /// <summary>Listare simplificată personal administrativ activ (pentru dropdown-uri).</summary>
    [HttpGet("lookup")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IEnumerable<AdministrativeStaffLookupDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLookup(CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetAdministrativeStaffByClinicQuery(), ct));

    /// <summary>Nomenclator funcții administrative.</summary>
    [HttpGet("positions")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<IReadOnlyList<AdministrativePositionDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPositions([FromQuery] bool? isActive, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetAdministrativePositionsQuery(isActive), ct));

    /// <summary>Obținere membru al personalului administrativ după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    [ProducesResponseType<ApiResponse<AdministrativeStaffDetailDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new GetAdministrativeStaffByIdQuery(id), ct));

    /// <summary>Creare membru nou al personalului administrativ.</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<Guid>>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAdministrativeStaffCommand command, CancellationToken ct)
        => HandleResult(await Mediator.Send(command, ct));

    /// <summary>Actualizare membru existent al personalului administrativ.</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateAdministrativeStaffRequest request, CancellationToken ct)
    {
        var command = new UpdateAdministrativeStaffCommand(
            id,
            request.DepartmentId,
            request.PositionId,
            request.FirstName,
            request.LastName,
            request.Email,
            request.PhoneNumber,
            request.IsActive);

        return HandleResult(await Mediator.Send(command, ct));
    }

    /// <summary>Soft delete membru al personalului administrativ.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    [ProducesResponseType<ApiResponse<bool>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => HandleResult(await Mediator.Send(new DeleteAdministrativeStaffCommand(id), ct));
}

/// <summary>Body PUT — Id vine din rută.</summary>
public sealed record UpdateAdministrativeStaffRequest(
    Guid? DepartmentId,
    Guid? PositionId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsActive);
