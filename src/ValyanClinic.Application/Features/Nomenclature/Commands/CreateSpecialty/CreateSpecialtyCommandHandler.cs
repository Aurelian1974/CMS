using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.CreateSpecialty;

public sealed class CreateSpecialtyCommandHandler(ISpecialtyRepository repository)
    : IRequestHandler<CreateSpecialtyCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateSpecialtyCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                request.ParentId,
                request.Name,
                request.Code,
                request.Description,
                request.DisplayOrder,
                request.Level,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50100)
        {
            // Cod duplicat
            return Result<Guid>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number == 50101)
        {
            // Părinte inexistent
            return Result<Guid>.NotFound(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
