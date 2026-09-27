using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class FinancialSettingsRepository(DapperContext context) : IFinancialSettingsRepository
{
    public async Task<FiscalSettingsDto> GetFiscalSettingsAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                FinancialSettingsProcedures.GetFiscal,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var settings        = await multi.ReadSingleAsync<FiscalSettingsDto>();
        var vatMappings     = (await multi.ReadAsync<FiscalVatMappingDto>()).ToList();
        var paymentMappings = (await multi.ReadAsync<FiscalPaymentMappingDto>()).ToList();

        return settings with { VatMappings = vatMappings, PaymentMappings = paymentMappings };
    }

    public async Task UpdateFiscalSettingsAsync(FiscalSettingsUpdateData data, Guid updatedBy, CancellationToken ct)
    {
        var vatTable = new DataTable();
        vatTable.Columns.Add("VatRateId", typeof(Guid));
        vatTable.Columns.Add("TaxGroup", typeof(string));
        foreach (var m in data.VatMappings)
            vatTable.Rows.Add(m.VatRateId, m.TaxGroup ?? string.Empty);

        var paymentTable = new DataTable();
        paymentTable.Columns.Add("PaymentMethodId", typeof(Guid));
        paymentTable.Columns.Add("DevicePaymentCode", typeof(string));
        foreach (var m in data.PaymentMappings)
            paymentTable.Rows.Add(m.PaymentMethodId, m.DevicePaymentCode ?? string.Empty);

        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                FinancialSettingsProcedures.UpdateFiscal,
                new
                {
                    data.ClinicId,
                    data.IsEnabled,
                    data.BridgeUrl,
                    data.IsVatPayer,
                    VatMappings = vatTable.AsTableValuedParameter(FinancialSettingsProcedures.VatMappingTableType),
                    PaymentMappings = paymentTable.AsTableValuedParameter(FinancialSettingsProcedures.PaymentMappingTableType),
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<IReadOnlyList<InvoiceSeriesDto>> GetInvoiceSeriesAsync(Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        var rows = await connection.QueryAsync<InvoiceSeriesDto>(
            new CommandDefinition(
                FinancialSettingsProcedures.GetSeries,
                new { ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<Guid> CreateInvoiceSeriesAsync(
        Guid clinicId, string series, int startNumber, bool isDefault, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            new CommandDefinition(
                FinancialSettingsProcedures.CreateSeries,
                new { ClinicId = clinicId, Series = series, StartNumber = startNumber, IsDefault = isDefault, CreatedBy = createdBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task UpdateInvoiceSeriesAsync(
        Guid id, Guid clinicId, bool isDefault, bool isActive, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                FinancialSettingsProcedures.UpdateSeries,
                new { Id = id, ClinicId = clinicId, IsDefault = isDefault, IsActive = isActive, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
