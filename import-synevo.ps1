<#
.SYNOPSIS
    Scraping analize medicale de pe Synevo.ro si import in DB ValyanClinic.
.DESCRIPTION
    - Parcurge categoriile/subcategoriile din shop-ul Synevo
    - Extrage numele si URL-ul fiecarei analize
    - Creeaza tabelul Analyses (daca nu exista) si insereaza datele
#>

param(
    [string]$Server = ".\ERP",
    [string]$Database = "ValyanClinic"
)

$ErrorActionPreference = "Stop"
$baseUrl = "https://www.synevo.ro"

# ── Functii helper ──────────────────────────────────────────────────────────

function Get-WebPage([string]$Url) {
    Write-Host "  Fetching: $Url" -ForegroundColor DarkGray
    $attempt = 0
    while ($attempt -lt 3) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
            return $response.Content
        }
        catch {
            $attempt++
            if ($attempt -ge 3) {
                Write-Warning "  SKIP (eroare dupa 3 incercari): $Url - $_"
                return $null
            }
            Start-Sleep -Seconds 2
        }
    }
}

function Extract-TopCategories([string]$Html) {
    $categories = [System.Collections.Generic.List[PSCustomObject]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new()
    $ms = [regex]::Matches($Html, 'href="(https://www\.synevo\.ro/categorie/([^/]+)/)"')
    foreach ($m in $ms) {
        $url  = $m.Groups[1].Value
        $slug = $m.Groups[2].Value
        if ($seen.Add($slug)) {
            $nameMatch = [regex]::Match($Html, "href=""$([regex]::Escape($url))""[^>]*>\s*<span>([^<]+)</span>")
            $name = if ($nameMatch.Success) { $nameMatch.Groups[1].Value.Trim() } else { ($slug -replace '-', ' ') -replace '\b(\w)', { $_.Groups[1].Value.ToUpper() } }
            $categories.Add([PSCustomObject]@{ Url = $url; Slug = $slug; Name = $name })
        }
    }
    return $categories
}

function Extract-Subcategories([string]$Html, [string]$ParentSlug) {
    $subs = [System.Collections.Generic.List[PSCustomObject]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new()
    $ms = [regex]::Matches($Html, "href=""(https://www\.synevo\.ro/categorie/$([regex]::Escape($ParentSlug))/([^/]+)/)""")
    foreach ($m in $ms) {
        $url  = $m.Groups[1].Value
        $slug = $m.Groups[2].Value
        if ($seen.Add($slug)) {
            $nameMatch = [regex]::Match($Html, "href=""$([regex]::Escape($url))""[^>]*>\s*<span>([^<]+)</span>")
            $name = if ($nameMatch.Success) { $nameMatch.Groups[1].Value.Trim() } else { ($slug -replace '-', ' ') -replace '\b(\w)', { $_.Groups[1].Value.ToUpper() } }
            $subs.Add([PSCustomObject]@{ Url = $url; Slug = $slug; Name = $name })
        }
    }
    return $subs
}

function Extract-AnalysesFromPage([string]$Html) {
    $analyses = [System.Collections.Generic.List[PSCustomObject]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new()

    $titleMatches = [regex]::Matches($Html, 'href="(https://www\.synevo\.ro/shop/([^/"]+)/?)"[^>]*class="product-title-container"[^>]*>\s*<h2 class="product-title">([^<]+)</h2>')

    for ($i = 0; $i -lt $titleMatches.Count; $i++) {
        $tm = $titleMatches[$i]
        $url  = $tm.Groups[1].Value
        $slug = $tm.Groups[2].Value
        $name = [System.Net.WebUtility]::HtmlDecode($tm.Groups[3].Value.Trim())
        if ($seen.Add($slug)) {
            $analyses.Add([PSCustomObject]@{ Name = $name; Slug = $slug })
        }
    }
    return $analyses
}

function Extract-AllAnalyses([string]$BaseUrl) {
    $all = [System.Collections.Generic.List[PSCustomObject]]::new()
    $page = 1
    while ($true) {
        $url = if ($page -eq 1) { $BaseUrl } else { "${BaseUrl}?page=$page" }
        $html = Get-WebPage $url
        if (-not $html) { break }

        $analyses = Extract-AnalysesFromPage $html
        if ($analyses.Count -eq 0) { break }

        foreach ($a in $analyses) { $all.Add($a) }
        Write-Host "      Pagina $page : $($analyses.Count) analize" -ForegroundColor DarkGray

        $nextPage = $page + 1
        if ($html -match "gotoPage\($nextPage") {
            $page++
            Start-Sleep -Milliseconds 300
        } else {
            break
        }
    }
    return $all
}

# ── 1. Fetch shop page, extract categories ─────────────────────────────────
Write-Host "`n=== Scraping Synevo.ro analize medicale ===" -ForegroundColor Cyan
Write-Host "`n[1/4] Extragere categorii din shop..." -ForegroundColor Yellow

$shopHtml = Get-WebPage "$baseUrl/shop/"
if (-not $shopHtml) {
    Write-Error "Nu s-a putut accesa pagina shop Synevo."
    exit 1
}

$categories = Extract-TopCategories $shopHtml
Write-Host "  Categorii gasite: $($categories.Count)" -ForegroundColor Green
foreach ($c in $categories) { Write-Host "    - $($c.Name)" -ForegroundColor DarkGray }

if ($categories.Count -eq 0) {
    Write-Error "Nu s-au gasit categorii. Structura site-ului s-a schimbat."
    exit 1
}

# ── 2. Pentru fiecare categorie, extrage subcategorii + analize ────────────
Write-Host "`n[2/4] Extragere analize din categorii/subcategorii..." -ForegroundColor Yellow

$allAnalyses = [System.Collections.Generic.List[PSCustomObject]]::new()
$seenSlugs = [System.Collections.Generic.HashSet[string]]::new()

foreach ($cat in $categories) {
    Write-Host "`n  === Categorie: $($cat.Name) ===" -ForegroundColor White
    $catHtml = Get-WebPage $cat.Url
    if (-not $catHtml) { continue }

    # Extrage subcategorii
    $subcats = Extract-Subcategories $catHtml $cat.Slug
    Write-Host "    Subcategorii: $($subcats.Count)" -ForegroundColor DarkGray

    if ($subcats.Count -gt 0) {
        foreach ($sub in $subcats) {
            Write-Host "    > Subcategorie: $($sub.Name)" -ForegroundColor Gray
            $subAnalyses = Extract-AllAnalyses $sub.Url
            foreach ($a in $subAnalyses) {
                if ($seenSlugs.Add($a.Slug)) {
                    $allAnalyses.Add([PSCustomObject]@{
                        Name        = $a.Name
                        Category    = $cat.Name
                        Subcategory = $sub.Name
                        Slug        = $a.Slug
                    })
                }
            }
            Start-Sleep -Milliseconds 300
        }
    }

    # Extrage si analize directe din categorie (pot exista si fara subcategorie)
    $directAnalyses = Extract-AllAnalyses $cat.Url
    foreach ($a in $directAnalyses) {
        if ($seenSlugs.Add($a.Slug)) {
            $allAnalyses.Add([PSCustomObject]@{
                Name        = $a.Name
                Category    = $cat.Name
                Subcategory = $null
                Slug        = $a.Slug
            })
        }
    }
}

Write-Host "`n  TOTAL analize unice extrase: $($allAnalyses.Count)" -ForegroundColor Green

if ($allAnalyses.Count -eq 0) {
    Write-Error "Nu s-au extras analize. Verificati structura site-ului."
    exit 1
}

# ── 3. Creare tabel in DB ──────────────────────────────────────────────────
Write-Host "`n[3/4] Creare tabel Analyses (daca nu exista)..." -ForegroundColor Yellow

$createSql = @"
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Analyses')
BEGIN
    CREATE TABLE dbo.Analyses (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        Name            NVARCHAR(500)    NOT NULL,
        Category        NVARCHAR(200)    NOT NULL,
        Subcategory     NVARCHAR(200)    NULL,
        Slug            NVARCHAR(500)    NULL,
        ImportedAt      DATETIME2(0)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Analyses PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX IX_Analyses_Category ON dbo.Analyses (Category);
    CREATE NONCLUSTERED INDEX IX_Analyses_Slug ON dbo.Analyses (Slug);
    PRINT 'Tabel Analyses creat.';
END
ELSE
    PRINT 'Tabel Analyses exista deja.';
"@

Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query $createSql -TrustServerCertificate
Write-Host "  Tabel OK." -ForegroundColor Green

# ── 4. Insert analize in DB ────────────────────────────────────────────────
Write-Host "`n[4/4] Inserare analize in DB..." -ForegroundColor Yellow

# Golim tabelul inainte de re-import
Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query "DELETE FROM dbo.Analyses;" -TrustServerCertificate
Write-Host "  Tabel golit pentru import fresh." -ForegroundColor DarkGray

$inserted = 0
$batchSize = 50
$batch = [System.Collections.Generic.List[string]]::new()

foreach ($a in $allAnalyses) {
    $nameEsc = $a.Name -replace "'", "''"
    $catEsc  = $a.Category -replace "'", "''"
    $subEsc  = if ($a.Subcategory) { "N'$($a.Subcategory -replace "'", "''")'" } else { "NULL" }
    $slugEsc = $a.Slug -replace "'", "''"

    $batch.Add("(N'$nameEsc', N'$catEsc', $subEsc, N'$slugEsc')")

    if ($batch.Count -ge $batchSize) {
        $values = $batch -join ",`n"
        $sql = "INSERT INTO dbo.Analyses (Name, Category, Subcategory, Slug) VALUES $values;"
        Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query $sql -TrustServerCertificate
        $inserted += $batch.Count
        $batch.Clear()
        Write-Host "  Inserate: $inserted..." -ForegroundColor DarkGray
    }
}

if ($batch.Count -gt 0) {
    $values = $batch -join ",`n"
    $sql = "INSERT INTO dbo.Analyses (Name, Category, Subcategory, Slug) VALUES $values;"
    Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query $sql -TrustServerCertificate
    $inserted += $batch.Count
}

Write-Host "`n=== FINALIZAT ===" -ForegroundColor Cyan
Write-Host "  Total analize inserate in DB: $inserted" -ForegroundColor Green

# Verificare finala
$count = (Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query "SELECT COUNT(*) AS Total FROM dbo.Analyses;" -TrustServerCertificate).Total
$catCount = (Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query "SELECT COUNT(DISTINCT Category) AS Total FROM dbo.Analyses;" -TrustServerCertificate).Total
$sample = Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query "SELECT TOP 5 Name, Category FROM dbo.Analyses ORDER BY Category, Name;" -TrustServerCertificate

Write-Host "  Verificare DB: $count analize in $catCount categorii" -ForegroundColor Green
Write-Host "`n  Exemple:" -ForegroundColor Yellow
$sample | Format-Table -AutoSize
