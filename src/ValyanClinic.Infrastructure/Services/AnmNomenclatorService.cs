using System.Data;
using System.Globalization;
using System.Text;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MiniExcelLibs;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Anm.DTOs;
using ValyanClinic.Infrastructure.Configuration;
using ValyanClinic.Infrastructure.Data;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Serviciu pentru sincronizarea nomenclatorului ANM (Agenția Națională a Medicamentului).
/// Descarcă fișierul Excel de pe nomenclator.anm.ro, parsează rândurile și le importă
/// în baza de date folosind SqlBulkCopy + MERGE.
/// </summary>
public sealed class AnmNomenclatorService(
    DapperContext dapperContext,
    IAnmSyncRepository syncRepository,
    IHttpClientFactory httpClientFactory,
    IOptions<AnmOptions> options,
    ILogger<AnmNomenclatorService> logger) : IAnmNomenclatorService
{
    // URL-ul permis — protecție SSRF: acceptăm doar descărcări de pe domeniul ANM
    private const string AllowedUrlPrefix = "https://nomenclator.anm.ro/";

    private const int BulkBatchSize = 2_000;

    // ─────────────────────────────────────────────────────────────────────────
    // Punct de intrare — returnează JobId imediat, rulează pe background thread
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<Guid> StartSyncAsync(string triggeredBy, CancellationToken ct = default)
    {
        var jobId = await syncRepository.CreateSyncLogAsync(triggeredBy, ct);
        logger.LogInformation("ANM sync started. JobId={JobId}, TriggeredBy={TriggeredBy}", jobId, triggeredBy);

        _ = Task.Run(() => RunSyncInternalAsync(jobId), CancellationToken.None);

        return jobId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Procesare completă (background)
    // ─────────────────────────────────────────────────────────────────────────

    private async Task RunSyncInternalAsync(Guid jobId)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var updateDto = new AnmSyncLogUpdateDto(jobId, "Success", null, null, null, null, null);

        try
        {
            var opts = options.Value;

            // Validare SSRF — acceptăm doar URL-ul oficial ANM
            if (!opts.ExcelUrl.StartsWith(AllowedUrlPrefix, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"URL ANM invalid: trebuie să înceapă cu {AllowedUrlPrefix}");

            var (inserted, updated, total) = await DownloadAndImportAsync(opts.ExcelUrl, opts.TempDownloadPath);

            sw.Stop();
            updateDto = updateDto with
            {
                Status          = "Success",
                TotalProcessed  = total,
                TotalInserted   = inserted,
                TotalUpdated    = updated,
                DurationSeconds = (int)sw.Elapsed.TotalSeconds
            };

            logger.LogInformation(
                "ANM sync completed. JobId={JobId} Inserted={I} Updated={U} Total={T} Time={Sec}s",
                jobId, inserted, updated, total, (int)sw.Elapsed.TotalSeconds);
        }
        catch (Exception ex)
        {
            sw.Stop();
            logger.LogError(ex, "ANM sync failed. JobId={JobId}", jobId);
            updateDto = updateDto with
            {
                Status          = "Failed",
                ErrorMessage    = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message,
                DurationSeconds = (int)sw.Elapsed.TotalSeconds
            };
        }
        finally
        {
            try
            {
                await syncRepository.UpdateSyncLogAsync(updateDto, CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Eroare la actualizarea log-ului ANM. JobId={JobId}", jobId);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Descărcare Excel + import streaming în SQL
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<(int Inserted, int Updated, int Total)> DownloadAndImportAsync(
        string excelUrl, string tempFolder)
    {
        var xlsxPath = Path.Combine(tempFolder, $"anm_{Guid.NewGuid():N}.xlsx");

        try
        {
            // 1. Descărcare Excel
            using (var client = httpClientFactory.CreateClient("AnmClient"))
            {
                logger.LogInformation("ANM: descărcare Excel de la {Url}", excelUrl);
                await using var responseStream = await client.GetStreamAsync(excelUrl);
                await using var fileStream     = File.Create(xlsxPath);
                await responseStream.CopyToAsync(fileStream);
            }

            // 2. Parsare Excel + import batching
            return await ImportExcelAsync(xlsxPath);
        }
        finally
        {
            if (File.Exists(xlsxPath))
                File.Delete(xlsxPath);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parsare Excel și import batching cu SqlBulkCopy + MERGE
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<(int Inserted, int Updated, int Total)> ImportExcelAsync(string xlsxPath)
    {
        var rows     = new List<AnmDrugRow>(BulkBatchSize);
        var inserted = 0;
        var updated  = 0;
        var total    = 0;

        // Map coloane Excel (header-based, case-insensitive)
        // Titlurile din fișierul ANM sunt în română — acceptăm variante cunoscute
        var colMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        // Citire streaming cu MiniExcel (nu încarcă tot fișierul în memorie)
        var rows_excel = MiniExcel.Query(xlsxPath, useHeaderRow: true);

        bool headersDetected = false;

        foreach (IDictionary<string, object?> row in rows_excel)
        {
            // Prima iterație — detectăm maparea coloanelor
            if (!headersDetected)
            {
                DetectColumnMapping(row.Keys, colMap);
                headersDetected = true;
                logger.LogInformation("ANM Excel — coloane detectate: [{Cols}]",
                    string.Join(", ", row.Keys));
                logger.LogInformation("ANM Excel — mapare rezultată: [{Map}]",
                    string.Join(", ", colMap.Select(kv => $"{kv.Key}→{kv.Value}")));

                if (colMap.Count == 0)
                {
                    logger.LogWarning("ANM Excel — niciun header recunoscut! " +
                        "Verificați că fișierul Excel este valid și că header-ele sunt pe primul rând.");
                    break;
                }
            }

            var drug = ParseRow(row, colMap);
            if (drug is null) continue;

            rows.Add(drug);
            total++;

            if (rows.Count >= BulkBatchSize)
            {
                var (ins, upd) = await FlushBatchAsync(rows);
                inserted += ins;
                updated  += upd;
                rows.Clear();
                logger.LogDebug("ANM: batch importat, total={Total}", total);
            }
        }

        // Ultimul batch
        if (rows.Count > 0)
        {
            var (ins, upd) = await FlushBatchAsync(rows);
            inserted += ins;
            updated  += upd;
        }

        return (inserted, updated, total);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Normalizare text: elimină diacritice și convertește la lowercase
    // Rezolvă diferențele între ș/ş, ț/ţ, ă/â/î și variantele lor
    // ─────────────────────────────────────────────────────────────────────────

    private static string Normalize(string s)
    {
        var normalized = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return sb.ToString().ToLowerInvariant().Trim();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Detectare automată coloane din header-ul Excel
    // ─────────────────────────────────────────────────────────────────────────

    private static void DetectColumnMapping(IEnumerable<string> headers, Dictionary<string, string> map)
    {
        // Aliasuri normalizate (fără diacritice, lowercase) — multiple variante cunoscute ANM
        var knownMappings = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["AuthorizationCode"] =
            [
                "cod cim", "cim", "cod autorizatie", "nr autorizatie", "autorizatie",
                "nr. autorizatie", "authorization", "cod_autorizatie",
                "nr autorizatie de punere pe piata", "nr. autorizatie de punere pe piata",
                "numar autorizatie", "cod autorizare", "autorizatie de punere pe piata",
                "nrautorizatie", "nrap"
            ],
            ["CommercialName"] =
            [
                "denumire comerciala", "denumire", "name", "commercial name", "denumire_comerciala",
                "denumire produs", "produs", "medicament", "denumire medicament"
            ],
            ["InnName"] =
            [
                "substanta activa", "dci", "inn", "substanta", "ingredient", "substanta_activa",
                "denumire dci", "substante active", "substanta activa (dci)", "dci (substanta activa)"
            ],
            ["PharmaceuticalForm"] =
            [
                "forma farmaceutica", "forma", "pharmaceutical form", "forma_farmaceutica",
                "forma de prezentare"
            ],
            ["AtcCode"] =
            [
                "cod atc", "atc", "atc code", "cod_atc", "codul atc", "clasificare atc"
            ],
            ["Company"] =
            [
                "detinator", "detinator autorizatie", "detinator_autorizatie", "company",
                "firma", "producator", "detinator app", "titularul autorizatiei",
                "titularul autorizatiei de punere pe piata", "titular", "detinator/producator",
                "firma / tara detinatoare app", "firma/tara detinatoare app", "tara detinatoare app"
            ],
            ["Country"] =
            [
                "tara", "tara detinator", "country", "tara_detinator", "tara de origine",
                "tara producator"
            ],
            ["DispenseMode"] =
            [
                "mod de eliberare", "eliberare", "dispense", "mod_eliberare",
                "prescriptie", "tip eliberare", "regim de eliberare", "mod eliberare",
                "modalitate eliberare"
            ],
        };

        // Pre-normalizăm aliasurile o singură dată
        var normalizedMappings = knownMappings
            .Select(kvp => (Field: kvp.Key, Aliases: kvp.Value.Select(Normalize).ToHashSet()))
            .ToList();

        foreach (var header in headers)
        {
            var normalizedHeader = Normalize(header);
            if (string.IsNullOrWhiteSpace(normalizedHeader)) continue;

            foreach (var (fieldName, aliases) in normalizedMappings)
            {
                if (aliases.Contains(normalizedHeader) && !map.ContainsValue(fieldName))
                {
                    map[header] = fieldName;
                    break;
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parsare rând Excel → AnmDrugRow
    // ─────────────────────────────────────────────────────────────────────────

    private static AnmDrugRow? ParseRow(IDictionary<string, object?> row, Dictionary<string, string> colMap)
    {
        string? Get(string field) =>
            colMap.FirstOrDefault(kv => kv.Value == field).Key is { } key && row.TryGetValue(key, out var val)
                ? val?.ToString()?.Trim()
                : null;

        var code = Get("AuthorizationCode");
        var name = Get("CommercialName");

        // Sare rândurile fără cod de autorizare sau denumire
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
            return null;

        return new AnmDrugRow(
            AuthorizationCode:  code,
            CommercialName:     name,
            InnName:            Get("InnName"),
            PharmaceuticalForm: Get("PharmaceuticalForm"),
            AtcCode:            Get("AtcCode"),
            Company:            Get("Company"),
            Country:            Get("Country"),
            DispenseMode:       Get("DispenseMode")
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SqlBulkCopy + MERGE pentru un batch de înregistrări
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<(int Inserted, int Updated)> FlushBatchAsync(List<AnmDrugRow> rows)
    {
        if (rows.Count == 0) return (0, 0);

        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        // Creare tabel temporar
        await conn.ExecuteAsync("""
            CREATE TABLE #AnmDrug (
                AuthorizationCode   NVARCHAR(50)    COLLATE DATABASE_DEFAULT NOT NULL,
                CommercialName      NVARCHAR(500)   COLLATE DATABASE_DEFAULT NOT NULL,
                InnName             NVARCHAR(500)   COLLATE DATABASE_DEFAULT NULL,
                PharmaceuticalForm  NVARCHAR(300)   COLLATE DATABASE_DEFAULT NULL,
                AtcCode             NVARCHAR(20)    COLLATE DATABASE_DEFAULT NULL,
                Company             NVARCHAR(500)   COLLATE DATABASE_DEFAULT NULL,
                Country             NVARCHAR(100)   COLLATE DATABASE_DEFAULT NULL,
                DispenseMode        NVARCHAR(50)    COLLATE DATABASE_DEFAULT NULL
            );
            """);

        // Populate DataTable pentru BulkCopy
        var dt = new DataTable();
        dt.Columns.Add("AuthorizationCode",  typeof(string));
        dt.Columns.Add("CommercialName",     typeof(string));
        dt.Columns.Add("InnName",            typeof(string));
        dt.Columns.Add("PharmaceuticalForm", typeof(string));
        dt.Columns.Add("AtcCode",            typeof(string));
        dt.Columns.Add("Company",            typeof(string));
        dt.Columns.Add("Country",            typeof(string));
        dt.Columns.Add("DispenseMode",       typeof(string));

        foreach (var r in rows)
        {
            dt.Rows.Add(
                r.AuthorizationCode,
                r.CommercialName,
                (object?)r.InnName            ?? DBNull.Value,
                (object?)r.PharmaceuticalForm ?? DBNull.Value,
                (object?)r.AtcCode            ?? DBNull.Value,
                (object?)r.Company            ?? DBNull.Value,
                (object?)r.Country            ?? DBNull.Value,
                (object?)r.DispenseMode       ?? DBNull.Value
            );
        }

        using (var bc = new SqlBulkCopy(conn))
        {
            bc.DestinationTableName = "#AnmDrug";
            bc.BulkCopyTimeout      = 120;
            bc.BatchSize            = BulkBatchSize;
            foreach (DataColumn col in dt.Columns)
                bc.ColumnMappings.Add(col.ColumnName, col.ColumnName);
            await bc.WriteToServerAsync(dt);
        }

        // MERGE + deduplicate (păstrăm prima apariție a fiecărui cod)
        var result = await conn.QueryAsync<MergeResult>("""
            ;WITH cte AS (
                SELECT AuthorizationCode,
                       ROW_NUMBER() OVER (PARTITION BY AuthorizationCode ORDER BY (SELECT NULL)) AS _rn
                FROM #AnmDrug
            )
            DELETE FROM cte WHERE _rn > 1;

            MERGE dbo.Anm_Drug AS t
            USING #AnmDrug AS s ON t.AuthorizationCode = s.AuthorizationCode
            WHEN MATCHED THEN
                UPDATE SET
                    t.CommercialName      = s.CommercialName,
                    t.InnName             = s.InnName,
                    t.PharmaceuticalForm  = s.PharmaceuticalForm,
                    t.AtcCode             = s.AtcCode,
                    t.Company             = s.Company,
                    t.Country             = s.Country,
                    t.DispenseMode        = s.DispenseMode,
                    t.IsActive            = 1,
                    t.SyncedAt            = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (AuthorizationCode, CommercialName, InnName, PharmaceuticalForm,
                        AtcCode, Company, Country, DispenseMode, IsActive, SyncedAt)
                VALUES (s.AuthorizationCode, s.CommercialName, s.InnName, s.PharmaceuticalForm,
                        s.AtcCode, s.Company, s.Country, s.DispenseMode, 1, GETDATE())
            OUTPUT $action AS Action;

            DROP TABLE #AnmDrug;
            """);

        var ins = 0; var upd = 0;
        foreach (var r in result)
        {
            if (r.Action == "INSERT") ins++;
            else upd++;
        }

        return (ins, upd);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tipuri interne
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record AnmDrugRow(
        string  AuthorizationCode,
        string  CommercialName,
        string? InnName,
        string? PharmaceuticalForm,
        string? AtcCode,
        string? Company,
        string? Country,
        string? DispenseMode
    );

    private sealed record MergeResult(string Action);
}
