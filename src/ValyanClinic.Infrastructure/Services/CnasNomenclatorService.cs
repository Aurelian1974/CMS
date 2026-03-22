using System.Data;
using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Xml;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Cnas.DTOs;
using ValyanClinic.Infrastructure.Configuration;
using ValyanClinic.Infrastructure.Data;

namespace ValyanClinic.Infrastructure.Services;

/// <summary>
/// Serviciu pentru sincronizarea nomenclatoarelor CNAS (farmacii):
/// scrapează URL-urile zip de pe siui.cnas.ro, descarcă, extrage și importă streaming cu SqlBulkCopy.
/// </summary>
public sealed class CnasNomenclatorService(
    DapperContext dapperContext,
    ICnasSyncRepository syncRepository,
    IHttpClientFactory httpClientFactory,
    IOptions<CnasOptions> options,
    ILogger<CnasNomenclatorService> logger) : ICnasNomenclatorService
{
    // Numai URL-uri de pe domeniul CNAS — protecție SSRF
    private static readonly string AllowedUrlPrefix = "https://cnas.ro/";

    // Regex pentru identificarea fișierelor în pagina CNAS
    private static readonly Regex NomenclatoareRegex =
        new(@"https://cnas\.ro/[^\s""'<>]+NomenclatoareFarmacii_\d{8}\.xml_\.zip",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ListaRegex =
        new(@"https://cnas\.ro/[^\s""'<>]+NomenclatoareFarmaciiLista\d{8}_\d{8}\.xml_\.zip",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private const int BulkBatchSize = 5_000;

    // ─────────────────────────────────────────────────────────────────────────
    // Punct de intrare — returnează imediat JobId, rulează pe background thread
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<Guid> StartSyncAsync(string triggeredBy, CancellationToken ct = default)
    {
        var jobId = await syncRepository.CreateSyncLogAsync(triggeredBy, ct);
        logger.LogInformation("CNAS sync started. JobId={JobId}, TriggeredBy={TriggeredBy}", jobId, triggeredBy);

        // Rulăm pe un thread separat pentru a nu bloca request-ul HTTP
        _ = Task.Run(() => RunSyncInternalAsync(jobId), CancellationToken.None);

        return jobId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Procesare completă (background)
    // ─────────────────────────────────────────────────────────────────────────

    private async Task RunSyncInternalAsync(Guid jobId)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var updateDto = new CnasSyncLogUpdateDto(
            jobId, "Success", null, null, null, null,
            null, null, null, null, null, null);

        try
        {
            var opts = options.Value;

            // 1. Obține URL-urile fișierelor ZIP din pagina CNAS
            var (urlNomenclator, urlLista) = await ScrapeUrlsAsync(opts.NomenclatorPageUrl);
            logger.LogInformation("CNAS URLs found: {UrlN}, {UrlL}", urlNomenclator, urlLista);

            updateDto = updateDto with { UrlNomenclator = urlNomenclator, UrlLista = urlLista };

            // 2. Descarcă și importă fișierul mare (NomenclatoareFarmacii_*)
            var mainStats = await DownloadAndImportAsync(urlNomenclator, opts.TempDownloadPath, isMainFile: true);

            // 3. Descarcă și importă fișierul lista compensate (NomenclatoareFarmaciiLista*)
            var listaStats = await DownloadAndImportAsync(urlLista, opts.TempDownloadPath, isMainFile: false);

            sw.Stop();
            updateDto = updateDto with
            {
                Status               = "Success",
                NomenclatorVersion   = mainStats.Version,
                DrugsInserted        = mainStats.Inserted,
                DrugsUpdated         = mainStats.Updated,
                ActiveSubstsInserted = mainStats.SubstInserted,
                CompensatedInserted  = listaStats.Inserted,
                CompensatedUpdated   = listaStats.Updated,
                DurationSeconds      = (int)sw.Elapsed.TotalSeconds
            };

            logger.LogInformation(
                "CNAS sync completed. JobId={JobId} Drugs={DI}/{DU} Compensated={CI}/{CU} Subst={SI} Time={Sec}s",
                jobId, mainStats.Inserted, mainStats.Updated,
                listaStats.Inserted, listaStats.Updated,
                mainStats.SubstInserted, (int)sw.Elapsed.TotalSeconds);
        }
        catch (Exception ex)
        {
            sw.Stop();
            logger.LogError(ex, "CNAS sync failed. JobId={JobId}", jobId);
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
                logger.LogError(ex, "Failed to update sync log. JobId={JobId}", jobId);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scraping URL-uri pagina CNAS
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<(string urlNomenclator, string urlLista)> ScrapeUrlsAsync(string pageUrl)
    {
        // Validare SSRF — pagina sursă trebuie să fie tot pe cnas.ro
        if (!pageUrl.StartsWith(AllowedUrlPrefix, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"URL pagină CNAS invalid (trebuie să înceapă cu {AllowedUrlPrefix}).");

        using var client = httpClientFactory.CreateClient("CnasClient");
        var html = await client.GetStringAsync(pageUrl);

        var urlNomenclator = NomenclatoareRegex.Match(html).Value;
        var urlLista       = ListaRegex.Match(html).Value;

        if (string.IsNullOrEmpty(urlNomenclator))
            throw new InvalidOperationException("Nu s-a găsit URL-ul NomenclatoareFarmacii în pagina CNAS.");
        if (string.IsNullOrEmpty(urlLista))
            throw new InvalidOperationException("Nu s-a găsit URL-ul NomenclatoareFarmaciiLista în pagina CNAS.");

        // Validare SSRF secundară — URL-urile descoperite trebuie să fie tot pe cnas.ro
        if (!urlNomenclator.StartsWith(AllowedUrlPrefix, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("URL NomenclatoareFarmacii nu este pe domeniul CNAS autorizat.");
        if (!urlLista.StartsWith(AllowedUrlPrefix, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("URL NomenclatoareFarmaciiLista nu este pe domeniul CNAS autorizat.");

        return (urlNomenclator, urlLista);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Descărcare + extragere ZIP + import XML streaming
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ImportStats> DownloadAndImportAsync(
        string zipUrl, string tempFolder, bool isMainFile)
    {
        var zipPath = Path.Combine(tempFolder, $"cnas_{Guid.NewGuid():N}.zip");
        var xmlPath = Path.ChangeExtension(zipPath, ".xml");

        try
        {
            // Descărcare ZIP
            using (var client = httpClientFactory.CreateClient("CnasClient"))
            await using (var responseStream = await client.GetStreamAsync(zipUrl))
            await using (var fileStream = File.Create(zipPath))
            {
                await responseStream.CopyToAsync(fileStream);
            }

            // Extragere XML din ZIP (primul fișier .xml din arhivă)
            using (var zip = ZipFile.OpenRead(zipPath))
            {
                var xmlEntry = zip.Entries.FirstOrDefault(e =>
                    e.Name.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
                    ?? throw new InvalidOperationException($"Nu s-a găsit fișier XML în arhiva {zipUrl}.");
                xmlEntry.ExtractToFile(xmlPath, overwrite: true);
            }

            // Import streaming XmlReader
            return isMainFile
                ? await ImportMainFileAsync(xmlPath)
                : await ImportListaFileAsync(xmlPath);
        }
        finally
        {
            // Curățare fișiere temporare
            if (File.Exists(zipPath))  File.Delete(zipPath);
            if (File.Exists(xmlPath))  File.Delete(xmlPath);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Import fișier principal NomenclatoareFarmacii_*.xml
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ImportStats> ImportMainFileAsync(string xmlPath)
    {
        var stats = new ImportStats();

        await using var fileStream = File.OpenRead(xmlPath);
        using var reader = XmlReader.Create(fileStream, new XmlReaderSettings
        {
            Async = true,
            IgnoreWhitespace = true
        });

        // Navighează la rădăcina documentului
        while (await reader.ReadAsync())
        {
            if (reader.NodeType != XmlNodeType.Element) continue;

            switch (reader.LocalName)
            {
                case "Catalogues":
                    stats.Version = reader.GetAttribute("issueDate");
                    break;

                case "PrescriptionTypes":
                    await ImportSectionAsync(reader, "PrescriptionType",
                        ParsePrescriptionType, ImportPrescriptionTypesAsync);
                    break;

                case "NHPS":
                    await ImportSectionAsync(reader, "NHP",
                        ParseNhp, ImportNhpAsync);
                    break;

                case "DiseaseCategories":
                    await ImportSectionAsync(reader, "DiseaseCategory",
                        ParseDiseaseCategory, ImportDiseaseCategoryAsync);
                    break;

                case "Cim10s":
                    await ImportSectionAsync(reader, "Cim10",
                        ParseCim10, ImportCim10Async);
                    break;

                case "ATCS":
                    await ImportSectionAsync(reader, "ATC",
                        ParseAtc, ImportAtcAsync);
                    break;

                case "ActiveSubstances":
                    var substCount = await ImportSubstanteAsync(reader);
                    stats.SubstInserted += substCount;
                    break;

                case "ICD10S":
                    await ImportSectionAsync(reader, "ICD10",
                        ParseIcd10, ImportIcd10Async);
                    break;

                case "Drugs":
                    var (ins, upd) = await ImportDrugsAsync(reader);
                    stats.Inserted += ins;
                    stats.Updated  += upd;
                    break;
            }
        }

        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Import fișier lista compensate NomenclatoareFarmaciiLista*.xml
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ImportStats> ImportListaFileAsync(string xmlPath)
    {
        var stats = new ImportStats();

        await using var fileStream = File.OpenRead(xmlPath);
        using var reader = XmlReader.Create(fileStream, new XmlReaderSettings
        {
            Async = true,
            IgnoreWhitespace = true
        });

        while (await reader.ReadAsync())
        {
            if (reader.NodeType != XmlNodeType.Element) continue;

            switch (reader.LocalName)
            {
                case "CopaymentListTypes":
                    await ImportSectionAsync(reader, "CopaymentListType",
                        ParseCopaymentListType, ImportCopaymentListTypeAsync);
                    break;

                case "CopaymentListDrugs":
                    var (ins, upd) = await ImportCopaymentListDrugsAsync(reader);
                    stats.Inserted += ins;
                    stats.Updated  += upd;
                    break;

                case "CopaymentListActiveSubsts":
                    var (ins2, upd2) = await ImportCopaymentListSubstAsync(reader);
                    stats.Inserted += ins2;
                    stats.Updated  += upd2;
                    break;
            }
        }

        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Generic section reader + batch importer
    // ─────────────────────────────────────────────────────────────────────────

    private static async Task ImportSectionAsync<T>(
        XmlReader reader,
        string elementName,
        Func<XmlReader, T?> parser,
        Func<List<T>, Task> batchImporter)
    {
        var batch = new List<T>(BulkBatchSize);

        while (await reader.ReadAsync())
        {
            if (reader.NodeType == XmlNodeType.EndElement && reader.Depth < 2) break;
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != elementName) continue;

            var item = parser(reader);
            if (item is not null) batch.Add(item);

            if (batch.Count >= BulkBatchSize)
            {
                await batchImporter(batch);
                batch.Clear();
            }
        }

        if (batch.Count > 0)
            await batchImporter(batch);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parsers XML → tipuri locale
    // ─────────────────────────────────────────────────────────────────────────

    private static CnasPrescriptionTypeRow? ParsePrescriptionType(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("description") ?? "",
            r.GetAttribute("forNarcotics") == "true",
            ParseDate(r.GetAttribute("validFrom")));

    private static CnasNhpRow? ParseNhp(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("description") ?? "",
            r.GetAttribute("programCode") ?? "",
            r.GetAttribute("hasAmbulatoryBudget") == "1",
            r.GetAttribute("hasHospitalBudget") == "1",
            r.GetAttribute("hasDrugsBudget") == "1",
            r.GetAttribute("hasGoodsBudget") == "1",
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            true);

    private static CnasDiseaseCategoryRow? ParseDiseaseCategory(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("description") ?? "",
            r.GetAttribute("isChronicDisease") == "true",
            r.GetAttribute("isAuctioned") == "true",
            ParseDate(r.GetAttribute("validFrom")));

    private static CnasCim10Row? ParseCim10(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("name") ?? "",
            r.GetAttribute("entityLevel") ?? "",
            r.GetAttribute("parentCode"));

    private static CnasAtcRow? ParseAtc(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("description") ?? "",
            null,
            ParseDate(r.GetAttribute("validFrom")));

    private static CnasIcd10Row? ParseIcd10(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("name") ?? "",
            null,
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            true);

    private static CnasDrugRow? ParseDrug(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("name") ?? "",
            r.GetAttribute("presentationMode") ?? "",
            r.GetAttribute("isNarcotic") == "1",
            r.GetAttribute("isFractional") == "true",
            r.GetAttribute("isSpecial") == "true",
            r.GetAttribute("isBrand") == "true",
            r.GetAttribute("hasBioEchiv") == "true",
            ParseDecimal(r.GetAttribute("qtyPerPackage")),
            ParseDecimal(r.GetAttribute("pricePerPackage")),
            ParseDecimal(r.GetAttribute("wholeSalePricePerPackage")),
            r.GetAttribute("prescriptionMode") ?? "",
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            r.GetAttribute("activeSubstance"),
            r.GetAttribute("concentration"),
            r.GetAttribute("pharmaceuticalForm"),
            r.GetAttribute("company"),
            r.GetAttribute("country"),
            r.GetAttribute("atc"),
            true);

    private static CnasCopaymentListTypeRow? ParseCopaymentListType(XmlReader r) =>
        new(r.GetAttribute("code") ?? "",
            r.GetAttribute("description") ?? "",
            ParseDecimal(r.GetAttribute("percent")),
            null,
            null,
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            true);

    private static CnasCopaymentListDrugRow? ParseCopaymentListDrug(XmlReader r) =>
        new(r.GetAttribute("copaymentListType") ?? "",
            r.GetAttribute("drug") ?? "",
            r.GetAttribute("nhpCode"),
            null,
            ParseDecimal(r.GetAttribute("maxPrice")),
            ParseDecimal(r.GetAttribute("maxPriceUT")),
            ParseDecimal(r.GetAttribute("copaymentValue")),
            ParseDecimal(r.GetAttribute("copaymentValue90")),
            ParseDecimal(r.GetAttribute("wholeSalePrice")),
            ParseDecimal(r.GetAttribute("referencePrice")),
            r.GetAttribute("specialLaw"),
            ParseNeedApproval(r.GetAttribute("needApproval")),
            r.GetAttribute("contractCv") == "1",
            r.GetAttribute("overValue") == "1",
            r.GetAttribute("needSpecialty") == "1",
            r.GetAttribute("classifInsulin"),
            r.GetAttribute("hgDci"),
            r.GetAttribute("hgAtc"),
            null,
            r.GetAttribute("openCircuit") == "1",
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            true);

    private static CnasCopaymentListSubstRow? ParseCopaymentListSubst(XmlReader r) =>
        new(r.GetAttribute("copaymentListType") ?? "",
            r.GetAttribute("activeSubstance") ?? "",
            r.GetAttribute("aTC"),
            r.GetAttribute("nhpCode"),
            null,
            null,
            ParseNeedApproval(r.GetAttribute("needApproval")),
            r.GetAttribute("openCircuit") == "1",
            r.GetAttribute("contractCv") == "1",
            ParseDate(r.GetAttribute("validFrom")),
            ParseDate(r.GetAttribute("validTo")),
            true);

    // ─────────────────────────────────────────────────────────────────────────
    // Batch importers — MERGE via temp table
    // ─────────────────────────────────────────────────────────────────────────

    private async Task ImportPrescriptionTypesAsync(List<CnasPrescriptionTypeRow> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #TipPrescriptie (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Description NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                ForNarcotics BIT, ValidFrom DATE);
            """);

        await BulkInsertAsync(conn, "#TipPrescriptie",
            ["Code", "Description", "ForNarcotics", "ValidFrom"],
            rows.Select(r => new object?[] { r.Code, r.Description, r.ForNarcotics, r.ValidFrom }));

        await conn.ExecuteAsync("""
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #TipPrescriptie) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_PrescriptionType AS t
            USING #TipPrescriptie AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Description = s.Description,
                t.ForNarcotics = s.ForNarcotics, t.ValidFrom = s.ValidFrom
            WHEN NOT MATCHED THEN INSERT (Code, Description, ForNarcotics, ValidFrom)
                VALUES (s.Code, s.Description, s.ForNarcotics, s.ValidFrom);
            DROP TABLE #TipPrescriptie;
            """);
    }

    private async Task ImportNhpAsync(List<CnasNhpRow> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #NHP (_id INT IDENTITY(1,1), Code NVARCHAR(30) COLLATE DATABASE_DEFAULT, Description NVARCHAR(500) COLLATE DATABASE_DEFAULT, ProgramCode NVARCHAR(50) COLLATE DATABASE_DEFAULT,
                HasAmbulatoryBudget BIT, HasHospitalBudget BIT, HasDrugsBudget BIT, HasGoodsBudget BIT,
                ValidFrom DATE, ValidTo DATE, IsActive BIT);
            """);

        await BulkInsertAsync(conn, "#NHP",
            ["Code", "Description", "ProgramCode", "HasAmbulatoryBudget", "HasHospitalBudget",
             "HasDrugsBudget", "HasGoodsBudget", "ValidFrom", "ValidTo", "IsActive"],
            rows.Select(r => new object?[]
            {
                r.Code, r.Description, r.ProgramCode, r.HasAmbulatory, r.HasHospital,
                r.HasDrugs, r.HasGoods, r.ValidFrom, r.ValidTo, r.IsActive
            }));

        await conn.ExecuteAsync("""
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #NHP) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_NHP AS t USING #NHP AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Description = s.Description,
                t.ProgramCode = s.ProgramCode, t.HasAmbulatoryBudget = s.HasAmbulatoryBudget,
                t.HasHospitalBudget = s.HasHospitalBudget, t.HasDrugsBudget = s.HasDrugsBudget,
                t.HasGoodsBudget = s.HasGoodsBudget, t.ValidFrom = s.ValidFrom,
                t.ValidTo = s.ValidTo, t.IsActive = s.IsActive
            WHEN NOT MATCHED THEN INSERT (Code, Description, ProgramCode, HasAmbulatoryBudget,
                HasHospitalBudget, HasDrugsBudget, HasGoodsBudget, ValidFrom, ValidTo, IsActive)
                VALUES (s.Code, s.Description, s.ProgramCode, s.HasAmbulatoryBudget,
                    s.HasHospitalBudget, s.HasDrugsBudget, s.HasGoodsBudget,
                    s.ValidFrom, s.ValidTo, s.IsActive);
            DROP TABLE #NHP;
            """);
    }

    private async Task ImportDiseaseCategoryAsync(List<CnasDiseaseCategoryRow> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #DC (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Description NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                IsChronicDisease BIT, IsAuctioned BIT, ValidFrom DATE);
            """);

        await BulkInsertAsync(conn, "#DC",
            ["Code", "Description", "IsChronicDisease", "IsAuctioned", "ValidFrom"],
            rows.Select(r => new object?[] { r.Code, r.Description, r.IsChronic, r.IsAuctioned, r.ValidFrom }));

        await conn.ExecuteAsync("""
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #DC) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_DiseaseCategory AS t USING #DC AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Description = s.Description,
                t.IsChronicDisease = s.IsChronicDisease, t.IsAuctioned = s.IsAuctioned,
                t.ValidFrom = s.ValidFrom
            WHEN NOT MATCHED THEN INSERT (Code, Description, IsChronicDisease, IsAuctioned, ValidFrom)
                VALUES (s.Code, s.Description, s.IsChronicDisease, s.IsAuctioned, s.ValidFrom);
            DROP TABLE #DC;
            """);
    }

    private async Task ImportCim10Async(List<CnasCim10Row> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #Cim10 (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Name NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                EntityLevel NVARCHAR(20) COLLATE DATABASE_DEFAULT, ParentCode NVARCHAR(20) COLLATE DATABASE_DEFAULT);
            """);

        await BulkInsertAsync(conn, "#Cim10",
            ["Code", "Name", "EntityLevel", "ParentCode"],
            rows.Select(r => new object?[] { r.Code, r.Name, r.EntityLevel, r.ParentCode }));

        await conn.ExecuteAsync("""
            ALTER TABLE dbo.Cnas_Cim10 NOCHECK CONSTRAINT FK_Cim10_Parent;
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY _id) AS _rn FROM #Cim10) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_Cim10 AS t USING #Cim10 AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Name = s.Name, t.EntityLevel = s.EntityLevel,
                t.ParentCode = s.ParentCode
            WHEN NOT MATCHED THEN INSERT (Code, Name, EntityLevel, ParentCode)
                VALUES (s.Code, s.Name, s.EntityLevel, s.ParentCode);
            ALTER TABLE dbo.Cnas_Cim10 CHECK CONSTRAINT FK_Cim10_Parent;
            DROP TABLE #Cim10;
            """);
    }

    private async Task ImportAtcAsync(List<CnasAtcRow> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #ATC (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Description NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                ParentATC NVARCHAR(20) COLLATE DATABASE_DEFAULT, ValidFrom DATE);
            """);

        await BulkInsertAsync(conn, "#ATC",
            ["Code", "Description", "ParentATC", "ValidFrom"],
            rows.Select(r => new object?[] { r.Code, r.Description, r.ParentATC, r.ValidFrom }));

        await conn.ExecuteAsync("""
            ALTER TABLE dbo.Cnas_ATC NOCHECK CONSTRAINT FK_ATC_Parent;
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #ATC) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_ATC AS t USING #ATC AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Description = s.Description,
                t.ParentATC = s.ParentATC, t.ValidFrom = s.ValidFrom
            WHEN NOT MATCHED THEN INSERT (Code, Description, ParentATC, ValidFrom)
                VALUES (s.Code, s.Description, s.ParentATC, s.ValidFrom);
            ALTER TABLE dbo.Cnas_ATC CHECK CONSTRAINT FK_ATC_Parent;
            DROP TABLE #ATC;
            """);
    }

    private async Task<int> ImportSubstanteAsync(XmlReader reader)
    {
        var rows    = new List<string>(BulkBatchSize);
        var total   = 0;

        async Task FlushAsync()
        {
            if (rows.Count == 0) return;

            using var conn = (SqlConnection)dapperContext.CreateConnection();
            await conn.OpenAsync();

            await conn.ExecuteAsync("""
                CREATE TABLE #SubstActiva (_id INT IDENTITY(1,1), Code NVARCHAR(200) COLLATE DATABASE_DEFAULT, ValidFrom DATE);
                """);

            await BulkInsertAsync(conn, "#SubstActiva",
                ["Code", "ValidFrom"],
                rows.Select(c => new object?[] { c, (DateTime?)null }));

            await conn.ExecuteAsync("""
                ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY _id) AS _rn FROM #SubstActiva) DELETE FROM cte WHERE _rn > 1;
                MERGE dbo.Cnas_ActiveSubstance AS t USING #SubstActiva AS s ON t.Code = s.Code
                WHEN NOT MATCHED THEN INSERT (Code, ValidFrom) VALUES (s.Code, s.ValidFrom);
                DROP TABLE #SubstActiva;
                """);

            total += rows.Count;
            rows.Clear();
        }

        while (await reader.ReadAsync())
        {
            if (reader.NodeType == XmlNodeType.EndElement && reader.Depth < 2) break;
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "ActiveSubstance") continue;

            var code = reader.GetAttribute("code");
            if (!string.IsNullOrEmpty(code)) rows.Add(code);

            if (rows.Count >= BulkBatchSize) await FlushAsync();
        }

        await FlushAsync();
        return total;
    }

    private async Task ImportIcd10Async(List<CnasIcd10Row> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #ICD10 (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Name NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                DiseaseCategoryCode NVARCHAR(20) COLLATE DATABASE_DEFAULT, ValidFrom DATE, ValidTo DATE, IsActive BIT);
            """);

        await BulkInsertAsync(conn, "#ICD10",
            ["Code", "Name", "DiseaseCategoryCode", "ValidFrom", "ValidTo", "IsActive"],
            rows.Select(r => new object?[]
            {
                r.Code, r.Name, r.DiseaseCategoryCode, r.ValidFrom, r.ValidTo, r.IsActive
            }));

        await conn.ExecuteAsync("""
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #ICD10) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_ICD10 AS t USING #ICD10 AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Name = s.Name,
                t.DiseaseCategoryCode = s.DiseaseCategoryCode, t.ValidFrom = s.ValidFrom,
                t.ValidTo = s.ValidTo, t.IsActive = s.IsActive
            WHEN NOT MATCHED THEN INSERT (Code, Name, DiseaseCategoryCode, ValidFrom, ValidTo, IsActive)
                VALUES (s.Code, s.Name, s.DiseaseCategoryCode, s.ValidFrom, s.ValidTo, s.IsActive);
            DROP TABLE #ICD10;
            """);
    }

    private async Task<(int Inserted, int Updated)> ImportDrugsAsync(XmlReader reader)
    {
        var rows     = new List<CnasDrugRow>(BulkBatchSize);
        var inserted = 0;
        var updated  = 0;

        async Task FlushAsync()
        {
            if (rows.Count == 0) return;

            using var conn = (SqlConnection)dapperContext.CreateConnection();
            await conn.OpenAsync();

            await conn.ExecuteAsync("""
                CREATE TABLE #Drug (
                    _id INT IDENTITY(1,1), Code NVARCHAR(50) COLLATE DATABASE_DEFAULT, Name NVARCHAR(500) COLLATE DATABASE_DEFAULT, PresentationMode NVARCHAR(1000) COLLATE DATABASE_DEFAULT,
                    IsNarcotic BIT, IsFractional BIT, IsSpecial BIT, IsBrand BIT, IsBioEchiv BIT,
                    QtyPerPackage DECIMAL(18,4), PricePerPackage DECIMAL(18,4),
                    WholeSalePricePerPackage DECIMAL(18,4), PrescriptionMode NVARCHAR(50) COLLATE DATABASE_DEFAULT,
                    ValidFrom DATE, ValidTo DATE, ActiveSubstanceCode NVARCHAR(200) COLLATE DATABASE_DEFAULT,
                    Concentration NVARCHAR(200) COLLATE DATABASE_DEFAULT, PharmaceuticalForm NVARCHAR(200) COLLATE DATABASE_DEFAULT,
                    Company NVARCHAR(500) COLLATE DATABASE_DEFAULT, CountryCode NVARCHAR(20) COLLATE DATABASE_DEFAULT, AtcCode NVARCHAR(20) COLLATE DATABASE_DEFAULT, IsActive BIT);
                """);

            await BulkInsertAsync(conn, "#Drug",
                ["Code", "Name", "PresentationMode", "IsNarcotic", "IsFractional",
                 "IsSpecial", "IsBrand", "IsBioEchiv", "QtyPerPackage", "PricePerPackage",
                 "WholeSalePricePerPackage", "PrescriptionMode", "ValidFrom", "ValidTo",
                 "ActiveSubstanceCode", "Concentration", "PharmaceuticalForm",
                 "Company", "CountryCode", "AtcCode", "IsActive"],
                rows.Select(r => new object?[]
                {
                    r.Code, r.Name, r.PresentationMode, r.IsNarcotic, r.IsFractional,
                    r.IsSpecial, r.IsBrand, r.IsBioEchiv, r.QtyPerPackage, r.PricePerPackage,
                    r.WholeSalePricePerPackage, r.PrescriptionMode, r.ValidFrom, r.ValidTo,
                    r.ActiveSubstanceCode, r.Concentration, r.PharmaceuticalForm,
                    r.Company, r.CountryCode, r.AtcCode, r.IsActive
                }));

            var result = await conn.QueryAsync<MergeResult>("""
                ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #Drug) DELETE FROM cte WHERE _rn > 1;
                MERGE dbo.Cnas_Drug AS t USING #Drug AS s ON t.Code = s.Code
                WHEN MATCHED THEN UPDATE SET t.Name = s.Name, t.PresentationMode = s.PresentationMode,
                    t.IsNarcotic = s.IsNarcotic, t.IsFractional = s.IsFractional, t.IsSpecial = s.IsSpecial,
                    t.IsBrand = s.IsBrand, t.HasBioEchiv = s.IsBioEchiv, t.QtyPerPackage = s.QtyPerPackage,
                    t.PricePerPackage = s.PricePerPackage, t.WholeSalePricePerPackage = s.WholeSalePricePerPackage,
                    t.PrescriptionMode = s.PrescriptionMode, t.ValidFrom = s.ValidFrom, t.ValidTo = s.ValidTo,
                    t.ActiveSubstanceCode = s.ActiveSubstanceCode, t.Concentration = s.Concentration,
                    t.PharmaceuticalForm = s.PharmaceuticalForm, t.Company = s.Company,
                    t.CountryCode = s.CountryCode, t.AtcCode = s.AtcCode, t.IsActive = s.IsActive
                WHEN NOT MATCHED THEN INSERT (Code, Name, PresentationMode, IsNarcotic, IsFractional,
                    IsSpecial, IsBrand, HasBioEchiv, QtyPerPackage, PricePerPackage,
                    WholeSalePricePerPackage, PrescriptionMode, ValidFrom, ValidTo,
                    ActiveSubstanceCode, Concentration, PharmaceuticalForm, Company, CountryCode, AtcCode, IsActive)
                    VALUES (s.Code, s.Name, s.PresentationMode, s.IsNarcotic, s.IsFractional,
                        s.IsSpecial, s.IsBrand, s.IsBioEchiv, s.QtyPerPackage, s.PricePerPackage,
                        s.WholeSalePricePerPackage, s.PrescriptionMode, s.ValidFrom, s.ValidTo,
                        s.ActiveSubstanceCode, s.Concentration, s.PharmaceuticalForm,
                        s.Company, s.CountryCode, s.AtcCode, s.IsActive)
                OUTPUT $action AS Action;
                DROP TABLE #Drug;
                """);

            foreach (var r in result)
            {
                if (r.Action == "INSERT") inserted++;
                else updated++;
            }
            rows.Clear();
        }

        while (await reader.ReadAsync())
        {
            if (reader.NodeType == XmlNodeType.EndElement && reader.Depth < 2) break;
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "Drug") continue;

            var row = ParseDrug(reader);
            if (row is not null) rows.Add(row);

            if (rows.Count >= BulkBatchSize) await FlushAsync();
        }

        await FlushAsync();
        return (inserted, updated);
    }

    private async Task ImportCopaymentListTypeAsync(List<CnasCopaymentListTypeRow> rows)
    {
        using var conn = (SqlConnection)dapperContext.CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE #TipLista (_id INT IDENTITY(1,1), Code NVARCHAR(20) COLLATE DATABASE_DEFAULT, Description NVARCHAR(500) COLLATE DATABASE_DEFAULT,
                CopaymentPercent DECIMAL(5,2), DrugMaxNo INT, MaxValue DECIMAL(18,4),
                ValidFrom DATE, ValidTo DATE, IsActive BIT);
            """);

        await BulkInsertAsync(conn, "#TipLista",
            ["Code", "Description", "CopaymentPercent", "DrugMaxNo", "MaxValue",
             "ValidFrom", "ValidTo", "IsActive"],
            rows.Select(r => new object?[]
            {
                r.Code, r.Description, r.CopaymentPercent, r.DrugMaxNo,
                r.MaxValue, r.ValidFrom, r.ValidTo, r.IsActive
            }));

        await conn.ExecuteAsync("""
            ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY Code ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #TipLista) DELETE FROM cte WHERE _rn > 1;
            MERGE dbo.Cnas_CopaymentListType AS t USING #TipLista AS s ON t.Code = s.Code
            WHEN MATCHED THEN UPDATE SET t.Description = s.Description,
                t.CopaymentPercent = s.CopaymentPercent, t.DrugMaxNo = s.DrugMaxNo,
                t.MaxValue = s.MaxValue, t.ValidFrom = s.ValidFrom, t.ValidTo = s.ValidTo,
                t.IsActive = s.IsActive
            WHEN NOT MATCHED THEN INSERT (Code, Description, CopaymentPercent, DrugMaxNo, MaxValue,
                ValidFrom, ValidTo, IsActive)
                VALUES (s.Code, s.Description, s.CopaymentPercent, s.DrugMaxNo, s.MaxValue,
                    s.ValidFrom, s.ValidTo, s.IsActive);
            DROP TABLE #TipLista;
            """);
    }

    private async Task<(int Inserted, int Updated)> ImportCopaymentListDrugsAsync(XmlReader reader)
    {
        var rows     = new List<CnasCopaymentListDrugRow>(BulkBatchSize);
        var inserted = 0;
        var updated  = 0;

        async Task FlushAsync()
        {
            if (rows.Count == 0) return;

            using var conn = (SqlConnection)dapperContext.CreateConnection();
            await conn.OpenAsync();

            await conn.ExecuteAsync("""
                CREATE TABLE #ListaDrug (
                    _id INT IDENTITY(1,1), CopaymentListType NVARCHAR(20) COLLATE DATABASE_DEFAULT, DrugCode NVARCHAR(50) COLLATE DATABASE_DEFAULT, NhpCode NVARCHAR(30) COLLATE DATABASE_DEFAULT,
                    DiseaseCode NVARCHAR(20) COLLATE DATABASE_DEFAULT, MaxPrice DECIMAL(18,4), MaxPriceUT DECIMAL(18,4),
                    CopaymentValue DECIMAL(18,4), CopaymentValue90 DECIMAL(18,4),
                    WholeSalePrice DECIMAL(18,4), ReferencePrice DECIMAL(18,4),
                    SpecialLaw NVARCHAR(100) COLLATE DATABASE_DEFAULT, NeedApproval BIT, ContractCv BIT, OverValue BIT,
                    NeedSpecialty BIT, ClassifInsulin NVARCHAR(50) COLLATE DATABASE_DEFAULT, HgDci NVARCHAR(200) COLLATE DATABASE_DEFAULT,
                    HgAtc NVARCHAR(50) COLLATE DATABASE_DEFAULT, HgIcd10 NVARCHAR(50) COLLATE DATABASE_DEFAULT, OpenCircuit BIT,
                    ValidFrom DATE, ValidTo DATE, IsActive BIT);
                """);

            await BulkInsertAsync(conn, "#ListaDrug",
                ["CopaymentListType", "DrugCode", "NhpCode", "DiseaseCode",
                 "MaxPrice", "MaxPriceUT", "CopaymentValue", "CopaymentValue90",
                 "WholeSalePrice", "ReferencePrice", "SpecialLaw", "NeedApproval",
                 "ContractCv", "OverValue", "NeedSpecialty", "ClassifInsulin",
                 "HgDci", "HgAtc", "HgIcd10", "OpenCircuit", "ValidFrom", "ValidTo", "IsActive"],
                rows.Select(r => new object?[]
                {
                    r.CopaymentListType, r.DrugCode, r.NhpCode, r.DiseaseCode,
                    r.MaxPrice, r.MaxPriceUT, r.CopaymentValue, r.CopaymentValue90,
                    r.WholeSalePrice, r.ReferencePrice, r.SpecialLaw, r.NeedApproval,
                    r.ContractCv, r.OverValue, r.NeedSpecialty, r.ClassifInsulin,
                    r.HgDci, r.HgAtc, r.HgIcd10, r.OpenCircuit, r.ValidFrom, r.ValidTo, r.IsActive
                }));

            var result = await conn.QueryAsync<MergeResult>("""
                ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY CopaymentListType, DrugCode, ISNULL(NhpCode,''), ISNULL(DiseaseCode,'') ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #ListaDrug) DELETE FROM cte WHERE _rn > 1;
                MERGE dbo.Cnas_CopaymentListDrug AS t
                USING #ListaDrug AS s ON t.CopaymentListType = s.CopaymentListType
                    AND t.DrugCode = s.DrugCode AND ISNULL(t.NhpCode,'') = ISNULL(s.NhpCode,'')
                    AND ISNULL(t.DiseaseCode,'') = ISNULL(s.DiseaseCode,'')
                WHEN MATCHED THEN UPDATE SET t.MaxPrice = s.MaxPrice, t.MaxPriceUT = s.MaxPriceUT,
                    t.CopaymentValue = s.CopaymentValue, t.CopaymentValue90 = s.CopaymentValue90,
                    t.WholeSalePrice = s.WholeSalePrice, t.ReferencePrice = s.ReferencePrice,
                    t.SpecialLaw = s.SpecialLaw, t.NeedApproval = s.NeedApproval,
                    t.ContractCv = s.ContractCv, t.OverValue = s.OverValue,
                    t.NeedSpecialty = s.NeedSpecialty, t.ClassifInsulin = s.ClassifInsulin,
                    t.HgDci = s.HgDci, t.HgAtc = s.HgAtc, t.HgIcd10 = s.HgIcd10,
                    t.OpenCircuit = s.OpenCircuit, t.ValidFrom = s.ValidFrom,
                    t.ValidTo = s.ValidTo, t.IsActive = s.IsActive
                WHEN NOT MATCHED THEN INSERT (CopaymentListType, DrugCode, NhpCode, DiseaseCode,
                    MaxPrice, MaxPriceUT, CopaymentValue, CopaymentValue90, WholeSalePrice,
                    ReferencePrice, SpecialLaw, NeedApproval, ContractCv, OverValue, NeedSpecialty,
                    ClassifInsulin, HgDci, HgAtc, HgIcd10, OpenCircuit, ValidFrom, ValidTo, IsActive)
                    VALUES (s.CopaymentListType, s.DrugCode, s.NhpCode, s.DiseaseCode,
                        s.MaxPrice, s.MaxPriceUT, s.CopaymentValue, s.CopaymentValue90, s.WholeSalePrice,
                        s.ReferencePrice, s.SpecialLaw, s.NeedApproval, s.ContractCv, s.OverValue,
                        s.NeedSpecialty, s.ClassifInsulin, s.HgDci, s.HgAtc, s.HgIcd10, s.OpenCircuit,
                        s.ValidFrom, s.ValidTo, s.IsActive)
                OUTPUT $action AS Action;
                DROP TABLE #ListaDrug;
                """);

            foreach (var r in result) { if (r.Action == "INSERT") inserted++; else updated++; }
            rows.Clear();
        }

        while (await reader.ReadAsync())
        {
            if (reader.NodeType == XmlNodeType.EndElement && reader.Depth < 2) break;
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "CopaymentListDrug") continue;

            var row = ParseCopaymentListDrug(reader);
            if (row is not null) rows.Add(row);

            if (rows.Count >= BulkBatchSize) await FlushAsync();
        }

        await FlushAsync();
        return (inserted, updated);
    }

    private async Task<(int Inserted, int Updated)> ImportCopaymentListSubstAsync(XmlReader reader)
    {
        var rows     = new List<CnasCopaymentListSubstRow>(BulkBatchSize);
        var inserted = 0;
        var updated  = 0;

        async Task FlushAsync()
        {
            if (rows.Count == 0) return;

            using var conn = (SqlConnection)dapperContext.CreateConnection();
            await conn.OpenAsync();

            await conn.ExecuteAsync("""
                CREATE TABLE #ListaSubst (
                    _id INT IDENTITY(1,1), CopaymentListType NVARCHAR(20) COLLATE DATABASE_DEFAULT, ActiveSubstanceCode NVARCHAR(200) COLLATE DATABASE_DEFAULT,
                    AtcCode NVARCHAR(20) COLLATE DATABASE_DEFAULT, NhpCode NVARCHAR(30) COLLATE DATABASE_DEFAULT, DiseaseCategoryCode NVARCHAR(20) COLLATE DATABASE_DEFAULT,
                    Icd10 NVARCHAR(20) COLLATE DATABASE_DEFAULT, NeedApproval BIT, OpenCircuit BIT, ContractCv BIT,
                    ValidFrom DATE, ValidTo DATE, IsActive BIT);
                """);

            await BulkInsertAsync(conn, "#ListaSubst",
                ["CopaymentListType", "ActiveSubstanceCode", "AtcCode", "NhpCode",
                 "DiseaseCategoryCode", "Icd10", "NeedApproval", "OpenCircuit", "ContractCv",
                 "ValidFrom", "ValidTo", "IsActive"],
                rows.Select(r => new object?[]
                {
                    r.CopaymentListType, r.ActiveSubstanceCode, r.AtcCode, r.NhpCode,
                    r.DiseaseCategoryCode, r.Icd10, r.NeedApproval, r.OpenCircuit, r.ContractCv,
                    r.ValidFrom, r.ValidTo, r.IsActive
                }));

            var result = await conn.QueryAsync<MergeResult>("""
                ;WITH cte AS (SELECT _id, ROW_NUMBER() OVER (PARTITION BY CopaymentListType, ActiveSubstanceCode, ISNULL(NhpCode,''), ISNULL(DiseaseCategoryCode,'') ORDER BY ISNULL(ValidFrom, '1900-01-01') DESC) AS _rn FROM #ListaSubst) DELETE FROM cte WHERE _rn > 1;
                MERGE dbo.Cnas_CopaymentListActiveSubst AS t
                USING #ListaSubst AS s ON t.CopaymentListType = s.CopaymentListType
                    AND t.ActiveSubstanceCode = s.ActiveSubstanceCode
                    AND ISNULL(t.NhpCode,'') = ISNULL(s.NhpCode,'')
                    AND ISNULL(t.DiseaseCategoryCode,'') = ISNULL(s.DiseaseCategoryCode,'')
                WHEN MATCHED THEN UPDATE SET t.AtcCode = s.AtcCode, t.Icd10 = s.Icd10,
                    t.NeedApproval = s.NeedApproval, t.OpenCircuit = s.OpenCircuit,
                    t.ContractCv = s.ContractCv, t.ValidFrom = s.ValidFrom,
                    t.ValidTo = s.ValidTo, t.IsActive = s.IsActive
                WHEN NOT MATCHED THEN INSERT (CopaymentListType, ActiveSubstanceCode, AtcCode,
                    NhpCode, DiseaseCategoryCode, Icd10, NeedApproval, OpenCircuit, ContractCv,
                    ValidFrom, ValidTo, IsActive)
                    VALUES (s.CopaymentListType, s.ActiveSubstanceCode, s.AtcCode, s.NhpCode,
                        s.DiseaseCategoryCode, s.Icd10, s.NeedApproval, s.OpenCircuit, s.ContractCv,
                        s.ValidFrom, s.ValidTo, s.IsActive)
                OUTPUT $action AS Action;
                DROP TABLE #ListaSubst;
                """);

            foreach (var r in result) { if (r.Action == "INSERT") inserted++; else updated++; }
            rows.Clear();
        }

        while (await reader.ReadAsync())
        {
            if (reader.NodeType == XmlNodeType.EndElement && reader.Depth < 2) break;
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "CopaymentListActiveSubst") continue;

            var row = ParseCopaymentListSubst(reader);
            if (row is not null) rows.Add(row);

            if (rows.Count >= BulkBatchSize) await FlushAsync();
        }

        await FlushAsync();
        return (inserted, updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SqlBulkCopy helper — DataTable dinamic
    // ─────────────────────────────────────────────────────────────────────────

    private static async Task BulkInsertAsync(
        SqlConnection conn, string tableName,
        string[] columns, IEnumerable<object?[]> rows)
    {
        var dt = new DataTable();
        foreach (var col in columns) dt.Columns.Add(col);

        foreach (var row in rows)
        {
            var dr = dt.NewRow();
            for (int i = 0; i < columns.Length; i++) dr[i] = row[i] ?? DBNull.Value;
            dt.Rows.Add(dr);
        }

        using var bcp = new SqlBulkCopy(conn)
        {
            DestinationTableName = tableName,
            BatchSize = BulkBatchSize
        };
        foreach (var col in columns) bcp.ColumnMappings.Add(col, col);
        await bcp.WriteToServerAsync(dt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers parsare
    // ─────────────────────────────────────────────────────────────────────────

    private static DateTime? ParseDate(string? s) =>
        DateTime.TryParse(s, out var d) ? d : null;

    private static decimal? ParseDecimal(string? s) =>
        decimal.TryParse(s, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;

    private static int? ParseInt(string? s) =>
        int.TryParse(s, out var v) ? v : null;

    /// <summary>
    /// needApproval poate fi "0" (false), "1", "P", "S" etc. — orice valoare non-"0" = true.
    /// </summary>
    private static bool ParseNeedApproval(string? s) =>
        !string.IsNullOrEmpty(s) && s != "0";

    // ─────────────────────────────────────────────────────────────────────────
    // Record-uri interne de transfer (parsare XML → DB)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ImportStats
    {
        public string? Version        { get; set; }
        public int Inserted           { get; set; }
        public int Updated            { get; set; }
        public int SubstInserted      { get; set; }
    }

    private sealed record MergeResult(string Action);

    private sealed record CnasPrescriptionTypeRow(
        string Code, string Description, bool ForNarcotics, DateTime? ValidFrom);

    private sealed record CnasNhpRow(
        string Code, string Description, string ProgramCode,
        bool HasAmbulatory, bool HasHospital, bool HasDrugs, bool HasGoods,
        DateTime? ValidFrom, DateTime? ValidTo, bool IsActive);

    private sealed record CnasDiseaseCategoryRow(
        string Code, string Description, bool IsChronic, bool IsAuctioned, DateTime? ValidFrom);

    private sealed record CnasCim10Row(
        string Code, string Name, string EntityLevel, string? ParentCode);

    private sealed record CnasAtcRow(
        string Code, string Description, string? ParentATC, DateTime? ValidFrom);

    private sealed record CnasIcd10Row(
        string Code, string Name, string? DiseaseCategoryCode,
        DateTime? ValidFrom, DateTime? ValidTo, bool IsActive);

    private sealed record CnasDrugRow(
        string Code, string Name, string PresentationMode,
        bool IsNarcotic, bool IsFractional, bool IsSpecial, bool IsBrand, bool IsBioEchiv,
        decimal? QtyPerPackage, decimal? PricePerPackage, decimal? WholeSalePricePerPackage,
        string PrescriptionMode, DateTime? ValidFrom, DateTime? ValidTo,
        string? ActiveSubstanceCode, string? Concentration, string? PharmaceuticalForm,
        string? Company, string? CountryCode, string? AtcCode, bool IsActive);

    private sealed record CnasCopaymentListTypeRow(
        string Code, string Description, decimal? CopaymentPercent, int? DrugMaxNo, decimal? MaxValue,
        DateTime? ValidFrom, DateTime? ValidTo, bool IsActive);

    private sealed record CnasCopaymentListDrugRow(
        string CopaymentListType, string DrugCode, string? NhpCode, string? DiseaseCode,
        decimal? MaxPrice, decimal? MaxPriceUT, decimal? CopaymentValue, decimal? CopaymentValue90,
        decimal? WholeSalePrice, decimal? ReferencePrice, string? SpecialLaw,
        bool NeedApproval, bool ContractCv, bool OverValue, bool NeedSpecialty,
        string? ClassifInsulin, string? HgDci, string? HgAtc, string? HgIcd10, bool OpenCircuit,
        DateTime? ValidFrom, DateTime? ValidTo, bool IsActive);

    private sealed record CnasCopaymentListSubstRow(
        string CopaymentListType, string ActiveSubstanceCode, string? AtcCode,
        string? NhpCode, string? DiseaseCategoryCode, string? Icd10,
        bool NeedApproval, bool OpenCircuit, bool ContractCv,
        DateTime? ValidFrom, DateTime? ValidTo, bool IsActive);
}
