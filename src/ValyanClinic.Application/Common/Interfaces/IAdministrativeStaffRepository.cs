using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract repository pentru personalul administrativ (recepționeri, manageri, administratori).
/// </summary>
public interface IAdministrativeStaffRepository
{
    Task<IEnumerable<AdministrativeStaffLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct);

    Task<PagedResult<AdministrativeStaffListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? departmentId, Guid? positionId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    Task<AdministrativeStaffDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(AdministrativeStaffCreateData data, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(AdministrativeStaffUpdateData data, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task<IReadOnlyList<AdministrativePositionDto>> GetPositionsAsync(bool? isActive, CancellationToken ct);
}

public sealed record AdministrativeStaffCreateData(
    Guid ClinicId,
    Guid? DepartmentId,
    Guid? PositionId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber);

public sealed record AdministrativeStaffUpdateData(
    Guid Id,
    Guid ClinicId,
    Guid? DepartmentId,
    Guid? PositionId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsActive);
