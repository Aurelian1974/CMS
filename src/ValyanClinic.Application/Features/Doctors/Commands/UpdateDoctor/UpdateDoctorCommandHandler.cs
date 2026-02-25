using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.UpdateDoctor;

public sealed class UpdateDoctorCommandHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateDoctorCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateDoctorCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.SpecialtyId,
                request.SubspecialtyId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                request.MedicalCode,
                request.LicenseNumber,
                request.LicenseExpiresAt,
                request.IsActive,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50300)
        {
            return Result<bool>.NotFound(ErrorMessages.Doctor.NotFound);
        }
        catch (SqlException ex) when (ex.Number == 50301)
        {
            return Result<bool>.Conflict(ErrorMessages.Doctor.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50302)
        {
            return Result<bool>.Failure(ErrorMessages.Doctor.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == 50303)
        {
            return Result<bool>.Failure(ErrorMessages.Doctor.InvalidSupervisor);
        }
        catch (SqlException ex) when (ex.Number == 50304)
        {
            return Result<bool>.Failure(ErrorMessages.Doctor.CircularSupervisor);
        }
        catch (SqlException ex) when (ex.Number == 50305)
        {
            return Result<bool>.Failure(ErrorMessages.Doctor.InvalidSubspecialty);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
