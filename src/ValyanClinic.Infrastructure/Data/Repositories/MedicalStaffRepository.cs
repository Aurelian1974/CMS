using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.MedicalStaff.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru personal medical (exclusiv prin Stored Procedures).</summary>
public sealed class MedicalStaffRepository(DapperContext context) : IMedicalStaffRepository
{
    public async Task<IEnumerable<MedicalStaffLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<MedicalStaffLookupDto>(
            new CommandDefinition(
                MedicalStaffProcedures.GetByClinic,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<PagedResult<MedicalStaffListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? departmentId, Guid? medicalTitleId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                MedicalStaffProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    DepartmentId = departmentId,
                    MedicalTitleId = medicalTitleId,
                    IsActive = isActive,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<MedicalStaffListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<MedicalStaffListDto>(items, totalCount, page, pageSize);
    }

    public async Task<MedicalStaffDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<MedicalStaffDetailDto>(
            new CommandDefinition(
                MedicalStaffProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? medicalTitleId, string firstName, string lastName, string email,
        string? phoneNumber, Guid createdBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                MedicalStaffProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    DepartmentId = departmentId,
                    SupervisorDoctorId = supervisorDoctorId,
                    MedicalTitleId = medicalTitleId,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? medicalTitleId, string firstName, string lastName, string email,
        string? phoneNumber, bool isActive, Guid updatedBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                MedicalStaffProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    DepartmentId = departmentId,
                    SupervisorDoctorId = supervisorDoctorId,
                    MedicalTitleId = medicalTitleId,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    IsActive = isActive,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                MedicalStaffProcedures.Delete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
