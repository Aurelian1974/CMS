using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.CreateMedicalStaff;

public sealed class CreateMedicalStaffCommandHandler(
    IMedicalStaffRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateMedicalStaffCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateMedicalStaffCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.MedicalTitleId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50401)
        {
            return Result<Guid>.Conflict(ErrorMessages.MedicalStaffMember.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50402)
        {
            return Result<Guid>.Failure(ErrorMessages.MedicalStaffMember.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == 50403)
        {
            return Result<Guid>.Failure(ErrorMessages.MedicalStaffMember.InvalidSupervisor);
        }
        catch (SqlException ex) when (ex.Number == 50406)
        {
            return Result<Guid>.Failure(ErrorMessages.MedicalStaffMember.InvalidMedicalTitle);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
