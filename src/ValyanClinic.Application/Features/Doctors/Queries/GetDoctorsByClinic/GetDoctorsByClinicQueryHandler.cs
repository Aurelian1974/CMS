using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctorsByClinic;

public sealed class GetDoctorsByClinicQueryHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetDoctorsByClinicQuery, Result<IEnumerable<DoctorLookupDto>>>
{
    public async Task<Result<IEnumerable<DoctorLookupDto>>> Handle(
        GetDoctorsByClinicQuery request, CancellationToken cancellationToken)
    {
        var doctors = await repository.GetByClinicAsync(
            currentUser.ClinicId,
            cancellationToken);

        return Result<IEnumerable<DoctorLookupDto>>.Success(doctors);
    }
}
