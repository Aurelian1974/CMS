using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Departments.Commands.CreateDepartment;

public sealed class CreateDepartmentCommandHandler(
    IDepartmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateDepartmentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.LocationId,
                request.Name,
                request.Code,
                request.Description,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50221)
        {
            return Result<Guid>.Conflict(ErrorMessages.Department.CodeDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50222)
        {
            return Result<Guid>.Failure(ErrorMessages.Department.InvalidLocation);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
