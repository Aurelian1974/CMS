using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContact;

public sealed class CreateClinicContactCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClinicContactCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateClinicContactCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateContactAsync(
                currentUser.ClinicId,
                request.ContactType,
                request.Value,
                request.Label,
                request.IsMain,
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
