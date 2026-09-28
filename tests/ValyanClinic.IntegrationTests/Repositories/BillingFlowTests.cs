using System.Transactions;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Application.Features.Payments.DTOs;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Fluxul financiar end-to-end pe SP-urile reale: total, snapshot de preț, blocare după
/// facturare, idempotență, numerotare fără goluri, storno, mașina de stări a bonului.
/// Fiecare test rulează într-un TransactionScope care NU se finalizează — nimic nu rămâne
/// în bază (nici facturi, nici numere consumate din serie).
/// O eroare de business aruncată de un SP anulează tranzacția ambientală, deci verificarea
/// care se așteaptă la eroare este mereu ultimul pas al testului.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class BillingFlowTests(IntegrationTestFixture fixture) : IntegrationTestBase(fixture)
{
    private static readonly Guid ExemptVat  = Guid.Parse("F1000000-0000-0000-0000-000000000001");
    private static readonly Guid Cash       = Guid.Parse("F3000000-0000-0000-0000-000000000001");
    private static readonly Guid Card       = Guid.Parse("F3000000-0000-0000-0000-000000000002");
    private static readonly Guid Transfer   = Guid.Parse("F3000000-0000-0000-0000-000000000003");
    private static readonly Guid Consults   = Guid.Parse("F2000000-0000-0000-0000-000000000001");
    private static readonly Guid Paraclinic = Guid.Parse("F2000000-0000-0000-0000-000000000002");

    private ITariffRepository Tariffs              => Fixture.GetRepository<ITariffRepository>();
    private IConsultationServiceRepository Lines   => Fixture.GetRepository<IConsultationServiceRepository>();
    private IInvoiceRepository Invoices            => Fixture.GetRepository<IInvoiceRepository>();
    private IPaymentRepository Payments            => Fixture.GetRepository<IPaymentRepository>();
    private IFiscalReceiptRepository Receipts      => Fixture.GetRepository<IFiscalReceiptRepository>();
    private IBillingRepository Billing             => Fixture.GetRepository<IBillingRepository>();

    private Guid ClinicId => Fixture.TestClinicId;
    private Guid UserId   => Fixture.TestUserId;
    private static CancellationToken Ct => CancellationToken.None;

    private static TransactionScope NewScope() => new(
        TransactionScopeOption.Required,
        new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted, Timeout = TimeSpan.FromMinutes(1) },
        TransactionScopeAsyncFlowOption.Enabled);

    private sealed record Setup(Guid ConsultationId, Guid ConsultationServiceId, Guid SpirometryServiceId);

    /// <summary>Consultație finalizată + „Consultație 100” + „Spirometrie 50” pe ea.</summary>
    private async Task<Setup> ArrangeFinalizedConsultationAsync()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        var consultationService = await Tariffs.CreateAsync(
            new MedicalServiceCreateData(ClinicId, $"IT-C-{suffix}", TestPrefix + "Consultație", Consults,
                30, null, 100m, ExemptVat, null), UserId, Ct);
        var spirometryService = await Tariffs.CreateAsync(
            new MedicalServiceCreateData(ClinicId, $"IT-S-{suffix}", TestPrefix + "Spirometrie", Paraclinic,
                20, null, 50m, ExemptVat, null), UserId, Ct);

        var patientId = await Fixture.GetRepository<IPatientRepository>().CreateAsync(
            clinicId: ClinicId, firstName: TestPrefix + "Ion", lastName: TestPrefix + "Facturare", cnp: NewTestCnp(),
            birthDate: new DateTime(1980, 1, 1), genderId: null, bloodTypeId: null, phoneNumber: null,
            secondaryPhone: null, email: null, address: "Str. Test 1", city: "București", county: "București",
            postalCode: null, insuranceNumber: null, insuranceExpiry: null, isInsured: false,
            chronicDiseases: null, familyDoctorName: null, notes: null, createdBy: UserId, ct: Ct);

        var doctor = (await Fixture.GetRepository<IDoctorRepository>().GetByClinicAsync(ClinicId, Ct)).First();

        var consultations = Fixture.GetRepository<IConsultationRepository>();
        var consultationId = await consultations.CreateAsync(
            new ConsultationCreateData(
                ClinicId, patientId, doctor.Id, null, DateTime.Today,
                null, null, DiagnosisJson, null, null, null, null,
                false, false, false, null, false, null, false, false, null, null),
            UserId, Ct);
        await consultations.FinalizeAsync(consultationId, ClinicId, UserId, Ct);

        await Lines.AddAsync(ClinicId, consultationId, consultationService, 1m, UserId, Ct);
        await Lines.AddAsync(ClinicId, consultationId, spirometryService, 1m, UserId, Ct);

        await Fixture.GetRepository<IFinancialSettingsRepository>().UpdateFiscalSettingsAsync(
            new FiscalSettingsUpdateData(ClinicId, true, "http://127.0.0.1:5199", false,
                [new FiscalVatMappingInput(ExemptVat, "E")],
                [new FiscalPaymentMappingInput(Cash, "P"), new FiscalPaymentMappingInput(Card, "N")]),
            UserId, Ct);

        return new Setup(consultationId, consultationService, spirometryService);
    }

    private static InvoiceCreateData PersonInvoice(Guid clinicId, Guid consultationId, Guid key) => new(
        clinicId, consultationId, key, null, false, TestPrefix + "Ion Facturare", false,
        null, null, null, null, null, []);

    private static async Task<SqlException> ExpectSqlError(Func<Task> action)
        => await Assert.ThrowsAsync<SqlException>(action);

    [Fact]
    public async Task Total_ConsultationPlusSpirometry_Is150_AndLineKeepsPriceAfterTariffChange()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();

        // Tariful consultației se corectează la 120 după ce linia a fost adăugată la 100
        await Tariffs.AddPriceAsync(ClinicId, s.ConsultationServiceId, 120m, ExemptVat,
            DateOnly.FromDateTime(DateTime.Today), UserId, Ct);

        var lines = await Lines.GetByConsultationAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(150m, lines.Sum(l => l.LineTotal));
        Assert.Equal(100m, lines.Single(l => l.MedicalServiceId == s.ConsultationServiceId).UnitPrice);

        // O linie nouă preia prețul în vigoare acum
        await Lines.AddAsync(ClinicId, s.ConsultationId, s.ConsultationServiceId, 1m, UserId, Ct);
        lines = await Lines.GetByConsultationAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(270m, lines.Sum(l => l.LineTotal));

        var summary = await Billing.GetSummaryAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(270m, summary!.Total);
        Assert.Equal(PaymentStatusCodes.Unpaid, summary.PaymentStatus);
    }

    [Fact]
    public async Task Invoice_ContainsDetailedLines_IsIdempotent_AndLocksServices()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();
        var key = Guid.NewGuid();

        var first  = await Invoices.CreateAsync(PersonInvoice(ClinicId, s.ConsultationId, key), UserId, Ct);
        var second = await Invoices.CreateAsync(PersonInvoice(ClinicId, s.ConsultationId, key), UserId, Ct);

        Assert.False(first.IsDuplicate);
        Assert.True(second.IsDuplicate);
        Assert.Equal(first.InvoiceId, second.InvoiceId);

        var invoice = await Invoices.GetByIdAsync(first.InvoiceId, ClinicId, Ct);
        Assert.Equal(150m, invoice!.Total);
        Assert.Equal(2, invoice.Lines.Count);
        Assert.Contains(invoice.Lines, l => l.LineTotal == 100m);
        Assert.Contains(invoice.Lines, l => l.LineTotal == 50m);

        var summary = await Billing.GetSummaryAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(ConsultationStatusCodes.Billed, summary!.StatusCode);

        var ex = await ExpectSqlError(() =>
            Lines.AddAsync(ClinicId, s.ConsultationId, s.SpirometryServiceId, 1m, UserId, Ct));
        Assert.Equal(SqlErrorCodes.BillingConsultationLocked, ex.Number);
    }

    [Fact]
    public async Task Invoice_SecondInvoiceWithNewKey_IsRejected()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();

        await Invoices.CreateAsync(PersonInvoice(ClinicId, s.ConsultationId, Guid.NewGuid()), UserId, Ct);

        var ex = await ExpectSqlError(() =>
            Invoices.CreateAsync(PersonInvoice(ClinicId, s.ConsultationId, Guid.NewGuid()), UserId, Ct));
        Assert.Equal(SqlErrorCodes.InvoiceAlreadyExists, ex.Number);
    }

    [Fact]
    public async Task Storno_UsesNextNumber_NegatesLines_AndAllowsCorrectionInvoice()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();

        var original = await Invoices.CreateAsync(PersonInvoice(ClinicId, s.ConsultationId, Guid.NewGuid()), UserId, Ct);
        var storno   = await Invoices.StornoAsync(original.InvoiceId, ClinicId, Guid.NewGuid(), "Date greșite", UserId, Ct);

        var correctionLines = new List<InvoiceLineInput>
        {
            new(s.ConsultationServiceId, null, "Consultație", 90m, 1m, ExemptVat),
            new(s.SpirometryServiceId, null, "Spirometrie", 50m, 1m, ExemptVat),
        };
        var correction = await Invoices.CreateAsync(
            PersonInvoice(ClinicId, s.ConsultationId, Guid.NewGuid()) with { Lines = correctionLines }, UserId, Ct);

        var o = await Invoices.GetByIdAsync(original.InvoiceId, ClinicId, Ct);
        var st = await Invoices.GetByIdAsync(storno.InvoiceId, ClinicId, Ct);
        var c = await Invoices.GetByIdAsync(correction.InvoiceId, ClinicId, Ct);

        // Numerotare secvențială, fără goluri, în aceeași serie
        Assert.Equal(o!.Series, st!.Series);
        Assert.Equal(o.Number + 1, st.Number);
        Assert.Equal(st.Number + 1, c!.Number);

        Assert.Equal(InvoiceStatusCodes.Reversed, o.StatusCode);
        Assert.True(st.IsStorno);
        Assert.Equal(original.InvoiceId, st.OriginalInvoiceId);
        Assert.Equal(-150m, st.Total);
        Assert.All(st.Lines, l => Assert.True(l.Quantity < 0));
        Assert.Equal(140m, c.Total);

        var ex = await ExpectSqlError(() =>
            Invoices.StornoAsync(original.InvoiceId, ClinicId, Guid.NewGuid(), "Din nou", UserId, Ct));
        Assert.Equal(SqlErrorCodes.InvoiceCannotStorno, ex.Number);
    }

    [Fact]
    public async Task Payment_CashAndCard_CreatesOneReceiptOf150_IdempotentPerKey()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();
        var key = Guid.NewGuid();
        IReadOnlyList<PaymentTenderInput> tenders = [new(Cash, 100m), new(Card, 50m)];

        var first  = await Payments.CreateAsync(ClinicId, s.ConsultationId, key, tenders, null, UserId, Ct);
        var second = await Payments.CreateAsync(ClinicId, s.ConsultationId, key, tenders, null, UserId, Ct);

        Assert.NotNull(first.FiscalReceiptId);
        Assert.Equal(first.PaymentId, second.PaymentId);
        Assert.Equal(first.FiscalReceiptId, second.FiscalReceiptId);
        Assert.True(second.IsDuplicate);

        var receipt = await Receipts.GetByIdAsync(first.FiscalReceiptId!.Value, ClinicId, Ct);
        Assert.Equal(FiscalReceiptStatusCodes.Pending, receipt!.StatusCode);
        Assert.Equal(150m, receipt.Amount);
        Assert.Equal(150m, receipt.Lines.Sum(l => l.LineTotal));
        Assert.All(receipt.Lines, l => Assert.Equal("E", l.TaxGroup));
        Assert.Equal(2, receipt.Tenders.Count);

        var summary = await Billing.GetSummaryAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(PaymentStatusCodes.Paid, summary!.PaymentStatus);
        Assert.Equal(ConsultationStatusCodes.Billed, summary.StatusCode);

        var ex = await ExpectSqlError(() =>
            Payments.CreateAsync(ClinicId, s.ConsultationId, Guid.NewGuid(), tenders, null, UserId, Ct));
        Assert.Equal(SqlErrorCodes.PaymentAlreadyPaid, ex.Number);
    }

    [Fact]
    public async Task Receipt_UnknownOutcome_IsNeverReprintedWithoutReconciliation()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();
        var payment = await Payments.CreateAsync(
            ClinicId, s.ConsultationId, Guid.NewGuid(), [new PaymentTenderInput(Cash, 150m)], null, UserId, Ct);
        var receiptId = payment.FiscalReceiptId!.Value;

        await Receipts.MarkPrintingAsync(receiptId, ClinicId, UserId, Ct);
        await Receipts.SetResultAsync(new FiscalReceiptResultData(receiptId, ClinicId, FiscalReceiptStatusCodes.Unknown,
            null, null, null, "Răspuns pierdut", null), UserId, Ct);

        var ex = await ExpectSqlError(() => Receipts.MarkPrintingAsync(receiptId, ClinicId, UserId, Ct));
        Assert.Equal(SqlErrorCodes.FiscalReceiptInvalidTransition, ex.Number);
    }

    [Fact]
    public async Task Receipt_ReconciledAsNotPrinted_CanBeRetriedManually_ThenPrinted()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();
        var payment = await Payments.CreateAsync(
            ClinicId, s.ConsultationId, Guid.NewGuid(), [new PaymentTenderInput(Card, 150m)], null, UserId, Ct);
        var receiptId = payment.FiscalReceiptId!.Value;

        await Receipts.MarkPrintingAsync(receiptId, ClinicId, UserId, Ct);
        await Receipts.SetResultAsync(new FiscalReceiptResultData(receiptId, ClinicId, FiscalReceiptStatusCodes.Unknown,
            null, null, null, "Timeout", null), UserId, Ct);
        await Receipts.ReconcileAsync(receiptId, ClinicId, false, null, "Nu a ieșit bonul", UserId, Ct);
        await Receipts.MarkPrintingAsync(receiptId, ClinicId, UserId, Ct);
        await Receipts.SetResultAsync(new FiscalReceiptResultData(receiptId, ClinicId, FiscalReceiptStatusCodes.Printed,
            "0000042", "DT000001", DateTime.Now, null, null), UserId, Ct);

        var receipt = await Receipts.GetByIdAsync(receiptId, ClinicId, Ct);
        Assert.Equal(FiscalReceiptStatusCodes.Printed, receipt!.StatusCode);
        Assert.Equal("0000042", receipt.ReceiptNumber);
        Assert.Equal(2, receipt.AttemptCount);
        Assert.True(receipt.IsManuallyReconciled);
    }

    [Fact]
    public async Task Payment_PartialCash_IsRejected_BecauseReceiptCoversFullValue()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();

        var ex = await ExpectSqlError(() => Payments.CreateAsync(
            ClinicId, s.ConsultationId, Guid.NewGuid(), [new PaymentTenderInput(Cash, 100m)], null, UserId, Ct));
        Assert.Equal(SqlErrorCodes.PaymentFiscalFullAmount, ex.Number);
    }

    [Fact]
    public async Task Payment_PartialTransfer_SetsPartialStatus_WithoutReceipt()
    {
        using var scope = NewScope();
        var s = await ArrangeFinalizedConsultationAsync();

        var payment = await Payments.CreateAsync(
            ClinicId, s.ConsultationId, Guid.NewGuid(), [new PaymentTenderInput(Transfer, 100m)], null, UserId, Ct);

        Assert.Null(payment.FiscalReceiptId);
        var summary = await Billing.GetSummaryAsync(s.ConsultationId, ClinicId, Ct);
        Assert.Equal(PaymentStatusCodes.Partial, summary!.PaymentStatus);
        Assert.Equal(50m, summary.Balance);
    }
}
