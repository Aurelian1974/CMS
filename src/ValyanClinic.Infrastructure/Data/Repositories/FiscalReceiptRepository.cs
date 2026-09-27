using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class FiscalReceiptRepository(DapperContext context) : IFiscalReceiptRepository
{
    public async Task<FiscalReceiptDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                FiscalReceiptProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header  = await multi.ReadFirstOrDefaultAsync<FiscalReceiptDetailDto>();
        var lines   = (await multi.ReadAsync<FiscalReceiptLineDto>()).ToList();
        var tenders = (await multi.ReadAsync<FiscalReceiptTenderDto>()).ToList();
        var events  = (await multi.ReadAsync<FiscalReceiptEventDto>()).ToList();

        return header is null ? null : header with { Lines = lines, Tenders = tenders, Events = events };
    }

    public async Task MarkPrintingAsync(Guid id, Guid clinicId, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                FiscalReceiptProcedures.MarkPrinting,
                new { Id = id, ClinicId = clinicId, UpdatedBy = updatedBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task SetResultAsync(FiscalReceiptResultData data, Guid updatedBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                FiscalReceiptProcedures.SetResult,
                new
                {
                    data.Id,
                    data.ClinicId,
                    data.StatusCode,
                    data.ReceiptNumber,
                    data.DeviceSerialNumber,
                    data.PrintedAt,
                    data.ErrorMessage,
                    data.DeviceResponse,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task ReconcileAsync(
        Guid id, Guid clinicId, bool wasPrinted, string? receiptNumber, string? note, Guid userId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                FiscalReceiptProcedures.Reconcile,
                new
                {
                    Id = id,
                    ClinicId = clinicId,
                    WasPrinted = wasPrinted,
                    ReceiptNumber = receiptNumber,
                    Note = note,
                    UserId = userId
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }
}
