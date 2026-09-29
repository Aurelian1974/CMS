using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Commands.UpdateAdministrativeStaff;

public sealed class UpdateAdministrativeStaffCommandHandler(
    IAdministrativeStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateAdministrativeStaffCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateAdministrativeStaffCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var data = new AdministrativeStaffUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,
                DepartmentId: request.DepartmentId,
                PositionId: request.PositionId,
                FirstName: request.FirstName,
                LastName: request.LastName,
                Email: request.Email,
                PhoneNumber: request.PhoneNumber,
                IsActive: request.IsActive);

            await repository.UpdateAsync(data, currentUser.Id, cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.AdministrativeStaffMember.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffEmailDuplicate)
        {
            return Result<bool>.Conflict(ErrorMessages.AdministrativeStaffMember.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffInvalidDepartment)
        {
            return Result<bool>.Failure(ErrorMessages.AdministrativeStaffMember.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AdministrativeStaffInvalidPosition)
        {
            return Result<bool>.Failure(ErrorMessages.AdministrativeStaffMember.InvalidPosition);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
