using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatientById;

/// <summary>Obținere pacient complet după Id (date + alergii + doctori + contacte urgență).</summary>
public sealed record GetPatientByIdQuery(Guid Id) : IRequest<Result<PatientFullDetailDto>>;

/// <summary>Răspuns complet pacient — include colecțiile copil.</summary>
public sealed class PatientFullDetailDto
{
    public required PatientDetailDto Patient { get; init; }
    public required IReadOnlyList<PatientAllergyDto> Allergies { get; init; }
    public required IReadOnlyList<PatientDoctorDto> Doctors { get; init; }
    public required IReadOnlyList<PatientEmergencyContactDto> EmergencyContacts { get; init; }
}
