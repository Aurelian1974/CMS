using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Queries.GetImportableInvestigationTypes;

public sealed class GetImportableInvestigationTypesQueryHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetImportableInvestigationTypesQuery, Result<IReadOnlyList<ImportableInvestigationTypeDto>>>
{
    public async Task<Result<IReadOnlyList<ImportableInvestigationTypeDto>>> Handle(
        GetImportableInvestigationTypesQuery request, CancellationToken cancellationToken)
        => Result<IReadOnlyList<ImportableInvestigationTypeDto>>.Success(
            await repository.GetImportableInvestigationTypesAsync(currentUser.ClinicId, cancellationToken));
}
