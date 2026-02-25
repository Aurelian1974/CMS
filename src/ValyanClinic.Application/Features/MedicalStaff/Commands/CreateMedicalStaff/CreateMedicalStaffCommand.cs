using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.CreateMedicalStaff;

/// <summary>Creare personal medical nou pentru clinica curentă.</summary>
public sealed record CreateMedicalStaffCommand(
    Guid? DepartmentId,
    Guid? SupervisorDoctorId,
    Guid? MedicalTitleId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber
) : IRequest<Result<Guid>>;
