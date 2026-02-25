using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe doctorii clinicii.
/// </summary>
public interface IDoctorRepository
{
    Task<PagedResult<DoctorListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? specialtyId, Guid? departmentId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    Task<DoctorDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<IEnumerable<DoctorLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(
        Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? specialtyId, Guid? subspecialtyId, Guid? medicalTitleId,
        string firstName, string lastName, string email,
        string? phoneNumber, string? medicalCode, string? licenseNumber,
        DateTime? licenseExpiresAt, Guid createdBy,
        CancellationToken ct);

    Task UpdateAsync(
        Guid id, Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? specialtyId, Guid? subspecialtyId, Guid? medicalTitleId,
        string firstName, string lastName, string email,
        string? phoneNumber, string? medicalCode, string? licenseNumber,
        DateTime? licenseExpiresAt, bool isActive, Guid updatedBy,
        CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct);
}
