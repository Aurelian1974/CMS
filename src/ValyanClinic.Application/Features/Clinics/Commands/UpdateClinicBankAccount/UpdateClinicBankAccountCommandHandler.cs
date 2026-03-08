using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicBankAccount;

public sealed class UpdateClinicBankAccountCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClinicBankAccountCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateClinicBankAccountCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateBankAccountAsync(
                request.Id,
                currentUser.ClinicId,
                request.BankName,
                request.Iban,
                request.Currency,
                request.IsMain,
                request.Notes,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50250)
        {
            return Result<bool>.NotFound(ErrorMessages.ClinicBankAccount.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
