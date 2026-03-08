using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContactPerson;

public sealed class CreateClinicContactPersonCommandHandler(
    IClinicRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClinicContactPersonCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateClinicContactPersonCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateContactPersonAsync(
                currentUser.ClinicId,
                request.Name,
                request.Function,
                request.PhoneNumber,
                request.Email,
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
