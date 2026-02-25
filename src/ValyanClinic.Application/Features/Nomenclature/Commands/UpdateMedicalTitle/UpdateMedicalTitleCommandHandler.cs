using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.UpdateMedicalTitle;

public sealed class UpdateMedicalTitleCommandHandler(IMedicalTitleRepository repository)
    : IRequestHandler<UpdateMedicalTitleCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateMedicalTitleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                request.Name,
                request.Code,
                request.Description,
                request.DisplayOrder,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50301)
        {
            // Titulatură negăsită
            return Result<bool>.NotFound(ex.Message);
        }
        catch (SqlException ex) when (ex.Number == 50300)
        {
            // Cod duplicat
            return Result<bool>.Conflict(ex.Message);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
