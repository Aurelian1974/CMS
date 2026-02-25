using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Doctors.Commands.CreateDoctor;

public sealed class CreateDoctorCommandHandler(
    IDoctorRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateDoctorCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateDoctorCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.DepartmentId,
                request.SupervisorDoctorId,
                request.SpecialtyId,
                request.SubspecialtyId,
                request.MedicalTitleId,
                request.FirstName,
                request.LastName,
                request.Email,
                request.PhoneNumber,
                request.MedicalCode,
                request.LicenseNumber,
                request.LicenseExpiresAt,
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50301)
        {
            return Result<Guid>.Conflict(ErrorMessages.Doctor.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50302)
        {
            return Result<Guid>.Failure(ErrorMessages.Doctor.InvalidDepartment);
        }
        catch (SqlException ex) when (ex.Number == 50303)
        {
            return Result<Guid>.Failure(ErrorMessages.Doctor.InvalidSupervisor);
        }
        catch (SqlException ex) when (ex.Number == 50305)
        {
            return Result<Guid>.Failure(ErrorMessages.Doctor.InvalidSubspecialty);
        }
        catch (SqlException ex) when (ex.Number == 50306)
        {
            return Result<Guid>.Failure(ErrorMessages.Doctor.InvalidMedicalTitle);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
