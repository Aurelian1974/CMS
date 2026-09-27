using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetMedicalServiceById;

public sealed class GetMedicalServiceByIdQueryHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMedicalServiceByIdQuery, Result<MedicalServiceDetailDto>>
{
    public async Task<Result<MedicalServiceDetailDto>> Handle(
        GetMedicalServiceByIdQuery request, CancellationToken cancellationToken)
    {
        var service = await repository.GetByIdAsync(request.Id, currentUser.ClinicId, cancellationToken);

        return service is null
            ? Result<MedicalServiceDetailDto>.NotFound(ErrorMessages.Tariff.ServiceNotFound)
            : Result<MedicalServiceDetailDto>.Success(service);
    }
}
