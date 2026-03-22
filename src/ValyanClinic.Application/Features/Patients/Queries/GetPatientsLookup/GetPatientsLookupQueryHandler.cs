using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatientsLookup;

public sealed class GetPatientsLookupQueryHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPatientsLookupQuery, Result<IEnumerable<PatientLookupDto>>>
{
    public async Task<Result<IEnumerable<PatientLookupDto>>> Handle(
        GetPatientsLookupQuery request, CancellationToken cancellationToken)
    {
        var patients = await repository.GetLookupAsync(
            currentUser.ClinicId,
            cancellationToken);

        return Result<IEnumerable<PatientLookupDto>>.Success(patients);
    }
}
