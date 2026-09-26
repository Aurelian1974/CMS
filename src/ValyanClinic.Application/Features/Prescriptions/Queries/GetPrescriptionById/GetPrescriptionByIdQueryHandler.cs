using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionById;

public sealed class GetPrescriptionByIdQueryHandler(
    IPrescriptionRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetPrescriptionByIdQuery, Result<PrescriptionDetailDto>>
{
    public async Task<Result<PrescriptionDetailDto>> Handle(
        GetPrescriptionByIdQuery request, CancellationToken cancellationToken)
    {
        var prescription = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);

        return prescription is null
            ? Result<PrescriptionDetailDto>.NotFound(ErrorMessages.Prescription.NotFound)
            : Result<PrescriptionDetailDto>.Success(prescription);
    }
}
