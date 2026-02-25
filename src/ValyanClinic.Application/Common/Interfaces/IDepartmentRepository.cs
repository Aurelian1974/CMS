using ValyanClinic.Application.Features.Departments.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru operații pe departamentele clinicii.
/// </summary>
public interface IDepartmentRepository
{
    Task<IEnumerable<DepartmentDto>> GetByClinicAsync(
        Guid clinicId, bool? isActive, Guid? locationId, CancellationToken ct);
    Task<DepartmentDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);
    Task<Guid> CreateAsync(
        Guid clinicId, Guid locationId, string name, string code, string? description,
        CancellationToken ct);
    Task UpdateAsync(
        Guid id, Guid clinicId, Guid locationId, string name, string code,
        string? description, Guid? headDoctorId, bool isActive, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct);
}
