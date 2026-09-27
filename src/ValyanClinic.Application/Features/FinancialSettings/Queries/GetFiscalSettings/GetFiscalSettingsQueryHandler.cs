using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;

namespace ValyanClinic.Application.Features.FinancialSettings.Queries.GetFiscalSettings;

public sealed class GetFiscalSettingsQueryHandler(
    IFinancialSettingsRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetFiscalSettingsQuery, Result<FiscalSettingsDto>>
{
    public async Task<Result<FiscalSettingsDto>> Handle(GetFiscalSettingsQuery request, CancellationToken cancellationToken)
        => Result<FiscalSettingsDto>.Success(
            await repository.GetFiscalSettingsAsync(currentUser.ClinicId, cancellationToken));
}
