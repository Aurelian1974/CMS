using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.ToggleSpecialty;

public sealed class ToggleSpecialtyCommandHandler(ISpecialtyRepository repository)
    : IRequestHandler<ToggleSpecialtyCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        ToggleSpecialtyCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.ToggleActiveAsync(request.Id, request.IsActive, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50102)
        {
            return Result<bool>.NotFound(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
