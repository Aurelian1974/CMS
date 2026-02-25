using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.UpdateDoctor;

/// <summary>Actualizare doctor existent.</summary>
public sealed record UpdateDoctorCommand(
    Guid Id,
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? SpecialtyId,
    Guid? SubspecialtyId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string? MedicalCode,
    string? LicenseNumber,
    DateTime? LicenseExpiresAt,
    bool IsActive
) : IRequest<Result<bool>>;
