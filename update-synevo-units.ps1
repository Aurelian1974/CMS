param(
    [string]$Server   = "VALERIA",
    [string]$Database = "ValyanClinic",
    [int]$DelayMs     = 500,
    [bool]$OnlyNull   = $true,
    [int]$TopN        = 0,
    [switch]$DryRun
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
$BaseUrl   = "https://www.synevo.ro/shop"
$UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
$MaxRetries = 3

function Get-WebPage([string]$Url) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UserAgent $UserAgent -UseBasicParsing -TimeoutSec 30
            return $r.Content
        } catch {
            $code = 0
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
            if ($code -eq 404) { Write-Warning "  404: $Url"; return $null }
            if ($i -lt $MaxRetries) { Start-Sleep -Milliseconds 2000 } else { return $null }
        }
    }
    return $null
}

function Extract-Unit([string]$Html) {
    if (-not $Html) { return $null }

    # Decodare JSON escapes (\uXXXX si \/) pentru a lucra cu text lizibil
    $h = [regex]::Replace($Html, '\\u([0-9a-fA-F]{4})', {
        [char][convert]::ToInt32($args[0].Groups[1].Value, 16)
    })
    $h = $h -replace '\\/', '/'

    # Pattern 1: Valori (unit) — in header de tabel, ex: Valori (mg/dL)
    $m = [regex]::Match($h, 'Valori\s*\(([^)<&]{1,30})\)')
    if ($m.Success) { return $m.Groups[1].Value.Trim() }

    # Pattern 2: interval numeric + UM dupa sectiunea "Valori/Intervale de referinta"
    # Unele pagini folosesc "Valori de referinta", altele "Intervale de referinta"
    $vidx = $h.IndexOf("Valori de referin")
    if ($vidx -lt 0) { $vidx = $h.IndexOf("Intervale de referin") }
    if ($vidx -ge 0) {
        $sec = $h.Substring($vidx, [Math]::Min(900, $h.Length - $vidx))
        # Converteste entitati HTML la caractere reale (pastram < > pentru pattern)
        # IMPORTANT: stergem tagurile HTML-encoded (&lt;tagname...&gt;) INAINTE de conversie
        # altfel '&lt; 0,16' devine '< 0,16' si e confundat cu un tag HTML
        $sec = [regex]::Replace($sec, '&lt;[a-zA-Z/!][^&]*?&gt;', ' ')
        # Sterge taguri HTML reale (<tagname>)
        $sec = [regex]::Replace($sec, '<[a-zA-Z/!][^>]{0,80}>', ' ')
        # Acum convertim operatorii de comparatie (nu mai sunt ambigui)
        $sec = $sec -replace '&lt;', '<' -replace '&gt;', '>' -replace '&amp;', '&' -replace '&nbsp;', ' ' -replace '&apos;', "'" -replace '&#160;', ' '
        # Sterge entitati HTML ramase
        $sec = [regex]::Replace($sec, '&[a-zA-Z#0-9]{2,8};', ' ')
        # Normalizeaza spatii
        $sec = [regex]::Replace($sec, '\s+', ' ').Trim()

        # Cauta toate aparitiile de: numar – numar CUVANT sau < numar CUVANT
        # Returneaza primul CUVANT care arata ca o UM medicala (contine / sau e simbol scurt)
        $allM = [regex]::Matches($sec, '(?:\d+[.,]?\d*\s*[–\-]\s*\d+[.,]?\d*|[<>]\s*\d+[.,]?\d*)\s+([a-zA-Zµ%][a-zA-Z0-9µ%/·³⁶\^\.]{0,20})')
        foreach ($m2 in $allM) {
            $u = $m2.Groups[1].Value.Trim()
            # Sterge sufixe numerice de citatie dupa litere (ex: pg/mL1. -> pg/mL)
            # dar pastreaza cifre dupa '/' (ex: mg/24 NU devine mg/)
            $u = [regex]::Replace($u, '([a-zA-Zµ%])[\d\.]+$', '$1').TrimEnd('.')
            # Completeaza unitati trunchiate: mg/24 -> mg/24h (look-ahead dupa match)
            if ($u -match '/\d+$') {
                $afterMatch = $sec.Substring($m2.Index + $m2.Length).TrimStart()
                if ($afterMatch -match '^([a-zA-Z]{1,4})\b') { $u = $u + $Matches[1] }
            }
            # UM medicala valida: contine '/' (mg/dL, nmol/L etc.) sau e simbol simplu
            if ($u -match '[/]' -and $u.Length -ge 2 -and $u.Length -le 20) { return $u }
            if ($u -match '^(%|U|g|L|Da|kDa|IU|mIU|mU|mol|mmol|mOsm)$') { return $u }
        }
    }

    return $null
}

function Invoke-Sql([string]$Srv, [string]$Db, [string]$Qry) {
    return Invoke-Sqlcmd -ServerInstance $Srv -Database $Db -Query $Qry -OutputSqlErrors $true
}

Write-Host "============================="
Write-Host " UPDATE SYNEVO UNITS"
if ($DryRun) { Write-Host " ** DRY RUN **" }
Write-Host " Server: $Server  DB: $Database"
Write-Host "============================="

$whereClause = if ($OnlyNull) { "WHERE Unit IS NULL AND Slug IS NOT NULL AND Slug <> ''" } else { "WHERE Slug IS NOT NULL AND Slug <> ''" }
$topClause   = if ($TopN -gt 0) { "TOP $TopN" } else { "" }
$selectSql   = "SELECT $topClause Id, Name, Slug FROM dbo.Analyses $whereClause ORDER BY Name"

Write-Host "Citire analize..." -NoNewline
$rows = Invoke-Sql $Server $Database $selectSql
Write-Host " $($rows.Count) analize"

$total=0; $updated=0; $notfound=0; $skipped=0; $errors=0

foreach ($row in $rows) {
    $total++
    $slug = $row.Slug.ToString().Trim()
    $name = $row.Name.ToString().Trim()
    $url  = "$BaseUrl/$slug/"
    $pct  = [int](($total / $rows.Count) * 100)
    Write-Host "[$total/$($rows.Count) $pct%] $name" -NoNewline

    $html = Get-WebPage $url
    if ($null -eq $html) { Write-Host " -> EROARE/404" -ForegroundColor Red; $notfound++; if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }; continue }

    $unit = Extract-Unit $html
    if (-not $unit) { Write-Host " -> UM negasita" -ForegroundColor DarkYellow; $skipped++; if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }; continue }

    Write-Host " -> '$unit'" -ForegroundColor Green

    if (-not $DryRun) {
        try {
            $us = $unit -replace "'", "''"
            $ss = $slug -replace "'", "''"
            $sql = "UPDATE dbo.Analyses SET Unit = N'" + $us + "' WHERE Slug = N'" + $ss + "' AND Unit IS NULL"
            Invoke-Sql $Server $Database $sql | Out-Null
            $updated++
        } catch {
            Write-Warning "  BD eroare: $($_.Exception.Message)"
            $errors++
        }
    } else { $updated++ }

    if ($DelayMs -gt 0 -and $total -lt $rows.Count) { Start-Sleep -Milliseconds $DelayMs }
}

Write-Host ""
Write-Host "============================="
Write-Host " RAPORT"
Write-Host " Total         : $total"
Write-Host " Actualizate   : $updated"
Write-Host " UM negasita   : $skipped"
Write-Host " 404/Eroare    : $notfound"
Write-Host " Erori BD      : $errors"
if ($DryRun) { Write-Host " ** BD NEMODIFICATA **" }
Write-Host "============================="
