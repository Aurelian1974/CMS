using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationMedications.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class ConsultationMedicationRepository(DapperContext context) : IConsultationMedicationRepository
{
    public async Task<IReadOnlyList<ConsultationMedicationDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<ConsultationMedicationDto>(
            new CommandDefinition(
                ConsultationMedicationProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<CnasDrugLookupDto>> SearchDrugsAsync(
        Guid clinicId, string search, int top, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<CnasDrugLookupDto>(
            new CommandDefinition(
                ConsultationMedicationProcedures.SearchDrugs,
                new { ClinicId = clinicId, Search = search, Top = top },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> CreateAsync(ConsultationMedicationCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                ConsultationMedicationProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.ConsultationId,
                    data.DrugCode,
                    data.CopaymentListType,
                    data.DoseMorning,
                    data.DoseAfternoon,
                    data.DoseEvening,
                    data.DurationDays,
                    data.Notes,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(ConsultationMedicationUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                ConsultationMedicationProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.CopaymentListType,
                    data.DoseMorning,
                    data.DoseAfternoon,
                    data.DoseEvening,
                    data.DurationDays,
                    data.Notes,
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
                ConsultationMedicationProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
