using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Features.Invoices.DTOs;
using ValyanClinic.Infrastructure.Services;
using Xunit;

namespace ValyanClinic.Tests.Services;

public sealed class InvoicePdfGeneratorTests
{
    private static readonly byte[] PdfSignature = "%PDF"u8.ToArray();

    private static InvoiceDetailDto Sample(bool isStorno) => new()
    {
        Id = Guid.NewGuid(),
        Series = "FCT",
        Number = isStorno ? 2 : 1,
        IssueDate = new DateOnly(2026, 9, 27),
        IsStorno = isStorno,
        OriginalSeries = isStorno ? "FCT" : null,
        OriginalNumber = isStorno ? 1 : null,
        OriginalIssueDate = isStorno ? new DateOnly(2026, 9, 27) : null,
        StatusCode = InvoiceStatusCodes.Issued,
        Currency = "RON",
        SupplierName = "Cabinet Test SRL",
        SupplierFiscalCode = "RO12345678",
        SupplierIsVatPayer = false,
        CustomerName = "Popescu Ion",
        Total = isStorno ? -150m : 150m,
        TotalNet = isStorno ? -150m : 150m,
        Lines =
        [
            new InvoiceLineDto { Name = "Consultație", Quantity = isStorno ? -1 : 1, UnitPrice = 100m, LineTotal = isStorno ? -100m : 100m,
                                 VatExemptionReasonText = "Scutit de TVA conform art. 292 din Codul fiscal" },
            new InvoiceLineDto { Name = "Spirometrie", Quantity = isStorno ? -1 : 1, UnitPrice = 50m, LineTotal = isStorno ? -50m : 50m },
        ],
    };

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Generate_ReturnsPdf(bool isStorno)
    {
        var bytes = new InvoicePdfGenerator().Generate(Sample(isStorno));

        Assert.True(bytes.Length > 1000);
        Assert.Equal(PdfSignature, bytes[..4]);
    }
}
