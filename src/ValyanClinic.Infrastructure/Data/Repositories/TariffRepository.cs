using System.Data;
using System.Text.Json;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class TariffRepository(DapperContext context) : ITariffRepository
{
    public async Task<MedicalServicePagedResult> GetPagedAsync(
        Guid clinicId, MedicalServiceFilterData filter, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                TariffProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    filter.Search,
                    filter.CategoryId,
                    filter.IsActive,
                    filter.Page,
                    filter.PageSize,
                    filter.SortBy,
                    filter.SortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items      = (await multi.ReadAsync<MedicalServiceListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats      = await multi.ReadSingleAsync<MedicalServiceStatsDto>();

        return new MedicalServicePagedResult(
            new PagedResult<MedicalServiceListDto>(items, totalCount, filter.Page, filter.PageSize),
            stats);
    }

    public async Task<MedicalServiceDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                TariffProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header = await multi.ReadFirstOrDefaultAsync<MedicalServiceDetailDto>();
        if (header is null) return null;

        var prices = (await multi.ReadAsync<MedicalServicePriceDto>()).ToList();
        return header with { Prices = prices };
    }

    public async Task<Guid> CreateAsync(MedicalServiceCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                TariffProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.Code,
                    data.Name,
                    data.CategoryId,
                    data.DurationMinutes,
                    data.InvestigationTypeCode,
                    data.Price,
                    data.VatRateId,
                    ValidFrom = data.ValidFrom?.ToDateTime(TimeOnly.MinValue),
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateAsync(MedicalServiceUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                TariffProcedures.Update,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.Code,
                    data.Name,
                    data.CategoryId,
                    data.DurationMinutes,
                    data.InvestigationTypeCode,
                    data.RowVersion,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SetActiveAsync(Guid id, Guid clinicId, bool isActive, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                TariffProcedures.SetActive,
                new { Id = id, ClinicId = clinicId, IsActive = isActive, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<Guid> AddPriceAsync(
        Guid clinicId, Guid medicalServiceId, decimal price, Guid vatRateId, DateOnly validFrom,
        Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                TariffProcedures.AddPrice,
                new
                {
                    ClinicId = clinicId,
                    MedicalServiceId = medicalServiceId,
                    Price = price,
                    VatRateId = vatRateId,
                    ValidFrom = validFrom.ToDateTime(TimeOnly.MinValue),
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<BillingLookupsDto> GetLookupsAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                TariffProcedures.GetLookups,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        return new BillingLookupsDto
        {
            ServiceCategories = (await multi.ReadAsync<ServiceCategoryDto>()).ToList(),
            VatRates          = (await multi.ReadAsync<VatRateDto>()).ToList(),
            PaymentMethods    = (await multi.ReadAsync<PaymentMethodDto>()).ToList(),
            InvoiceSeries     = (await multi.ReadAsync<InvoiceSeriesLookupDto>()).ToList(),
        };
    }

    public async Task<IReadOnlyList<VatRateDto>> GetVatRatesAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<VatRateDto>(
            new CommandDefinition(
                TariffProcedures.GetVatRates,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> CreateVatRateAsync(
        Guid clinicId, string code, VatRateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                TariffProcedures.CreateVatRate,
                new
                {
                    ClinicId = clinicId,
                    Code = code,
                    data.Name,
                    data.Percent,
                    data.UblCategoryCode,
                    data.ExemptionReasonCode,
                    data.ExemptionReasonText,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateVatRateAsync(
        Guid id, Guid clinicId, VatRateData data, bool isActive, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                TariffProcedures.UpdateVatRate,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    data.Name,
                    data.Percent,
                    data.UblCategoryCode,
                    data.ExemptionReasonCode,
                    data.ExemptionReasonText,
                    IsActive = isActive,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<ImportableInvestigationTypeDto>> GetImportableInvestigationTypesAsync(
        Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<ImportableInvestigationTypeDto>(
            new CommandDefinition(
                TariffProcedures.GetImportableInvestigationTypes,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<int> ImportInvestigationServicesAsync(
        InvestigationServicesImportData data, Guid createdBy, CancellationToken ct)
    {
        // Numele proprietăților JSON sunt citite explicit de SP (OPENJSON / JSON_VALUE)
        var items = JsonSerializer.Serialize(data.Items.Select(i => new
        {
            i.InvestigationTypeCode,
            i.Name,
            i.Price
        }));

        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                TariffProcedures.ImportInvestigations,
                new
                {
                    data.ClinicId,
                    Items = items,
                    data.VatRateId,
                    ValidFrom = data.ValidFrom?.ToDateTime(TimeOnly.MinValue),
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
