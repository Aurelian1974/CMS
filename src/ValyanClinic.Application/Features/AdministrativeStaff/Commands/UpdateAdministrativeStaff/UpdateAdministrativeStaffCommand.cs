using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Commands.UpdateAdministrativeStaff;

/// <summary>Actualizare membru existent al personalului administrativ.</summary>
public sealed record UpdateAdministrativeStaffCommand(
    Guid Id,
    Guid? DepartmentId,
    Guid? PositionId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsActive
) : IRequest<Result<bool>>;
