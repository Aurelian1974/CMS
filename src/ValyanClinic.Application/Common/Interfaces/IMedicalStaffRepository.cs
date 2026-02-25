using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe personalul medical (non-doctor).
/// </summary>
public interface IMedicalStaffRepository
{
    Task<IEnumerable<MedicalStaffLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct);

    Task<PagedResult<MedicalStaffListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? departmentId, Guid? medicalTitleId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    Task<MedicalStaffDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(
        Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? medicalTitleId, string firstName, string lastName, string email,
        string? phoneNumber, Guid createdBy,
        CancellationToken ct);

    Task UpdateAsync(
        Guid id, Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? medicalTitleId, string firstName, string lastName, string email,
        string? phoneNumber, bool isActive, Guid updatedBy,
        CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct);
}
