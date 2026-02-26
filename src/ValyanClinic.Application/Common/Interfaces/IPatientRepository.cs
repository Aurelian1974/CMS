using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe pacienții clinicii.
/// </summary>
public interface IPatientRepository
{
    Task<PagedResult<PatientListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? genderId, Guid? doctorId,
        bool? hasAllergies, bool? isActive,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    /// <summary>Returnează statistici globale pacienți (total, activi, cu alergii, noi luna curentă).</summary>
    Task<PatientStatsDto> GetStatsAsync(Guid clinicId, CancellationToken ct);

    /// <summary>Detalii complete pacient — 4 result sets: pacient, alergii, doctori, contacte urgență.</summary>
    Task<PatientFullResult?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(
        Guid clinicId, string firstName, string lastName,
        string? cnp, DateTime? birthDate, Guid? genderId, Guid? bloodTypeId,
        string? phoneNumber, string? secondaryPhone, string? email, string? address,
        string? city, string? county, string? postalCode,
        string? insuranceNumber, DateTime? insuranceExpiry, bool isInsured,
        string? chronicDiseases, string? familyDoctorName, string? notes,
        Guid createdBy, CancellationToken ct);

    Task UpdateAsync(
        Guid id, Guid clinicId, string firstName, string lastName,
        string? cnp, DateTime? birthDate, Guid? genderId, Guid? bloodTypeId,
        string? phoneNumber, string? secondaryPhone, string? email, string? address,
        string? city, string? county, string? postalCode,
        string? insuranceNumber, DateTime? insuranceExpiry, bool isInsured,
        string? chronicDiseases, string? familyDoctorName, string? notes,
        bool isActive, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task SyncAllergiesAsync(Guid patientId, Guid createdBy, IEnumerable<SyncAllergyItem> allergies, CancellationToken ct);

    Task SyncDoctorsAsync(Guid patientId, Guid createdBy, IEnumerable<SyncDoctorItem> doctors, CancellationToken ct);

    Task SyncEmergencyContactsAsync(Guid patientId, Guid createdBy, IEnumerable<SyncEmergencyContactItem> contacts, CancellationToken ct);
}

/// <summary>Elementul individual pentru sincronizare alergii (table-valued parameter).</summary>
public sealed record SyncAllergyItem(
    Guid AllergyTypeId,
    Guid AllergySeverityId,
    string AllergenName,
    string? Reaction,
    DateTime? OnsetDate,
    string? Notes);

/// <summary>Elementul individual pentru sincronizare doctori (table-valued parameter).</summary>
public sealed record SyncDoctorItem(
    Guid DoctorId,
    bool IsPrimary,
    string? Notes);

/// <summary>Elementul individual pentru sincronizare contacte urgență (table-valued parameter).</summary>
public sealed record SyncEmergencyContactItem(
    string FullName,
    string Relationship,
    string PhoneNumber,
    bool IsDefault,
    string? Notes);

/// <summary>Toate cele 4 result sets de la Patient_GetById.</summary>
public sealed class PatientFullResult
{
    public required PatientDetailDto Patient { get; init; }
    public required IReadOnlyList<PatientAllergyDto> Allergies { get; init; }
    public required IReadOnlyList<PatientDoctorDto> Doctors { get; init; }
    public required IReadOnlyList<PatientEmergencyContactDto> EmergencyContacts { get; init; }
}
