using System.Data;
using Dapper;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.Infrastructure.Data.StoredProcedures;

namespace ValyanClinic.Infrastructure.Data.Repositories;

public sealed class PaymentRepository(DapperContext context) : IPaymentRepository
{
    public async Task<CreatePaymentResult> CreateAsync(
        Guid clinicId, Guid consultationId, Guid idempotencyKey, IReadOnlyList<PaymentTenderInput> tenders,
        string? notes, Guid createdBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        return await connection.QuerySingleAsync<CreatePaymentResult>(
            new CommandDefinition(
                PaymentProcedures.Create,
                new
                {
                    ClinicId = clinicId,
                    ConsultationId = consultationId,
                    IdempotencyKey = idempotencyKey,
                    Tenders = BuildTendersTable(tenders),
                    Notes = notes,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    public async Task CancelAsync(Guid id, Guid clinicId, string reason, Guid cancelledBy, CancellationToken ct)
    {
        using var connection = context.CreateConnection();
        await connection.ExecuteAsync(
            new CommandDefinition(
                PaymentProcedures.Cancel,
                new { Id = id, ClinicId = clinicId, Reason = reason, CancelledBy = cancelledBy },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));
    }

    // Ordinea coloanelor identică cu dbo.PaymentTenderTableType
    private static SqlMapper.ICustomQueryParameter BuildTendersTable(IReadOnlyList<PaymentTenderInput> tenders)
    {
        var table = new DataTable();
        table.Columns.Add("PaymentMethodId", typeof(Guid));
        table.Columns.Add("Amount", typeof(decimal));

        foreach (var tender in tenders)
            table.Rows.Add(tender.PaymentMethodId, tender.Amount);

        return table.AsTableValuedParameter(PaymentProcedures.TenderTableType);
    }
}
