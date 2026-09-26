using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class PrescriptionRepository(DapperContext context) : IPrescriptionRepository
{
    public async Task<PrescriptionPagedResult> GetPagedAsync(
        Guid clinicId, PrescriptionFilterData filter, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PrescriptionProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    filter.Search,
                    filter.PrescriptionTypeId,
                    filter.StatusId,
                    filter.DoctorId,
                    filter.PatientId,
                    DateFrom = filter.DateFrom?.Date,
                    DateTo = filter.DateTo?.Date,
                    filter.Page,
                    filter.PageSize,
                    filter.SortBy,
                    filter.SortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items      = (await multi.ReadAsync<PrescriptionListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats      = await multi.ReadSingleAsync<PrescriptionStatsDto>();

        return new PrescriptionPagedResult(
            new PagedResult<PrescriptionListDto>(items, totalCount, filter.Page, filter.PageSize),
            stats);
    }

    public async Task<PrescriptionDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PrescriptionProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header = await multi.ReadFirstOrDefaultAsync<PrescriptionDetailDto>();
        if (header is null) return null;

        var items = (await multi.ReadAsync<PrescriptionItemDto>()).ToList();
        return header with { Items = items };
    }

    public async Task<IReadOnlyList<PrescriptionListDto>> GetByConsultationAsync(
        Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<PrescriptionListDto>(
            new CommandDefinition(
                PrescriptionProcedures.GetByConsultation,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<PrescriptionLookupsDto> GetLookupsAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                PrescriptionProcedures.GetLookups,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new PrescriptionLookupsDto
        {
            Types             = (await multi.ReadAsync<PrescriptionTypeLookupDto>()).ToList(),
            Statuses          = (await multi.ReadAsync<PrescriptionLookupItemDto>()).ToList(),
            CareTypes         = (await multi.ReadAsync<PrescriptionCareTypeLookupDto>()).ToList(),
            InsuredCategories = (await multi.ReadAsync<PrescriptionLookupItemDto>()).ToList(),
        };
    }

    public async Task<IReadOnlyList<Guid>> CreateAsync(
        PrescriptionCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var ids = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                PrescriptionProcedures.CreateFromItems,
                new
                {
                    data.ClinicId,
                    data.PatientId,
                    data.DoctorId,
                    data.ConsultationId,
                    data.CareTypeId,
                    data.InsuredCategoryId,
                    data.TreatmentDays,
                    data.Diagnostic,
                    data.DiagnosticCodes,
                    data.RegistryNumber,
                    data.IsContinuation,
                    data.ReferralLetterNumber,
                    data.Notes,
                    Items = BuildItemsTable(data.Items),
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return ids.ToList();
    }

    public async Task<IReadOnlyList<Guid>> GenerateFromConsultationAsync(
        Guid consultationId, Guid clinicId, Guid? careTypeId, Guid? insuredCategoryId, int? treatmentDays,
        Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var ids = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                PrescriptionProcedures.GenerateFromConsultation,
                new
                {
                    ClinicId = clinicId,
                    ConsultationId = consultationId,
                    CareTypeId = careTypeId,
                    InsuredCategoryId = insuredCategoryId,
                    TreatmentDays = treatmentDays,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return ids.ToList();
    }

    public async Task UpdateAsync(PrescriptionUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PrescriptionProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.CareTypeId,
                    data.InsuredCategoryId,
                    data.TreatmentDays,
                    data.Diagnostic,
                    data.DiagnosticCodes,
                    data.RegistryNumber,
                    data.IsContinuation,
                    data.ReferralLetterNumber,
                    data.Notes,
                    Items = BuildItemsTable(data.Items),
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task IssueAsync(Guid id, Guid clinicId, Guid issuedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PrescriptionProcedures.Issue,
                new { Id = id, ClinicId = clinicId, IssuedBy = issuedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task CancelAsync(Guid id, Guid clinicId, string reason, Guid cancelledBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PrescriptionProcedures.Cancel,
                new { Id = id, ClinicId = clinicId, Reason = reason, CancelledBy = cancelledBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task DeleteAsync(Guid id, Guid clinicId, Guid deletedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PrescriptionProcedures.Delete,
                new { Id = id, ClinicId = clinicId, DeletedBy = deletedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SetTransmissionAsync(
        Guid id, Guid clinicId, string? electronicId, bool isOffline, string? errorMessage,
        Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PrescriptionProcedures.SetTransmission,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    ElectronicId = electronicId,
                    IsOffline = isOffline,
                    ErrorMessage = errorMessage,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // Ordinea coloanelor trebuie să fie identică cu dbo.PrescriptionItemTableType
    private static SqlMapper.ICustomQueryParameter BuildItemsTable(IReadOnlyList<PrescriptionItemData> items)
    {
        var table = new DataTable();
        table.Columns.Add("ConsultationMedicationId", typeof(Guid));
        table.Columns.Add("DrugCode", typeof(string));
        table.Columns.Add("DrugName", typeof(string));
        table.Columns.Add("CopaymentListType", typeof(string));
        table.Columns.Add("DiagnosisCode", typeof(string));
        table.Columns.Add("DoseMorning", typeof(decimal));
        table.Columns.Add("DoseAfternoon", typeof(decimal));
        table.Columns.Add("DoseEvening", typeof(decimal));
        table.Columns.Add("DurationDays", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("Instructions", typeof(string));
        table.Columns.Add("SortOrder", typeof(int));

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            table.Rows.Add(
                (object?)item.ConsultationMedicationId ?? DBNull.Value,
                (object?)item.DrugCode ?? DBNull.Value,
                (object?)item.DrugName ?? DBNull.Value,
                (object?)item.CopaymentListType ?? DBNull.Value,
                (object?)item.DiagnosisCode ?? DBNull.Value,
                (object?)item.DoseMorning ?? DBNull.Value,
                (object?)item.DoseAfternoon ?? DBNull.Value,
                (object?)item.DoseEvening ?? DBNull.Value,
                (object?)item.DurationDays ?? DBNull.Value,
                (object?)item.Quantity ?? DBNull.Value,
                (object?)item.Instructions ?? DBNull.Value,
                i);
        }

        return table.AsTableValuedParameter(PrescriptionProcedures.ItemTableType);
    }
}
