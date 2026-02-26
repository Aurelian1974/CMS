using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Users.Commands.ChangePassword;
using ValyanClinic.Application.Features.Users.Commands.CreateUser;
using ValyanClinic.Application.Features.Users.Commands.DeleteUser;
using ValyanClinic.Application.Features.Users.Commands.UpdateUser;
using ValyanClinic.Application.Features.Users.Queries.GetRoles;
using ValyanClinic.Application.Features.Users.Queries.GetUserById;
using ValyanClinic.Application.Features.Users.Queries.GetUsers;

namespace ValyanClinic.API.Controllers;

public class UsersController : BaseApiController
{
    /// <summary>Listare roluri active (nomenclator).</summary>
    [HttpGet("roles")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRolesQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Listare paginată utilizatori cu căutare și filtre.</summary>
    [HttpGet]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? roleId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "lastName",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var query = new GetUsersQuery(search, roleId, isActive, page, pageSize, sortBy, sortDir);
        var result = await Mediator.Send(query, ct);
        return HandleResult(result);
    }

    /// <summary>Obținere utilizator după Id.</summary>
    [HttpGet("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Read)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUserByIdQuery(id), ct);
        return HandleResult(result);
    }

    /// <summary>Creare utilizator nou (parola se hash-uiește automat cu BCrypt).</summary>
    [HttpPost]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Actualizare utilizator (fără parolă).</summary>
    [HttpPut("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var command = new UpdateUserCommand(
            id,
            request.RoleId,
            request.DoctorId,
            request.MedicalStaffId,
            request.Username,
            request.Email,
            request.FirstName,
            request.LastName,
            request.IsActive);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Schimbare parolă utilizator.</summary>
    [HttpPatch("{id:guid}/password")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Write)]
    public async Task<IActionResult> ChangePassword(
        Guid id, [FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var command = new ChangePasswordCommand(id, request.NewPassword);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Soft delete utilizator.</summary>
    [HttpDelete("{id:guid}")]
    [HasAccess(ModuleCodes.Users, AccessLevel.Full)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteUserCommand(id), ct);
        return HandleResult(result);
    }
}

/// <summary>Request body pentru actualizare utilizator.</summary>
public sealed record UpdateUserRequest(
    Guid RoleId,
    Guid? DoctorId,
    Guid? MedicalStaffId,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive);

/// <summary>Request body pentru schimbare parolă.</summary>
public sealed record ChangePasswordRequest(string NewPassword);
