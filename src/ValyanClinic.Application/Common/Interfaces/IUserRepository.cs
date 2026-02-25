using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<PagedResult<UserListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? roleId, bool? isActive,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct);

    Task<UserDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct);

    Task<Guid> CreateAsync(
        Guid clinicId, Guid roleId, Guid? doctorId, Guid? medicalStaffId,
        string username, string email, string passwordHash, string firstName, string lastName,
        bool isActive, Guid createdBy, CancellationToken ct);

    Task UpdateAsync(
        Guid id, Guid clinicId, Guid roleId, Guid? doctorId, Guid? medicalStaffId,
        string username, string email, string firstName, string lastName,
        bool isActive, Guid updatedBy, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct);

    Task UpdatePasswordAsync(Guid id, Guid clinicId, string passwordHash, Guid updatedBy, CancellationToken ct);

    Task<IReadOnlyList<RoleDto>> GetAllRolesAsync(CancellationToken ct);
}
