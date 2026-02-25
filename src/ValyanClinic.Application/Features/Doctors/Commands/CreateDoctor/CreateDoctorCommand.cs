using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.CreateDoctor;

/// <summary>Creare doctor nou pentru clinica curentă.</summary>
public sealed record CreateDoctorCommand(
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
    DateTime? LicenseExpiresAt
) : IRequest<Result<Guid>>;
