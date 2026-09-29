using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class ConsultationServiceRepository(DapperContext context) : IConsultationServiceRepository
{
    public async Task<IReadOnlyList<ConsultationServiceDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<ConsultationServiceDto>(
            new CommandDefinition(
                ConsultationServiceProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> AddAsync(
        Guid clinicId, Guid consultationId, Guid medicalServiceId, decimal quantity, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ConsultationServiceProcedures.Add,
                new
                {
                    ClinicId = clinicId,
                    ConsultationId = consultationId,
                    MedicalServiceId = medicalServiceId,
                    Quantity = quantity,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateQuantityAsync(Guid id, Guid clinicId, decimal quantity, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationServiceProcedures.UpdateQuantity,
                new { Id = id, ClinicId = clinicId, Quantity = quantity, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationServiceProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<UnbilledInvestigationDto>> GetUnbilledInvestigationsAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<UnbilledInvestigationDto>(
            new CommandDefinition(
                ConsultationServiceProcedures.GetUnbilledInvestigations,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<int> SyncFromInvestigationsAsync(
        Guid consultationId, Guid clinicId, Guid userId, CancellationToken ct)
    {
        var parameters = new DynamicParameters(new { ClinicId = clinicId, ConsultationId = consultationId, UserId = userId });
        parameters.Add("AddedCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationServiceProcedures.SyncFromInvestigations,
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return parameters.Get<int?>("AddedCount") ?? 0;
    }
}
