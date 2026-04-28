using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Lab.DTOs;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Parser pentru buletine de analize medicale (PDF).
/// Folosește UglyToad.PdfPig pentru extragerea textului din PDF-uri digitale.
/// PDF-urile scanate (imagini) returnează IsScannedPdf=true și un avertisment;
/// OCR (Tesseract) poate fi adăugat ulterior fără modificări de contract.
/// </summary>
public sealed partial class LabPdfParser(ILogger<LabPdfParser> logger) : ILabPdfParser
{
    // Antete cunoscute de secțiuni (RO + EN)
    private static readonly string[] KnownSections =
    [
        "HEMATOLOGIE", "BIOCHIMIE", "IMUNOLOGIE", "HORMONI", "MARKERI TUMORALI",
        "URINA", "SUMAR DE URINA", "COAGULARE", "MICROBIOLOGIE", "SEROLOGIE",
        "ENDOCRINOLOGIE", "VITAMINE", "MINERALE", "ALERGIE", "PROFIL LIPIDIC",
        "ELECTROFOREZA", "GLUCOZA", "FUNCTIE HEPATICA", "FUNCTIE RENALA"
    ];

    // Identificatori laborator (string contains, case-insensitive)
    private static readonly (string Pattern, string Name)[] LabIdentifiers =
    [
        ("synevo",       "Synevo"),
        ("medlife",      "MedLife"),
        ("regina maria", "Regina Maria"),
        ("bioclinica",   "Bioclinica"),
        ("clinilabor",   "Clinilabor"),
        ("aurora",       "Centrul Medical Aurora"),
        ("hippocrates",  "Hippocrates"),
        ("euroclinic",   "EuroClinic"),
    ];

    // Cuvinte care marchează rezultate calitative
    private static readonly string[] QualitativeMarkers =
    [
        "NEGATIV", "POZITIV", "ABSENT", "PREZENT", "NORMAL", "ANORMAL",
        "Conform nota", "vezi nota", "n.a."
    ];

    public async Task<LabParseResultDto> ParseAsync(Stream pdfStream, string fileName, CancellationToken ct)
    {
        // Citim stream-ul în memorie (PdfPig are nevoie de byte[])
        using var ms = new MemoryStream();
        await pdfStream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        var rawText = ExtractText(bytes, out var totalChars, out var pageCount);

        // Heuristică PDF scanat: foarte puțin text per pagină
        var isScannedPdf = pageCount > 0 && (totalChars / Math.Max(pageCount, 1)) < 100;
        if (isScannedPdf)
        {
            logger.LogWarning(
                "PDF scanat detectat (file={File}, pages={Pages}, chars={Chars}). OCR nu este disponibil.",
                fileName, pageCount, totalChars);
            return new LabParseResultDto
            {
                IsScannedPdf = true,
                ParseWarning = "PDF-ul pare scanat (text insuficient). Introduceți manual rezultatele sau folosiți un PDF digital.",
                RawText = rawText
            };
        }

        var laboratory = DetectLaboratory(rawText);
        var bulletinNumber = ExtractBulletinNumber(rawText);
        var (collectionDate, resultDate) = ExtractDates(rawText);
        var patientName = ExtractPatientName(rawText);
        var doctor = ExtractDoctor(rawText);
        var results = ParseResults(rawText);

        return new LabParseResultDto
        {
            Laboratory = laboratory,
            BulletinNumber = bulletinNumber,
            CollectionDate = collectionDate,
            ResultDate = resultDate,
            PatientName = patientName,
            Doctor = doctor,
            Results = results,
            RawText = rawText,
            IsScannedPdf = false
        };
    }

