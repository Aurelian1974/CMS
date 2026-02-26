using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatientById;

public sealed class GetPatientByIdQueryHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPatientByIdQuery, Result<PatientFullDetailDto>>
{
    public async Task<Result<PatientFullDetailDto>> Handle(
        GetPatientByIdQuery request, CancellationToken cancellationToken)
    {
        var result = await repository.GetByIdAsync(
            request.Id, currentUser.ClinicId, cancellationToken);

        if (result is null)
            return Result<PatientFullDetailDto>.NotFound(ErrorMessages.Patient.NotFound);

        var response = new PatientFullDetailDto
        {
            Patient = result.Patient,
            Allergies = result.Allergies,
            Doctors = result.Doctors,
            EmergencyContacts = result.EmergencyContacts
        };

        return Result<PatientFullDetailDto>.Success(response);
    }
}
