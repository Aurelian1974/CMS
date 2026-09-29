using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AdministrativeStaff.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru personalul administrativ (exclusiv prin Stored Procedures).</summary>
public sealed class AdministrativeStaffRepository(DapperContext context) : IAdministrativeStaffRepository
{
    public async Task<IEnumerable<AdministrativeStaffLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<AdministrativeStaffLookupDto>(
            new CommandDefinition(
                AdministrativeStaffProcedures.GetByClinic,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<PagedResult<AdministrativeStaffListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? departmentId, Guid? positionId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                AdministrativeStaffProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    DepartmentId = departmentId,
                    PositionId = positionId,
                    IsActive = isActive,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<AdministrativeStaffListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<AdministrativeStaffListDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdministrativeStaffDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<AdministrativeStaffDetailDto>(
            new CommandDefinition(
                AdministrativeStaffProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(AdministrativeStaffCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                AdministrativeStaffProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.DepartmentId,
                    data.PositionId,
                    data.FirstName,
                    data.LastName,
                    data.Email,
                    data.PhoneNumber,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(AdministrativeStaffUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AdministrativeStaffProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.DepartmentId,
                    data.PositionId,
                    data.FirstName,
                    data.LastName,
                    data.Email,
                    data.PhoneNumber,
                    data.IsActive,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                AdministrativeStaffProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<AdministrativePositionDto>> GetPositionsAsync(bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<AdministrativePositionDto>(
            new CommandDefinition(
                AdministrativeStaffProcedures.GetPositions,
                new { IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return rows.ToList();
    }
}