    // ── Extragere text ─────────────────────────────────────────────────────
    private static string ExtractText(byte[] bytes, out int totalChars, out int pageCount)
    {
        var sb = new StringBuilder();
        totalChars = 0;
        pageCount = 0;

        using var document = PdfDocument.Open(bytes);
        foreach (Page page in document.GetPages())
        {
            pageCount++;
            var text = page.Text ?? string.Empty;
            totalChars += text.Length;
            sb.AppendLine(text);
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string? DetectLaboratory(string text)
    {
        var lower = text.ToLowerInvariant();
        foreach (var (pattern, name) in LabIdentifiers)
        {
            if (lower.Contains(pattern)) return name;
        }
        return null;
    }

    private static string? ExtractBulletinNumber(string text)
    {
        // Caută patterns: "Buletin nr. 12345", "Nr. buletin: 12345", "Bulletin: 12345"
        var m = BulletinRegex().Match(text);
        return m.Success ? m.Groups[1].Value.Trim() : null;
    }

    private static (DateTime? Collection, DateTime? Result) ExtractDates(string text)
    {
        DateTime? collection = null;
        DateTime? result = null;

        var collectionMatch = CollectionDateRegex().Match(text);
        if (collectionMatch.Success && TryParseDate(collectionMatch.Groups[1].Value, out var c)) collection = c;

        var resultMatch = ResultDateRegex().Match(text);
        if (resultMatch.Success && TryParseDate(resultMatch.Groups[1].Value, out var r)) result = r;

        // Fallback: prima dată găsită în text → CollectionDate
        if (collection is null)
        {
            var any = AnyDateRegex().Match(text);
            if (any.Success && TryParseDate(any.Groups[1].Value, out var d)) collection = d;
        }
        return (collection, result);
    }

    private static bool TryParseDate(string s, out DateTime dt)
    {
        var formats = new[] { "dd.MM.yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd" };
        return DateTime.TryParseExact(s.Trim(), formats, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out dt);
    }

    private static string? ExtractPatientName(string text)
    {
        var m = PatientNameRegex().Match(text);
        return m.Success ? m.Groups[1].Value.Trim() : null;
    }

    private static string? ExtractDoctor(string text)
    {
        var m = DoctorRegex().Match(text);
        return m.Success ? m.Groups[1].Value.Trim() : null;
    }

    // ── Parsare rezultate (linie cu linie) ─────────────────────────────────
    private static List<LabResultRowDto> ParseResults(string text)
    {
        var rows = new List<LabResultRowDto>();
        var lines = text.Split('\n', StringSplitOptions.None);
        var currentSection = "GENERAL";

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Detectează secțiune
            var upperLine = line.ToUpperInvariant();
            var matchedSection = KnownSections.FirstOrDefault(s =>
                upperLine.Contains(s, StringComparison.Ordinal) && line.Length < 80);
            if (matchedSection is not null)
            {
                currentSection = matchedSection;
                continue;
            }

            // Încearcă parsarea liniei ca rezultat
            var row = TryParseResultLine(line, currentSection);
            if (row is not null) rows.Add(row);
        }

        return rows;
    }

    private static LabResultRowDto? TryParseResultLine(string line, string section)
    {
        // Skip linii foarte scurte sau foarte lungi
        if (line.Length is < 6 or > 250) return null;

        // Detectează valori calitative (NEGATIV/POZITIV/etc)
        foreach (var marker in QualitativeMarkers)
        {
            var idx = line.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx > 3)
            {
                var name = line[..idx].Trim().TrimEnd('.', ':', '-');
                if (LooksLikeTestName(name))
                {
                    return new LabResultRowDto
                    {
                        Section = section,
                        TestName = name,
                        Value = marker.ToUpperInvariant(),
                        Unit = null,
                        ReferenceRange = null
                    };
                }
            }
        }

        // Pattern principal: "Test name<tab/spaces>numeric_value<spaces>unit<spaces>reference"
        var m = NumericResultRegex().Match(line);
        if (!m.Success) return null;

        var testName = m.Groups["name"].Value.Trim().TrimEnd('.', ':', '-', ' ');
        if (!LooksLikeTestName(testName)) return null;

        var rawValue = m.Groups["value"].Value.Replace(',', '.');
        var unit = m.Groups["unit"].Value.Trim();
        var refRange = m.Groups["reference"].Success ? m.Groups["reference"].Value.Trim() : null;

        var (refMin, refMax) = ParseReferenceRange(refRange);

        decimal? numericValue = null;
        if (decimal.TryParse(rawValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var n))
            numericValue = n;

        var flag = ComputeFlag(numericValue, refMin, refMax);

        return new LabResultRowDto
        {
            Section = section,
            TestName = testName,
            Value = rawValue,
            Unit = string.IsNullOrWhiteSpace(unit) ? null : unit,
            ReferenceRange = refRange,
            RefMin = refMin,
            RefMax = refMax,
            Flag = flag
        };
    }

