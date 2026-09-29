using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;

public sealed class ImportInvestigationServicesCommandHandler(
    ITariffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<ImportInvestigationServicesCommand, Result<int>>
{
    public async Task<Result<int>> Handle(ImportInvestigationServicesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var items = request.Items
                .Select(i => new InvestigationServiceImportItem(i.InvestigationTypeCode.Trim(), i.Name.Trim(), i.Price))
                .ToList();

            var count = await repository.ImportInvestigationServicesAsync(
                new InvestigationServicesImportData(
                    ClinicId: currentUser.ClinicId,
                    Items: items,
                    VatRateId: request.VatRateId,
                    ValidFrom: request.ValidFrom),
                currentUser.Id,
                cancellationToken);

            return Result<int>.Success(count);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.InvestigationServiceAlreadyExists)
        {
            return Result<int>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<int>.Failure(ex.Message);
        }
    }
}
