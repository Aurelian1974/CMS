using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.SyncClinicCaenCodes;

public sealed class SyncClinicCaenCodesCommandHandler(
    IClinicCaenCodeRepository caenCodeRepository,
    ICurrentUser currentUser)
    : IRequestHandler<SyncClinicCaenCodesCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        SyncClinicCaenCodesCommand request, CancellationToken cancellationToken)
    {
        await caenCodeRepository.SyncAsync(
            currentUser.ClinicId,
            request.CaenCodeIds,
            cancellationToken);

        return Result<bool>.Success(true);
    }
}