    private static bool LooksLikeTestName(string name)
    {
        if (name.Length is < 2 or > 100) return false;
        // Trebuie să aibă cel puțin o literă
        if (!name.Any(char.IsLetter)) return false;
        // Nu e doar număr/data
        if (name.All(c => char.IsDigit(c) || c is '.' or '-' or '/' or ' ')) return false;
        return true;
    }

    private static (decimal? Min, decimal? Max) ParseReferenceRange(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return (null, null);

        var s = raw.Replace(',', '.').Replace('—', '-').Replace('–', '-');

        // Pattern "min - max"
        var range = RangeRefRegex().Match(s);
        if (range.Success)
        {
            decimal.TryParse(range.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var lo);
            decimal.TryParse(range.Groups[2].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var hi);
            return (lo, hi);
        }

        // Pattern "< X" → max only
        var lt = LessThanRegex().Match(s);
        if (lt.Success && decimal.TryParse(lt.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var ltVal))
            return (null, ltVal);

        // Pattern "> X" → min only
        var gt = GreaterThanRegex().Match(s);
        if (gt.Success && decimal.TryParse(gt.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var gtVal))
            return (gtVal, null);

        return (null, null);
    }

    private static string? ComputeFlag(decimal? value, decimal? refMin, decimal? refMax)
    {
        if (value is null) return null;
        if (refMin is not null && value < refMin) return "LOW";
        if (refMax is not null && value > refMax) return "HIGH";
        if (refMin is null && refMax is null) return null;
        return null;
    }

    // ── Regex (source-generated pentru perf) ───────────────────────────────
    [GeneratedRegex(@"(?:buletin\s*(?:nr\.?|number|no\.?)\s*[:#]?\s*)([A-Z0-9\-/]{3,20})", RegexOptions.IgnoreCase)]
    private static partial Regex BulletinRegex();

    [GeneratedRegex(@"(?:data\s*recolt[ăa]rii|recoltare|collected)\s*[:#]?\s*(\d{1,2}[\.\-/]\d{1,2}[\.\-/]\d{2,4})", RegexOptions.IgnoreCase)]
    private static partial Regex CollectionDateRegex();

    [GeneratedRegex(@"(?:data\s*rezultatului|rezultat|result\s*date)\s*[:#]?\s*(\d{1,2}[\.\-/]\d{1,2}[\.\-/]\d{2,4})", RegexOptions.IgnoreCase)]
    private static partial Regex ResultDateRegex();

    [GeneratedRegex(@"(\d{1,2}[\.\-/]\d{1,2}[\.\-/]\d{2,4})")]
    private static partial Regex AnyDateRegex();

    [GeneratedRegex(@"(?:nume\s*pacient|patient\s*name|pacient)\s*[:#]?\s*([A-ZĂÎÂȘȚ][A-ZĂÎÂȘȚa-zăîâșț\s\-\.]{3,80})", RegexOptions.IgnoreCase)]
    private static partial Regex PatientNameRegex();

    [GeneratedRegex(@"(?:medic|doctor|physician)\s*[:#]?\s*((?:dr\.?\s*)?[A-ZĂÎÂȘȚ][A-ZĂÎÂȘȚa-zăîâșț\s\-\.]{3,80})", RegexOptions.IgnoreCase)]
    private static partial Regex DoctorRegex();

    // Linie rezultat: nume + valoare numerică + (opțional unitate) + (opțional referință)
    // Exemplu: "Hemoglobina      14.5      g/dL      12.0 - 16.0"
    [GeneratedRegex(
        @"^(?<name>[A-ZĂÎÂȘȚa-zăîâșț][A-ZĂÎÂȘȚa-zăîâșț0-9\(\)\-\.,\s/]{1,80}?)\s{2,}(?<value>\d+[\.,]?\d*)\s{0,}(?<unit>[a-zA-Z%/μ\^0-9]{1,20})?\s{0,}(?<reference>[<>]?\s*\d[\d\.,\s\-–—<>]{0,30})?$"
    )]
    private static partial Regex NumericResultRegex();

    [GeneratedRegex(@"^\s*(\d+[\.\,]?\d*)\s*[-–—]\s*(\d+[\.\,]?\d*)\s*$")]
    private static partial Regex RangeRefRegex();

    [GeneratedRegex(@"^\s*<\s*(\d+[\.\,]?\d*)\s*$")]
    private static partial Regex LessThanRegex();

    [GeneratedRegex(@"^\s*>\s*(\d+[\.\,]?\d*)\s*$")]
    private static partial Regex GreaterThanRegex();
}
