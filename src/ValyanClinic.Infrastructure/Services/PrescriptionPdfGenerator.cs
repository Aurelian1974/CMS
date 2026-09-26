using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// PDF rețetă (QuestPDF). Două machete:
///   * compensată — structura formularului de prescripție CNAS (unitate, asigurat, tip afecțiune,
///     medicamente cu listă / procent / cod diagnostic, valabilitate, parafă);
///   * simplă — rețeta „albă": antet, pacient, diagnostic, Rp./ cu D.S., regim eliberare.
/// </summary>
public sealed class PrescriptionPdfGenerator : IPrescriptionPdfGenerator
{
    private static readonly CultureInfo Ro = CultureInfo.GetCultureInfo("ro-RO");
    private const string DateFormat = "dd.MM.yyyy";
    private const string Empty = "—";

    static PrescriptionPdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generate(PrescriptionDetailDto p) =>
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(9).FontColor(Colors.Grey.Darken4));

                page.Header().Element(c => ComposeHeader(c, p));
                page.Content().PaddingTop(10).Element(c =>
                {
                    if (p.IsCnas) ComposeCompensated(c, p);
                    else ComposeSimple(c, p);
                });
                page.Footer().Element(c => ComposeFooter(c, p));

                var watermark = WatermarkText(p);
                if (watermark is not null)
                    page.Foreground().AlignMiddle().AlignCenter()
                        .Text(watermark).FontSize(56).Bold().FontColor(Colors.Red.Lighten3);
            });
        }).GeneratePdf();

    private static string? WatermarkText(PrescriptionDetailDto p) => p.StatusCode switch
    {
        PrescriptionStatusCodes.Draft     => "CIORNĂ",
        PrescriptionStatusCodes.Cancelled => "ANULATĂ",
        _ => null,
    };

    // ── Antet comun ──────────────────────────────────────────────────────────
    private static void ComposeHeader(IContainer container, PrescriptionDetailDto p)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(p.ClinicName).Bold().FontSize(11);
                    if (!string.IsNullOrWhiteSpace(p.ClinicAddress)) c.Item().Text(p.ClinicAddress);
                    c.Item().Text(t =>
                    {
                        if (!string.IsNullOrWhiteSpace(p.ClinicFiscalCode)) t.Span($"CUI: {p.ClinicFiscalCode}   ");
                        if (!string.IsNullOrWhiteSpace(p.ClinicPhone)) t.Span($"Tel.: {p.ClinicPhone}");
                    });
                    if (p.IsCnas)
                        c.Item().Text($"Contract CAS nr.: {Value(p.ClinicCnasContract)}");
                });

                row.ConstantItem(190).AlignRight().Column(c =>
                {
                    c.Item().AlignRight().Text(p.IsCnas ? "PRESCRIPȚIE MEDICALĂ" : "REȚETĂ MEDICALĂ").Bold().FontSize(13);
                    c.Item().AlignRight().Text(p.IsCnas ? "compensată — CNAS" : "simplă (necompensată)").Italic();
                    c.Item().AlignRight().Text(t =>
                    {
                        t.Span("Seria ").FontSize(10);
                        t.Span(Value(p.Series)).Bold().FontSize(10);
                        t.Span("  Nr. ").FontSize(10);
                        t.Span(p.Number?.ToString(Ro) ?? Empty).Bold().FontSize(10);
                    });
                    if (p.IsCnas && !string.IsNullOrWhiteSpace(p.ElectronicId))
                        c.Item().AlignRight().Text($"ID SIPE: {p.ElectronicId}{(p.IsOffline ? " (offline)" : string.Empty)}");
                });
            });
            col.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Grey.Medium);
        });
    }

    // ── Rețeta compensată ────────────────────────────────────────────────────
    private static void ComposeCompensated(IContainer container, PrescriptionDetailDto p)
    {
        container.Column(col =>
        {
            col.Spacing(8);

            col.Item().Element(Box).Column(c =>
            {
                c.Item().Text("1. Asigurat").Bold();
                c.Item().Text(t => { t.Span("Nume și prenume: "); t.Span(p.PatientName).Bold(); });
                c.Item().Row(r =>
                {
                    r.RelativeItem().Text($"CNP: {Value(p.PatientCnp)}");
                    r.RelativeItem().Text($"Data nașterii: {FormatDate(p.PatientBirthDate)}");
                    r.RelativeItem().Text($"Sex: {Value(p.PatientGender)}");
                });
                c.Item().Text($"Categoria de asigurat: {Value(p.InsuredCategoryName)}");
                if (!string.IsNullOrWhiteSpace(p.NhpCode))
                    c.Item().Text($"Program național de sănătate: {p.NhpCode}{(string.IsNullOrWhiteSpace(p.NhpName) ? string.Empty : $" — {p.NhpName}")}");
            });

            col.Item().Element(Box).Row(r =>
            {
                r.RelativeItem().Column(c =>
                {
                    c.Item().Text("2. Tip afecțiune").Bold();
                    c.Item().Text(Value(p.CareTypeName));
                });
                r.RelativeItem().Column(c =>
                {
                    c.Item().Text("Tratament").Bold();
                    c.Item().Text(p.IsContinuation
                        ? $"Continuare{(string.IsNullOrWhiteSpace(p.ReferralLetterNumber) ? string.Empty : $" (scrisoare medicală nr. {p.ReferralLetterNumber})")}"
                        : "Inițiere");
                });
                r.RelativeItem().Column(c =>
                {
                    c.Item().Text("Nr. zile tratament").Bold();
                    c.Item().Text(p.TreatmentDays?.ToString(Ro) ?? Empty);
                });
            });

            col.Item().Element(Box).Column(c =>
            {
                c.Item().Text("3. Diagnostic").Bold();
                c.Item().Text(Value(p.Diagnostic));
                if (!string.IsNullOrWhiteSpace(p.DiagnosticCodes))
                    c.Item().Text($"Cod(uri) diagnostic: {p.DiagnosticCodes}");
            });

            col.Item().Text("4. Medicamente prescrise").Bold();
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(18);
                    cols.RelativeColumn(4);
                    cols.ConstantColumn(48);
                    cols.ConstantColumn(34);
                    cols.ConstantColumn(34);
                    cols.ConstantColumn(44);
                    cols.RelativeColumn(3);
                });

                table.Header(h =>
                {
                    foreach (var label in new[] { "#", "DCI / denumire, formă, concentrație", "Cod diag.", "Listă", "%", "Cant.", "D.S. (mod de administrare)" })
                        h.Cell().Element(HeaderCell).Text(label).Bold();
                });

                var index = 1;
                foreach (var item in p.Items)
                {
                    table.Cell().Element(Cell).Text((index++).ToString(Ro));
                    table.Cell().Element(Cell).Column(c =>
                    {
                        c.Item().Text(item.ActiveSubstance ?? item.DrugName).Bold();
                        if (item.ActiveSubstance is not null) c.Item().Text(item.DrugName).FontSize(8);
                        c.Item().Text(DrugForm(item)).FontSize(8).FontColor(Colors.Grey.Darken1);
                    });
                    table.Cell().Element(Cell).Text(Value(item.DiagnosisCode));
                    table.Cell().Element(Cell).Text(Value(item.CopaymentListType));
                    table.Cell().Element(Cell).Text(item.CopaymentPercent is null ? Empty : $"{item.CopaymentPercent.Value.ToString("0.##", Ro)}%");
                    table.Cell().Element(Cell).Text(FormatQuantity(item.Quantity));
                    table.Cell().Element(Cell).Text(Posology(item));
                }
            });
        });
    }

    // ── Rețeta simplă ────────────────────────────────────────────────────────
    private static void ComposeSimple(IContainer container, PrescriptionDetailDto p)
    {
        container.Column(col =>
        {
            col.Spacing(8);

            col.Item().Element(Box).Column(c =>
            {
                c.Item().Text(t => { t.Span("Pacient: "); t.Span(p.PatientName).Bold(); });
                c.Item().Row(r =>
                {
                    r.RelativeItem().Text($"Vârstă: {Age(p.PatientBirthDate)}");
                    r.RelativeItem().Text($"Sex: {Value(p.PatientGender)}");
                    r.RelativeItem().Text($"CNP: {Value(p.PatientCnp)}");
                });
                if (!string.IsNullOrWhiteSpace(p.PatientAddress)) c.Item().Text($"Domiciliu: {p.PatientAddress}");
                c.Item().Text($"Nr. registru consultații: {Value(p.RegistryNumber)}");
            });

            col.Item().Element(Box).Column(c =>
            {
                c.Item().Text("Diagnostic").Bold();
                c.Item().Text(Value(p.Diagnostic));
                if (!string.IsNullOrWhiteSpace(p.DiagnosticCodes))
                    c.Item().Text($"Cod(uri): {p.DiagnosticCodes}").FontSize(8);
            });

            col.Item().PaddingTop(4).Text("Rp./").Bold().Italic().FontSize(14);

            var index = 1;
            foreach (var item in p.Items)
            {
                col.Item().PaddingLeft(14).Column(c =>
                {
                    c.Item().Text(t =>
                    {
                        t.Span($"{index++}. ").Bold();
                        t.Span(item.DrugName).Bold();
                        var form = DrugForm(item);
                        if (form != Empty) t.Span($" — {form}");
                    });
                    c.Item().PaddingLeft(14).Text($"D.t.d. nr. {FormatQuantity(item.Quantity)}");
                    c.Item().PaddingLeft(14).Text($"D.S. {Posology(item)}").Italic();
                    if (!string.IsNullOrWhiteSpace(item.PrescriptionMode))
                        c.Item().PaddingLeft(14).Text($"Regim eliberare: {item.PrescriptionMode}").FontSize(8).FontColor(Colors.Grey.Darken1);
                });
            }

            if (!string.IsNullOrWhiteSpace(p.Notes))
                col.Item().PaddingTop(6).Text($"Observații: {p.Notes}");
        });
    }

    // ── Subsol comun: dată, valabilitate, medic ──────────────────────────────
    private static void ComposeFooter(IContainer container, PrescriptionDetailDto p)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(1).LineColor(Colors.Grey.Medium);
            col.Item().PaddingTop(6).Row(r =>
            {
                r.RelativeItem().Column(c =>
                {
                    c.Item().Text($"Data prescrierii: {FormatDate(p.IssueDate)}");
                    c.Item().Text($"Valabilă până la: {FormatDate(p.ValidUntil)}");
                    if (p.StatusCode == PrescriptionStatusCodes.Cancelled)
                        c.Item().Text($"ANULATĂ la {FormatDate(p.CancelledAt)}: {Value(p.CancelReason)}").FontColor(Colors.Red.Medium);
                });
                r.RelativeItem().AlignRight().Column(c =>
                {
                    c.Item().AlignRight().Text($"Medic: Dr. {p.DoctorName}").Bold();
                    if (!string.IsNullOrWhiteSpace(p.DoctorSpecialty)) c.Item().AlignRight().Text(p.DoctorSpecialty);
                    c.Item().AlignRight().Text($"Cod parafă: {Value(p.DoctorMedicalCode)}");
                    c.Item().PaddingTop(18).AlignRight().Text("Semnătura și parafa medicului").FontSize(8).FontColor(Colors.Grey.Darken1);
                });
            });
            col.Item().PaddingTop(4).AlignCenter().Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(7).FontColor(Colors.Grey.Darken1));
                t.Span("Pagina ");
                t.CurrentPageNumber();
                t.Span(" / ");
                t.TotalPages();
            });
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static IContainer Box(IContainer c) =>
        c.Border(0.75f).BorderColor(Colors.Grey.Lighten1).Padding(6);

    private static IContainer HeaderCell(IContainer c) =>
        c.Background(Colors.Grey.Lighten3).Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(3);

    private static IContainer Cell(IContainer c) =>
        c.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(3);

    private static string Value(string? v) => string.IsNullOrWhiteSpace(v) ? Empty : v;

    private static string FormatDate(DateTime? d) => d?.ToString(DateFormat, Ro) ?? Empty;

    private static string FormatDate(DateOnly? d) => d?.ToString(DateFormat, Ro) ?? Empty;

    private static string FormatQuantity(decimal? q) => q?.ToString("0.##", Ro) ?? Empty;

    private static string Age(DateOnly? birthDate)
    {
        if (birthDate is null) return Empty;
        var today = DateOnly.FromDateTime(DateTime.Today);
        var age = today.Year - birthDate.Value.Year;
        if (birthDate.Value > today.AddYears(-age)) age--;
        return $"{age} ani";
    }

    private static string DrugForm(PrescriptionItemDto item)
    {
        var parts = new[] { item.PharmaceuticalForm, item.Concentration }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var text = string.Join(", ", parts);
        return text.Length == 0 ? Empty : text;
    }

    /// <summary>Modul de administrare: doze pe momentele zilei + durată + indicații.</summary>
    private static string Posology(PrescriptionItemDto item)
    {
        var doses = new List<string>();
        if (item.DoseMorning is not null)   doses.Add($"dimineața {item.DoseMorning.Value.ToString("0.##", Ro)}");
        if (item.DoseAfternoon is not null) doses.Add($"la prânz {item.DoseAfternoon.Value.ToString("0.##", Ro)}");
        if (item.DoseEvening is not null)   doses.Add($"seara {item.DoseEvening.Value.ToString("0.##", Ro)}");

        var parts = new List<string>();
        if (doses.Count > 0) parts.Add(string.Join(", ", doses));
        if (item.DurationDays is not null) parts.Add($"{item.DurationDays} zile");
        if (!string.IsNullOrWhiteSpace(item.Instructions)) parts.Add(item.Instructions);

        return parts.Count == 0 ? Empty : string.Join(" — ", parts);
    }
}
