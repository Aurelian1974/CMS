using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Departments.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru departamente (exclusiv prin Stored Procedures).</summary>
public sealed class DepartmentRepository(DapperContext context) : IDepartmentRepository
{
    public async Task<IEnumerable<DepartmentDto>> GetByClinicAsync(
        Guid clinicId, bool? isActive, Guid? locationId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<DepartmentDto>(
            new CommandDefinition(
                DepartmentProcedures.GetByClinic,
                new { ClinicId = clinicId, IsActive = isActive, LocationId = locationId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<DepartmentDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<DepartmentDto>(
            new CommandDefinition(
                DepartmentProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, Guid locationId, string name, string code, string? description,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                DepartmentProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    LocationId = locationId,
                    Name = name,
                    Code = code,
                    Description = description
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, Guid locationId, string name, string code,
        string? description, bool isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                DepartmentProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    LocationId = locationId,
                    Name = name,
                    Code = code,
                    Description = description,
                    IsActive = isActive
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                DepartmentProcedures.Delete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
