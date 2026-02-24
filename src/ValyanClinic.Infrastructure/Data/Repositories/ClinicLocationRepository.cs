using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Clinics.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

/// <summary>Repository Dapper pentru locațiile fizice ale clinicii (exclusiv prin Stored Procedures).</summary>
public sealed class ClinicLocationRepository(DapperContext context) : IClinicLocationRepository
{
    public async Task<IEnumerable<ClinicLocationDto>> GetByClinicAsync(
        Guid clinicId, bool? isActive, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryAsync<ClinicLocationDto>(
            new CommandDefinition(
                ClinicLocationProcedures.GetByClinic,
                new { ClinicId = clinicId, IsActive = isActive },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<ClinicLocationDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<ClinicLocationDto>(
            new CommandDefinition(
                ClinicLocationProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> CreateAsync(
        Guid clinicId, string name, string address, string city, string county,
        string? postalCode, string? phoneNumber, string? email, bool isPrimary,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ClinicLocationProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    Name = name,
                    Address = address,
                    City = city,
                    County = county,
                    PostalCode = postalCode,
                    PhoneNumber = phoneNumber,
                    Email = email,
                    IsPrimary = isPrimary
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(
        Guid id, Guid clinicId, string name, string address, string city, string county,
        string? postalCode, string? phoneNumber, string? email, bool isPrimary,
        CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicLocationProcedures.Update,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    Name = name,
                    Address = address,
                    City = city,
                    County = county,
                    PostalCode = postalCode,
                    PhoneNumber = phoneNumber,
                    Email = email,
                    IsPrimary = isPrimary
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ClinicLocationProcedures.Delete,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
