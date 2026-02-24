using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Features.Clinics.Queries.GetCurrentClinic;

public sealed class GetCurrentClinicQueryHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetCurrentClinicQuery, Result<ClinicDto>>
{
    public async Task<Result<ClinicDto>> Handle(
        GetCurrentClinicQuery request, CancellationToken cancellationToken)
    {
        var clinic = await repository.GetByIdAsync(currentUser.ClinicId, cancellationToken);

        return clinic is null
            ? Result<ClinicDto>.NotFound(ErrorMessages.Clinic.NotFound)
            : Result<ClinicDto>.Success(clinic);
    }
}
