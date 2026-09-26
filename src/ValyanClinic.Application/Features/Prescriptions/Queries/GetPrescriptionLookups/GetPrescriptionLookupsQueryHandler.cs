using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionLookups;

public sealed class GetPrescriptionLookupsQueryHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPrescriptionLookupsQuery, Result<PrescriptionLookupsDto>>
{
    public async Task<Result<PrescriptionLookupsDto>> Handle(
        GetPrescriptionLookupsQuery request, CancellationToken cancellationToken)
        => Result<PrescriptionLookupsDto>.Success(
            await repository.GetLookupsAsync(currentUser.ClinicId, cancellationToken));
}
