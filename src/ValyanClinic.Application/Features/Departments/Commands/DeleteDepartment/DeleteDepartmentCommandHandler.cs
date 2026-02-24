using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.DeleteDepartment;

public sealed class DeleteDepartmentCommandHandler(
    IDepartmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteDepartmentCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(
                request.Id,
                currentUser.ClinicId,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50220)
        {
            return Result<bool>.NotFound(ErrorMessages.Department.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
