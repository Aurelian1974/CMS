using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class InvoiceRepository(DapperContext context) : IInvoiceRepository
{
    public async Task<CreateInvoiceResult> CreateAsync(InvoiceCreateData data, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QuerySingleAsync<CreateInvoiceResult>(
            new CommandDefinition(
                InvoiceProcedures.Create,
                new
                {
                    data.ClinicId,
                    data.ConsultationId,
                    data.IdempotencyKey,
                    data.SeriesId,
                    data.CustomerIsLegalEntity,
                    data.CustomerName,
                    data.IncludeCnp,
                    data.CustomerFiscalCode,
                    data.CustomerTradeRegisterNumber,
                    data.CustomerAddress,
                    data.CustomerCity,
                    data.CustomerCounty,
                    Lines = BuildLinesTable(data.Lines),
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<CreateInvoiceResult> StornoAsync(
        Guid id, Guid clinicId, Guid idempotencyKey, string reason, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QuerySingleAsync<CreateInvoiceResult>(
            new CommandDefinition(
                InvoiceProcedures.Storno,
                new { Id = id, ClinicId = clinicId, IdempotencyKey = idempotencyKey, Reason = reason, CreatedBy = createdBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task<InvoiceDetailDto?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                InvoiceProcedures.GetById,
                new { Id = id, ClinicId = clinicId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var header = await multi.ReadFirstOrDefaultAsync<InvoiceDetailDto>();
        var lines  = (await multi.ReadAsync<InvoiceLineDto>()).ToList();

        return header is null ? null : header with { Lines = lines };
    }

    public async Task<InvoicePagedResult> GetPagedAsync(Guid clinicId, InvoiceFilterData filter, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                InvoiceProcedures.GetPaged,
                new
                {
                    ClinicId = clinicId,
                    filter.Search,
                    filter.StatusId,
                    DateFrom = filter.DateFrom?.ToDateTime(TimeOnly.MinValue),
                    DateTo = filter.DateTo?.ToDateTime(TimeOnly.MinValue),
                    filter.Page,
                    filter.PageSize,
                    filter.SortBy,
                    filter.SortDir
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var items      = (await multi.ReadAsync<InvoiceListDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();
        var stats      = await multi.ReadSingleAsync<InvoiceStatsDto>();

        return new InvoicePagedResult(
            new PagedResult<InvoiceListDto>(items, totalCount, filter.Page, filter.PageSize),
            stats);
    }

    // Ordinea coloanelor identică cu dbo.InvoiceLineInputTableType; tabel gol = liniile consultației
    private static SqlMapper.ICustomQueryParameter BuildLinesTable(IReadOnlyList<InvoiceLineInput> lines)
    {
        var table = new DataTable();
        table.Columns.Add("MedicalServiceId", typeof(Guid));
        table.Columns.Add("Code", typeof(string));
        table.Columns.Add("Name", typeof(string));
        table.Columns.Add("UnitPrice", typeof(decimal));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("VatRateId", typeof(Guid));
        table.Columns.Add("SortOrder", typeof(int));

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            table.Rows.Add(
                (object?)line.MedicalServiceId ?? DBNull.Value,
                (object?)line.Code ?? DBNull.Value,
                line.Name,
                line.UnitPrice,
                line.Quantity,
                line.VatRateId,
                i + 1);
        }

        return table.AsTableValuedParameter(InvoiceProcedures.LineTableType);
    }
}
