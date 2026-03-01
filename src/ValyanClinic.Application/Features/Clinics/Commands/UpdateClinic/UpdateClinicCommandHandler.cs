using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;

public sealed class UpdateClinicCommandHandler(
    IClinicRepository repository,
    IClinicCaenCodeRepository caenCodeRepository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Actualizare date societate comercială
            await repository.UpdateAsync(
                currentUser.ClinicId,
                request.Name,
                request.FiscalCode,
                request.TradeRegisterNumber,
                request.LegalRepresentative,
                request.ContractCNAS,
                request.Address,
                request.City,
                request.County,
                request.PostalCode,
                request.BankName,
                request.BankAccount,
                request.Email,
                request.PhoneNumber,
                request.Website,
                cancellationToken);

            // Sincronizare coduri CAEN (înlocuiește lista complet)
            await caenCodeRepository.SyncAsync(
                currentUser.ClinicId,
                request.CaenCodeIds,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50200)
        {
            // CUI/CIF duplicat
            return Result<bool>.Conflict(ErrorMessages.Clinic.FiscalCodeDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50201)
        {
            // Clinica nu a fost găsită
            return Result<bool>.NotFound(ErrorMessages.Clinic.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
