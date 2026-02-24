using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.UpdateDepartment;

public sealed class UpdateDepartmentCommandHandler(
    IDepartmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateDepartmentCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.LocationId,
                request.Name,
                request.Code,
                request.Description,
                request.IsActive,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50220)
        {
            return Result<bool>.NotFound(ErrorMessages.Department.NotFound);
        }
        catch (SqlException ex) when (ex.Number == 50221)
        {
            return Result<bool>.Conflict(ErrorMessages.Department.CodeDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50222)
        {
            return Result<bool>.Failure(ErrorMessages.Department.InvalidLocation);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
