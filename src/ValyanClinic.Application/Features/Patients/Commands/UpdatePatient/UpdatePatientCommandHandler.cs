using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Patients.Commands.UpdatePatient;

public sealed class UpdatePatientCommandHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdatePatientCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdatePatientCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.FirstName,
                request.LastName,
                request.Cnp,
                request.BirthDate,
                request.GenderId,
                request.BloodTypeId,
                request.PhoneNumber,
                request.SecondaryPhone,
                request.Email,
                request.Address,
                request.City,
                request.County,
                request.PostalCode,
                request.InsuranceNumber,
                request.InsuranceExpiry,
                request.IsInsured,
                request.ChronicDiseases,
                request.FamilyDoctorName,
                request.Notes,
                request.IsActive,
                currentUser.Id,
                cancellationToken);

            // Sincronizare colecții copil
            if (request.Allergies is not null)
                await repository.SyncAllergiesAsync(request.Id, currentUser.Id, request.Allergies, cancellationToken);

            if (request.Doctors is not null)
                await repository.SyncDoctorsAsync(request.Id, currentUser.Id, request.Doctors, cancellationToken);

            if (request.EmergencyContacts is not null)
                await repository.SyncEmergencyContactsAsync(request.Id, currentUser.Id, request.EmergencyContacts, cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.Patient.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientCnpDuplicate)
        {
            return Result<bool>.Conflict(ErrorMessages.Patient.CnpDuplicate);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
