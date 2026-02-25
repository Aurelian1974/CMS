using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Doctors.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru doctori (exclusiv prin Stored Procedures).</summary>
public sealed class DoctorRepository(DapperContext context) : IDoctorRepository
{
    public async Task<PagedResult<DoctorListDto>> GetPagedAsync(
        Guid clinicId, string? search, Guid? specialtyId, Guid? departmentId,
        bool? isActive, int page, int pageSize, string sortBy, string sortDir,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                DoctorProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    Search = search,
                    SpecialtyId = specialtyId,
                    DepartmentId = departmentId,
                    IsActive = isActive,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDir = sortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items = (await multi.ReadAsync<DoctorListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<DoctorListDto>(items, totalCount, page, pageSize);
    }

    public async Task<DoctorDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<DoctorDetailDto>(
            new CommandDefinition(
                DoctorProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IEnumerable<DoctorLookupDto>> GetByClinicAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<DoctorLookupDto>(
            new CommandDefinition(
                DoctorProcedures.GetByClinic,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? specialtyId, Guid? subspecialtyId,
        string firstName, string lastName, string email,
        string? phoneNumber, string? medicalCode, string? licenseNumber,
        DateTime? licenseExpiresAt, Guid createdBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                DoctorProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    DepartmentId = departmentId,
                    SupervisorDoctorId = supervisorDoctorId,
                    SpecialtyId = specialtyId,
                    SubspecialtyId = subspecialtyId,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    MedicalCode = medicalCode,
                    LicenseNumber = licenseNumber,
                    LicenseExpiresAt = licenseExpiresAt,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid? departmentId, Guid? supervisorDoctorId,
        Guid? specialtyId, Guid? subspecialtyId,
        string firstName, string lastName, string email,
        string? phoneNumber, string? medicalCode, string? licenseNumber,
        DateTime? licenseExpiresAt, bool isActive, Guid updatedBy,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                DoctorProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    DepartmentId = departmentId,
                    SupervisorDoctorId = supervisorDoctorId,
                    SpecialtyId = specialtyId,
                    SubspecialtyId = subspecialtyId,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    MedicalCode = medicalCode,
                    LicenseNumber = licenseNumber,
                    LicenseExpiresAt = licenseExpiresAt,
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
                DoctorProcedures.Delete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
