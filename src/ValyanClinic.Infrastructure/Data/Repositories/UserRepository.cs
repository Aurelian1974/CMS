using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class UserRepository(DapperContext context) : IUserRepository
{
    public async Task<PagedResult<UserListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? roleId, bool? isActive,
        int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                UserProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId, Search = search,
                    RoleId = roleId, IsActive = isActive,
                    Page = page, PageSize = pageSize,
                    SortBy = sortBy, SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<UserListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        return new PagedResult<UserListDto>(items, totalCount, page, pageSize);
    }

    public async Task<UserDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<UserDetailDto>(
            new CommandDefinition(
                UserProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid roleId, Guid? doctorId, Guid? medicalStaffId,
        string username, string email, string passwordHash, string firstName, string lastName,
        bool isActive, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                UserProcedures.Create,
                new
                {
                    ClinicId = clinicId, RoleId = roleId,
                    DoctorId = doctorId, MedicalStaffId = medicalStaffId,
                    Username = username, Email = email, PasswordHash = passwordHash,
                    FirstName = firstName, LastName = lastName,
                    IsActive = isActive, CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid roleId, Guid? doctorId, Guid? medicalStaffId,
        string username, string email, string firstName, string lastName,
        bool isActive, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserProcedures.Update,
                new
                {
                    Id = id, ClinicId = clinicId, RoleId = roleId,
                    DoctorId = doctorId, MedicalStaffId = medicalStaffId,
                    Username = username, Email = email, FirstName = firstName, LastName = lastName,
                    IsActive = isActive, UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdatePasswordAsync(Guid id, Guid clinicId, string passwordHash, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                UserProcedures.UpdatePassword,
                new { Id = id, ClinicId = clinicId, PasswordHash = passwordHash, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<RoleDto>> GetAllRolesAsync(CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var roles = await connection.QueryAsync<RoleDto>(
            new CommandDefinition(
                RoleProcedures.GetAll,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return roles.ToList().AsReadOnly();
    }
}
