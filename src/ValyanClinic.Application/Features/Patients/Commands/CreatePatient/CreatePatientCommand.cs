using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Patients.Commands.CreatePatient;

/// <summary>Creare pacient nou cu alergii, doctori și contacte urgență.</summary>
public sealed record CreatePatientCommand(
    string FirstName,
    string LastName,
    string? Cnp,
    DateTime? BirthDate,
    Guid? GenderId,
    Guid? BloodTypeId,
    string? PhoneNumber,
    string? SecondaryPhone,
    string? Email,
    string? Address,
    string? City,
    string? County,
    string? PostalCode,
    string? InsuranceNumber,
    DateTime? InsuranceExpiry,
    bool IsInsured,
    string? ChronicDiseases,
    string? FamilyDoctorName,
    string? Notes,
    List<SyncAllergyItem>? Allergies,
    List<SyncDoctorItem>? Doctors,
    List<SyncEmergencyContactItem>? EmergencyContacts
) : IRequest<Result<Guid>>;
