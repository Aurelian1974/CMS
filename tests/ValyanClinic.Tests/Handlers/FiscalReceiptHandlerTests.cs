using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Billing.DTOs;
using ValyanClinic.Application.Features.Billing.Queries.GetConsultationBilling;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.ReconcileFiscalReceipt;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.StartFiscalReceiptPrint;
using ValyanClinic.Application.Features.FiscalReceipts.DTOs;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class FiscalReceiptHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000005-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000005-0000-0000-0000-000000000001");
    private static readonly Guid ReceiptId      = Guid.Parse("C7000005-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C7000005-0000-0000-0000-000000000002");

    private readonly IFiscalReceiptRepository _repo        = Substitute.For<IFiscalReceiptRepository>();
    private readonly IBillingRepository       _billing     = Substitute.For<IBillingRepository>();
    private readonly ICurrentUser             _currentUser = Substitute.For<ICurrentUser>();

    public FiscalReceiptHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    [Fact]
    public async Task Start_PendingReceipt_MarksPrintingAndReturnsPayload()
    {
        _repo.GetByIdAsync(ReceiptId, ClinicId, Arg.Any<CancellationToken>())
             .Returns(new FiscalReceiptDetailDto
             {
                 Id = ReceiptId,
                 StatusCode = FiscalReceiptStatusCodes.Printing,
                 Amount = 150m,
                 Lines =
                 [
                     new FiscalReceiptLineDto { Name = "Consultație", UnitPrice = 100m, Quantity = 1m, LineTotal = 100m, TaxGroup = "E" },
                     new FiscalReceiptLineDto { Name = "Spirometrie", UnitPrice = 50m,  Quantity = 1m, LineTotal = 50m,  TaxGroup = "E" },
                 ],
             });

        var result = await new StartFiscalReceiptPrintCommandHandler(_repo, _currentUser)
            .Handle(new StartFiscalReceiptPrintCommand(ReceiptId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(150m, result.Value!.Lines.Sum(l => l.LineTotal));
        await _repo.Received(1).MarkPrintingAsync(ReceiptId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Start_UnknownReceipt_ReturnsConflictAndNeverReprints()
    {
        _repo.MarkPrintingAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.FiscalReceiptInvalidTransition));

        var result = await new StartFiscalReceiptPrintCommandHandler(_repo, _currentUser)
            .Handle(new StartFiscalReceiptPrintCommand(ReceiptId), default);

        Assert.Equal(409, result.StatusCode);
        await _repo.DidNotReceive().GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ReportResult_InvalidTransition_ReturnsConflict()
    {
        _repo.SetResultAsync(Arg.Any<FiscalReceiptResultData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.FiscalReceiptInvalidTransition));

        var result = await new ReportFiscalReceiptResultCommandHandler(_repo, _currentUser)
            .Handle(new ReportFiscalReceiptResultCommand(
                ReceiptId, FiscalReceiptStatusCodes.Printed, "0001", null, null, null, null), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task ReportResult_Printed_PassesReceiptNumberToRepository()
    {
        var result = await new ReportFiscalReceiptResultCommandHandler(_repo, _currentUser)
            .Handle(new ReportFiscalReceiptResultCommand(
                ReceiptId, FiscalReceiptStatusCodes.Printed, " 0001 ", "DT123", null, null, "{}"), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).SetResultAsync(
            Arg.Is<FiscalReceiptResultData>(d => d.Id == ReceiptId && d.ClinicId == ClinicId && d.ReceiptNumber == "0001"),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Reconcile_NotPrinted_Succeeds()
    {
        var result = await new ReconcileFiscalReceiptCommandHandler(_repo, _currentUser)
            .Handle(new ReconcileFiscalReceiptCommand(ReceiptId, false, null, "Hârtia s-a terminat"), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).ReconcileAsync(
            ReceiptId, ClinicId, false, null, "Hârtia s-a terminat", UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task BillingSummary_BilledConsultationWithActiveInvoice_BlocksServicesAndNewInvoice()
    {
        _billing.GetSummaryAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>())
                .Returns(new ConsultationBillingDto
                {
                    ConsultationId = ConsultationId,
                    StatusCode = ConsultationStatusCodes.Billed,
                    Total = 150m,
                    Paid = 150m,
                    Balance = 0m,
                    Invoices = [new InvoiceSummaryDto { StatusCode = InvoiceStatusCodes.Issued, IsStorno = false }],
                });

        var result = await new GetConsultationBillingQueryHandler(_billing, _currentUser)
            .Handle(new GetConsultationBillingQuery(ConsultationId), default);

        Assert.False(result.Value!.CanEditServices);
        Assert.False(result.Value.CanInvoice);
        Assert.False(result.Value.CanCollect);
    }

    [Fact]
    public async Task BillingSummary_FinalizedUnpaid_AllowsServicesCollectionAndInvoice()
    {
        _billing.GetSummaryAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>())
                .Returns(new ConsultationBillingDto
                {
                    ConsultationId = ConsultationId,
                    StatusCode = ConsultationStatusCodes.Completed,
                    Total = 150m,
                    Paid = 0m,
                    Balance = 150m,
                });

        var result = await new GetConsultationBillingQueryHandler(_billing, _currentUser)
            .Handle(new GetConsultationBillingQuery(ConsultationId), default);

        Assert.True(result.Value!.CanEditServices);
        Assert.True(result.Value.CanCollect);
        Assert.True(result.Value.CanInvoice);
    }
}
