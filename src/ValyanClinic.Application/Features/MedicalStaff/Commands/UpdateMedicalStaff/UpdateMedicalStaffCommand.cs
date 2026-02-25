using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.UpdateMedicalStaff;

/// <summary>Actualizare personal medical existent.</summary>
public sealed record UpdateMedicalStaffCommand(
    Guid Id,
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? MedicalTitleId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsActive
) : IRequest<Result<bool>>;
