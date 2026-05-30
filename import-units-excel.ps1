<#
.SYNOPSIS
    Importă unitățile de măsură din Analize_cu_unitati.xlsx în dbo.Analyses.Unit
.DESCRIPTION
    Citește col E (Slug) și col G (Unit) din Excel.
    Filtrează valori non-unitate (complex, calitativ, gol etc.)
    UPDATE dbo.Analyses SET Unit = @unit WHERE Slug = @slug AND Unit IS NULL
.PARAMETER Server
    SQL Server instance (default: VALERIA)
.PARAMETER Database
    Database name (default: ValyanClinic)
.PARAMETER DryRun
    Dacă e setat, afișează ce ar face dar nu scrie în DB
.PARAMETER Overwrite
    Dacă e setat, suprascrie și unitățile deja existente
#>
param(
    [string]$Server   = "VALERIA",
    [string]$Database = "ValyanClinic",
    [switch]$DryRun,
    [switch]$Overwrite
)

$xlPath = "D:\Projects\CMS\src\ValyanClinic.Shared\InspirationModel\Analize_cu_unitati.xlsx"

# Valori care NU sunt unități de măsură reale
$nonUnits = @(
    "complex", "calitativ", "calitativa", "calitativ/cantitativ",
    "cantitativ", "semicantitativ", "semicantitativa",
    "pozitiv/negativ", "negativ/pozitiv", "da/nu",
    "prezent/absent", "absent/prezent",
    "titru", "clasa rast", "clasa", "index",
    "score", "scor", "procent", "raport",
    "", "n/a", "na", "-"
)

Write-Host "=== Import Unitati din Excel ===" -ForegroundColor Cyan
Write-Host "Fisier : $xlPath"
Write-Host "Server : $Server / $Database"
if ($DryRun)   { Write-Host "[DRY RUN - nu se scrie in DB]" -ForegroundColor Yellow }
if ($Overwrite){ Write-Host "[OVERWRITE - suprascrie unitati existente]" -ForegroundColor Yellow }
Write-Host ""

# 1. Citire Excel cu COM
Write-Host "Citire Excel..." -NoNewline
$excel = New-Object -ComObject Excel.Application
$excel.Visible       = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($xlPath)
$ws = $wb.Sheets.Item(1)
$totalRows = $ws.UsedRange.Rows.Count
Write-Host " $totalRows randuri gasite."

# 2. Parsare rânduri (skip row 1 = header)
$pairs = @{}   # slug -> unit
for ($r = 2; $r -le $totalRows; $r++) {
    $slug = ($ws.Cells.Item($r, 5).Text).Trim()   # col E
    $unit = ($ws.Cells.Item($r, 7).Text).Trim()   # col G

    if ($slug -eq "" -or $unit -eq "") { continue }

    # Filtrare valori non-unitate
    $unitLower = $unit.ToLower()
    $skip = $false
    foreach ($nu in $nonUnits) {
        if ($unitLower -eq $nu) { $skip = $true; break }
    }
    if ($skip) { continue }

    $pairs[$slug] = $unit
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "Perechi slug->unit valide: $($pairs.Count)"
Write-Host ""

# Afișare distribuție unități unice
$unitFreq = @{}
foreach ($u in $pairs.Values) {
    if (-not $unitFreq[$u]) { $unitFreq[$u] = 0 }
    $unitFreq[$u]++
}
Write-Host "Top 20 unitati:" -ForegroundColor Cyan
$unitFreq.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Host "  $($_.Value.ToString().PadLeft(4))  $($_.Key)"
}
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] Ar face UPDATE pentru $($pairs.Count) analize." -ForegroundColor Yellow
    $pairs.GetEnumerator() | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Key)  ->  $($_.Value)"
    }
    exit 0
}

# 3. UPDATE în DB
$updated = 0; $skipped = 0; $notFound = 0

foreach ($kv in $pairs.GetEnumerator()) {
    $slug = $kv.Key -replace "'", "''"   # escape SQL
    $unit = $kv.Value -replace "'", "''"

    $whereUnit = if ($Overwrite) { "" } else { " AND Unit IS NULL" }
    $sql = "UPDATE dbo.Analyses SET Unit = N'$unit' WHERE Slug = N'$slug'$whereUnit"

    try {
        $rows = Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query $sql -ErrorAction Stop
        # Verifică dacă slugul există
        $check = Invoke-Sqlcmd -ServerInstance $Server -Database $Database `
            -Query "SELECT COUNT(*) AS N FROM dbo.Analyses WHERE Slug = N'$slug'" -ErrorAction Stop
        if ($check.N -eq 0) {
            $notFound++
        } else {
            $updated++
        }
    } catch {
        Write-Host "EROARE la '$slug': $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host " RAPORT IMPORT" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host " Total perechi Excel : $($pairs.Count)"
Write-Host " Actualizate         : $updated"
Write-Host " Slug negasit in DB  : $notFound"
Write-Host "===============================" -ForegroundColor Green

# Verificare finala
$stat = Invoke-Sqlcmd -ServerInstance $Server -Database $Database `
    -Query "SELECT COUNT(*) AS Total, COUNT(Unit) AS CuUnit FROM dbo.Analyses WHERE Slug IS NOT NULL AND Slug <> ''"
Write-Host " Total analize       : $($stat.Total)"
Write-Host " Cu unitate in DB    : $($stat.CuUnit)"
$pct = [math]::Round($stat.CuUnit * 100.0 / $stat.Total, 1)
Write-Host " Procent             : $pct%" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Green
