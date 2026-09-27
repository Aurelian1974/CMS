using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Billing.DTOs;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class BillingRepository(DapperContext context) : IBillingRepository
{
    public async Task<BillingPagedResult> GetPagedAsync(Guid clinicId, BillingFilterData filter, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                BillingProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    filter.Search,
                    filter.PaymentStatus,
                    DateFrom = filter.DateFrom?.ToDateTime(TimeOnly.MinValue),
                    DateTo = filter.DateTo?.ToDateTime(TimeOnly.MinValue),
                    filter.Page,
                    filter.PageSize
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items      = (await multi.ReadAsync<BillingConsultationListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats      = await multi.ReadSingleAsync<BillingStatsDto>();

        return new BillingPagedResult(
            new PagedResult<BillingConsultationListDto>(items, totalCount, filter.Page, filter.PageSize),
            stats);
    }

    public async Task<ConsultationBillingDto?> GetSummaryAsync(Guid consultationId, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                BillingProcedures.GetSummary,
                new { ConsultationId = consultationId, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header   = await multi.ReadFirstOrDefaultAsync<ConsultationBillingDto>();
        var lines    = (await multi.ReadAsync<ConsultationServiceDto>()).ToList();
        var payments = (await multi.ReadAsync<PaymentDto>()).ToList();
        var tenders  = (await multi.ReadAsync<PaymentTenderDto>()).ToLookup(t => t.PaymentId);
        var receipts = (await multi.ReadAsync<FiscalReceiptListDto>()).ToList();
        var invoices = (await multi.ReadAsync<InvoiceSummaryDto>()).ToList();

        if (header is null) return null;

        return header with
        {
            Lines          = lines,
            Payments       = payments.Select(p => p with { Tenders = tenders[p.Id].ToList() }).ToList(),
            FiscalReceipts = receipts,
            Invoices       = invoices,
        };
    }
}
