using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.UpdateSpecialty;

public sealed class UpdateSpecialtyCommandHandler(ISpecialtyRepository repository)
    : IRequestHandler<UpdateSpecialtyCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateSpecialtyCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                request.ParentId,
                request.Name,
                request.Code,
                request.Description,
                request.DisplayOrder,
                request.Level,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50102)
        {
            return Result<bool>.NotFound(ex.Message);
        }
        catch (SqlException ex) when (ex.Number == 50100)
        {
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number == 50103)
        {
            return Result<bool>.Failure(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
