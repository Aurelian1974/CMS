using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Commands.CreateAdministrativeStaff;

/// <summary>Creare membru nou al personalului administrativ pentru clinica curentă.</summary>
public sealed record CreateAdministrativeStaffCommand(
    Guid? DepartmentId,
    Guid? PositionId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber
) : IRequest<Result<Guid>>;
