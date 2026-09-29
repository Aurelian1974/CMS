using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Commands.CreateAdministrativeStaff;

public sealed class CreateAdministrativeStaffCommandHandler(
    IAdministrativeStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateAdministrativeStaffCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateAdministrativeStaffCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new AdministrativeStaffCreateData(
                ClinicId: currentUser.ClinicId,
                DepartmentId: request.DepartmentId,
                PositionId: request.PositionId,
                FirstName: request.FirstName,
                LastName: request.LastName,
                Email: request.Email,
                PhoneNumber: request.PhoneNumber);

            var id = await repository.CreateAsync(data, currentUser.Id, cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffEmailDuplicate)
        {
            return Result<Guid>.Conflict(ErrorMessages.AdministrativeStaffMember.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffInvalidDepartment)
        {
            return Result<Guid>.Failure(ErrorMessages.AdministrativeStaffMember.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffInvalidPosition)
        {
            return Result<Guid>.Failure(ErrorMessages.AdministrativeStaffMember.InvalidPosition);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
