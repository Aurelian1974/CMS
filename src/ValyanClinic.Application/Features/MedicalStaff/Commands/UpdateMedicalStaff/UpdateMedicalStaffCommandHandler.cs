using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.UpdateMedicalStaff;

public sealed class UpdateMedicalStaffCommandHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateMedicalStaffCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateMedicalStaffCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.MedicalTitleId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                request.IsActive,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50400)
        {
            return Result<bool>.NotFound(ErrorMessages.MedicalStaffMember.NotFound);
        }
        catch (SqlException ex) when (ex.Number == 50401)
        {
            return Result<bool>.Conflict(ErrorMessages.MedicalStaffMember.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50402)
        {
            return Result<bool>.Failure(ErrorMessages.MedicalStaffMember.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == 50403)
        {
            return Result<bool>.Failure(ErrorMessages.MedicalStaffMember.InvalidSupervisor);
        }
        catch (SqlException ex) when (ex.Number == 50406)
        {
            return Result<bool>.Failure(ErrorMessages.MedicalStaffMember.InvalidMedicalTitle);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
