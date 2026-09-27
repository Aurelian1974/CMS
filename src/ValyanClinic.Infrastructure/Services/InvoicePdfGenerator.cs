using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Invoices.DTOs;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// PDF factură (QuestPDF): furnizor / client din snapshot-ul facturii, liniile detaliate,
/// defalcarea TVA pe cote și mențiunea de scutire (dacă e cazul). Factura storno are
/// trimiterea la factura originală.
/// </summary>
public sealed class InvoicePdfGenerator : IInvoicePdfGenerator
{
    private static readonly CultureInfo Ro = CultureInfo.GetCultureInfo("ro-RO");
    private const string DateFormat = "dd.MM.yyyy";

    static InvoicePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generate(InvoiceDetailDto invoice) =>
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(9).FontColor(Colors.Grey.Darken4));

                page.Header().Element(c => ComposeHeader(c, invoice));
                page.Content().PaddingTop(12).Element(c => ComposeContent(c, invoice));
                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Pagina ");
                    t.CurrentPageNumber();
                    t.Span(" / ");
                    t.TotalPages();
                });

                if (invoice.StatusCode == InvoiceStatusCodes.Reversed)
                    page.Foreground().AlignMiddle().AlignCenter()
                        .Text("STORNATĂ").FontSize(56).Bold().FontColor(Colors.Red.Lighten3);
            });
        }).GeneratePdf();

    private static void ComposeHeader(IContainer container, InvoiceDetailDto i)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(i.IsStorno ? "FACTURĂ STORNO" : "FACTURĂ").Bold().FontSize(16);
                    c.Item().Text(t =>
                    {
                        t.Span("Seria ");
                        t.Span(i.Series).Bold();
                        t.Span("  Nr. ");
                        t.Span(i.Number.ToString(Ro)).Bold();
                    });
                    c.Item().Text($"Data emiterii: {i.IssueDate.ToString(DateFormat, Ro)}");
                    c.Item().Text($"Moneda: {i.Currency}");
                    if (i.IsStorno && i.OriginalSeries is not null)
                        c.Item().Text(
                            $"Stornează factura {i.OriginalSeries} nr. {i.OriginalNumber} din " +
                            $"{i.OriginalIssueDate?.ToString(DateFormat, Ro)}").Italic();
                });
            });
            col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Medium);
        });
    }

    private static void ComposeContent(IContainer container, InvoiceDetailDto i)
    {
        container.Column(col =>
        {
            col.Spacing(10);

            col.Item().Row(row =>
            {
                row.RelativeItem().Element(Box).Column(c =>
                {
                    c.Item().Text("Furnizor").Bold().FontColor(Colors.Grey.Darken1);
                    c.Item().Text(i.SupplierName).Bold();
                    c.Item().Text($"CUI: {i.SupplierFiscalCode}");
                    if (!string.IsNullOrWhiteSpace(i.SupplierTradeRegisterNumber))
                        c.Item().Text($"Nr. Reg. Com.: {i.SupplierTradeRegisterNumber}");
                    c.Item().Text(JoinAddress(i.SupplierAddress, i.SupplierCity, i.SupplierCounty));
                    if (!string.IsNullOrWhiteSpace(i.SupplierBankAccount))
                        c.Item().Text($"IBAN: {i.SupplierBankAccount}");
                    if (!string.IsNullOrWhiteSpace(i.SupplierBankName))
                        c.Item().Text($"Banca: {i.SupplierBankName}");
                    if (!i.SupplierIsVatPayer)
                        c.Item().Text("Neplătitor de TVA").Italic();
                });

                row.ConstantItem(12);

                row.RelativeItem().Element(Box).Column(c =>
                {
                    c.Item().Text("Client").Bold().FontColor(Colors.Grey.Darken1);
                    c.Item().Text(i.CustomerName).Bold();
                    if (i.CustomerIsLegalEntity)
                    {
                        c.Item().Text($"CUI: {i.CustomerFiscalCode}");
                        if (!string.IsNullOrWhiteSpace(i.CustomerTradeRegisterNumber))
                            c.Item().Text($"Nr. Reg. Com.: {i.CustomerTradeRegisterNumber}");
                    }
                    else if (!string.IsNullOrWhiteSpace(i.CustomerCnp))
                    {
                        c.Item().Text($"CNP: {i.CustomerCnp}");
                    }
                    var address = JoinAddress(i.CustomerAddress, i.CustomerCity, i.CustomerCounty);
                    if (!string.IsNullOrWhiteSpace(address)) c.Item().Text(address);
                });
            });

            col.Item().Element(c => ComposeLines(c, i));
            col.Item().Element(c => ComposeTotals(c, i));

            var exemptions = i.Lines
                .Where(l => !string.IsNullOrWhiteSpace(l.VatExemptionReasonText))
                .Select(l => l.VatExemptionReasonText!)
                .Distinct()
                .ToList();
            foreach (var text in exemptions)
                col.Item().Text(text).Italic();

            if (!string.IsNullOrWhiteSpace(i.Notes))
                col.Item().Text(i.Notes);

            if (!string.IsNullOrWhiteSpace(i.CreatedByName))
                col.Item().PaddingTop(20).Text($"Întocmit de: {i.CreatedByName}");
        });
    }

    private static void ComposeLines(IContainer container, InvoiceDetailDto i)
    {
        var showVat = i.SupplierIsVatPayer || i.Lines.Any(l => l.VatPercent > 0);

        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(24);
                cols.RelativeColumn(5);
                cols.ConstantColumn(36);
                cols.ConstantColumn(46);
                cols.ConstantColumn(64);
                if (showVat) cols.ConstantColumn(44);
                cols.ConstantColumn(70);
            });

            table.Header(h =>
            {
                h.Cell().Element(HeaderCell).Text("Nr.");
                h.Cell().Element(HeaderCell).Text("Denumire serviciu");
                h.Cell().Element(HeaderCell).AlignCenter().Text("U.M.");
                h.Cell().Element(HeaderCell).AlignRight().Text("Cant.");
                h.Cell().Element(HeaderCell).AlignRight().Text("Preț unitar");
                if (showVat) h.Cell().Element(HeaderCell).AlignRight().Text("Cotă TVA");
                h.Cell().Element(HeaderCell).AlignRight().Text("Valoare");
            });

            var index = 1;
            foreach (var line in i.Lines)
            {
                table.Cell().Element(BodyCell).Text(index++.ToString(Ro));
                table.Cell().Element(BodyCell).Text(line.Name);
                table.Cell().Element(BodyCell).AlignCenter().Text("buc");
                table.Cell().Element(BodyCell).AlignRight().Text(line.Quantity.ToString("0.###", Ro));
                table.Cell().Element(BodyCell).AlignRight().Text(Money(line.UnitPrice));
                if (showVat) table.Cell().Element(BodyCell).AlignRight().Text($"{line.VatPercent.ToString("0.##", Ro)}%");
                table.Cell().Element(BodyCell).AlignRight().Text(Money(line.LineTotal));
            }
        });
    }

    private static void ComposeTotals(IContainer container, InvoiceDetailDto i)
    {
        container.AlignRight().Width(230).Column(c =>
        {
            if (i.TotalVat != 0)
            {
                c.Item().Row(r =>
                {
                    r.RelativeItem().Text("Total fără TVA:");
                    r.ConstantItem(90).AlignRight().Text($"{Money(i.TotalNet)} {i.Currency}");
                });
                c.Item().Row(r =>
                {
                    r.RelativeItem().Text("TVA:");
                    r.ConstantItem(90).AlignRight().Text($"{Money(i.TotalVat)} {i.Currency}");
                });
            }
            c.Item().PaddingTop(4).BorderTop(1).BorderColor(Colors.Grey.Medium).PaddingTop(4).Row(r =>
            {
                r.RelativeItem().Text("TOTAL DE PLATĂ:").Bold().FontSize(11);
                r.ConstantItem(110).AlignRight().Text($"{Money(i.Total)} {i.Currency}").Bold().FontSize(11);
            });
        });
    }

    private static IContainer Box(IContainer c) =>
        c.Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(8);

    private static IContainer HeaderCell(IContainer c) =>
        c.Background(Colors.Grey.Lighten3).BorderBottom(0.5f).BorderColor(Colors.Grey.Medium)
         .PaddingVertical(4).PaddingHorizontal(3).DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCell(IContainer c) =>
        c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3);

    private static string Money(decimal value) => value.ToString("N2", Ro);

    private static string JoinAddress(params string?[] parts) =>
        string.Join(", ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
}
