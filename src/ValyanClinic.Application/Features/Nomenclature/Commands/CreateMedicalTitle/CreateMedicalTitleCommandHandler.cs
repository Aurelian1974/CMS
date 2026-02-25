using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.CreateMedicalTitle;

public sealed class CreateMedicalTitleCommandHandler(IMedicalTitleRepository repository)
    : IRequestHandler<CreateMedicalTitleCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateMedicalTitleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                request.Name,
                request.Code,
                request.Description,
                request.DisplayOrder,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50300)
        {
            // Cod duplicat
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
