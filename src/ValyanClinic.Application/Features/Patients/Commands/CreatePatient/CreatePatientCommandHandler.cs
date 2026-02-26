using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

public sealed class CreatePatientCommandHandler(
    IPatientRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePatientCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreatePatientCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var patientId = await repository.CreateAsync(
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
                currentUser.Id,
                cancellationToken);

            // Sincronizare colecții copil (dacă au fost trimise)
            if (request.Allergies is { Count: > 0 })
                await repository.SyncAllergiesAsync(patientId, currentUser.Id, request.Allergies, cancellationToken);

            if (request.Doctors is { Count: > 0 })
                await repository.SyncDoctorsAsync(patientId, currentUser.Id, request.Doctors, cancellationToken);

            if (request.EmergencyContacts is { Count: > 0 })
                await repository.SyncEmergencyContactsAsync(patientId, currentUser.Id, request.EmergencyContacts, cancellationToken);

            return Result<Guid>.Created(patientId);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.PatientCnpDuplicate)
        {
            return Result<Guid>.Conflict(ErrorMessages.Patient.CnpDuplicate);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
