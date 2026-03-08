using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicBankAccount;

public sealed class CreateClinicBankAccountCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClinicBankAccountCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateClinicBankAccountCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateBankAccountAsync(
                currentUser.ClinicId,
                request.BankName,
                request.Iban,
                request.Currency,
                request.IsMain,
                request.Notes,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50201)
        {
            return Result<Guid>.NotFound(ErrorMessages.Clinic.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
