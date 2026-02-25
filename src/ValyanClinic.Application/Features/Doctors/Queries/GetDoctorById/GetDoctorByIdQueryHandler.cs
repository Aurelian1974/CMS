using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Features.Doctors.Queries.GetDoctorById;

public sealed class GetDoctorByIdQueryHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetDoctorByIdQuery, Result<DoctorDetailDto>>
{
    public async Task<Result<DoctorDetailDto>> Handle(
        GetDoctorByIdQuery request, CancellationToken cancellationToken)
    {
        var doctor = await repository.GetByIdAsync(
            request.Id,
            currentUser.ClinicId,
            cancellationToken);

        return doctor is not null
            ? Result<DoctorDetailDto>.Success(doctor)
            : Result<DoctorDetailDto>.NotFound(ErrorMessages.Doctor.NotFound);
    }
}
