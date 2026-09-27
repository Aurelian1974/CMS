using FluentValidation.TestHelper;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateFiscalSettings;
using ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;
using ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;
using ValyanClinic.Application.Features.Payments.Commands.CreatePayment;
using ValyanClinic.Application.Features.Payments.DTOs;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class BillingValidatorTests
{
    private static readonly Guid Cash = Guid.Parse("F3000000-0000-0000-0000-000000000001");
    private static readonly Guid Card = Guid.Parse("F3000000-0000-0000-0000-000000000002");

    private readonly CreatePaymentCommandValidator _payment = new();
    private readonly CreateInvoiceCommandValidator _invoice = new();
    private readonly UpdateFiscalSettingsCommandValidator _settings = new();
    private readonly ReportFiscalReceiptResultCommandValidator _result = new();

    private static CreatePaymentCommand Payment(params PaymentTenderInput[] tenders)
        => new(Guid.NewGuid(), Guid.NewGuid(), tenders, null);

    [Fact]
    public void Payment_MixedCashAndCard_IsValid()
        => _payment.TestValidate(Payment(new PaymentTenderInput(Cash, 100m), new PaymentTenderInput(Card, 50m))).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Payment_NoTenders_HasError()
        => _payment.TestValidate(Payment()).ShouldHaveValidationErrorFor(x => x.Tenders);

    [Fact]
    public void Payment_DuplicateMethod_HasError()
        => _payment.TestValidate(Payment(new PaymentTenderInput(Cash, 100m), new PaymentTenderInput(Cash, 50m))).ShouldHaveValidationErrorFor(x => x.Tenders);

    [Fact]
    public void Payment_MissingIdempotencyKey_HasError()
        => _payment.TestValidate(Payment(new PaymentTenderInput(Cash, 150m)) with { IdempotencyKey = Guid.Empty })
            .ShouldHaveValidationErrorFor(x => x.IdempotencyKey);

    [Fact]
    public void Payment_AmountWithThreeDecimals_HasError()
        => Assert.False(_payment.TestValidate(Payment(new PaymentTenderInput(Cash, 150.005m))).IsValid);

    private static CreateInvoiceCommand LegalEntity(string? cui, string? address) => new(
        ConsultationId: Guid.NewGuid(), IdempotencyKey: Guid.NewGuid(), SeriesId: null,
        CustomerIsLegalEntity: true, CustomerName: "Firma SRL", IncludeCnp: false,
        CustomerFiscalCode: cui, CustomerTradeRegisterNumber: null, CustomerAddress: address,
        CustomerCity: null, CustomerCounty: null, Lines: null);

    [Fact]
    public void Invoice_LegalEntityWithCuiAndAddress_IsValid()
        => _invoice.TestValidate(LegalEntity("RO12345678", "Str. Exemplu 1")).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Invoice_LegalEntityWithoutCui_HasError()
        => _invoice.TestValidate(LegalEntity(null, "Str. Exemplu 1")).ShouldHaveValidationErrorFor(x => x.CustomerFiscalCode);

    [Fact]
    public void Invoice_LegalEntityWithInvalidCui_HasError()
        => _invoice.TestValidate(LegalEntity("ABC", "Str. Exemplu 1")).ShouldHaveValidationErrorFor(x => x.CustomerFiscalCode);

    [Fact]
    public void Invoice_LegalEntityWithoutAddress_HasError()
        => _invoice.TestValidate(LegalEntity("12345678", null)).ShouldHaveValidationErrorFor(x => x.CustomerAddress);

    [Theory]
    [InlineData("http://127.0.0.1:5199", true)]
    [InlineData("http://localhost:5199", true)]
    [InlineData("http://192.168.1.10:5199", false)]
    [InlineData("https://example.com", false)]
    [InlineData("not-a-url", false)]
    public void FiscalSettings_BridgeUrlMustBeLoopback(string url, bool isValid)
    {
        var result = _settings.TestValidate(new UpdateFiscalSettingsCommand(true, url, false, [], []));
        if (isValid) result.ShouldNotHaveValidationErrorFor(x => x.BridgeUrl);
        else result.ShouldHaveValidationErrorFor(x => x.BridgeUrl);
    }

    [Fact]
    public void FiscalResult_PrintedWithoutNumber_HasError()
        => _result.TestValidate(new ReportFiscalReceiptResultCommand(
                Guid.NewGuid(), FiscalReceiptStatusCodes.Printed, null, null, null, null, null))
            .ShouldHaveValidationErrorFor(x => x.ReceiptNumber);

    [Fact]
    public void FiscalResult_CannotReportPendingOrCancelled()
        => _result.TestValidate(new ReportFiscalReceiptResultCommand(
                Guid.NewGuid(), FiscalReceiptStatusCodes.Cancelled, null, null, null, null, null))
            .ShouldHaveValidationErrorFor(x => x.StatusCode);
}
