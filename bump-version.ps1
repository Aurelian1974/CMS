<#
.SYNOPSIS
    Bump semantic version pentru ValyanClinic.

    Mod implicit (end-of-day / -Eod):
      - Ia commiturile de azi (de la primul commit al zilei până la HEAD)
      - Bumpează patch automat
      - Inserează versiunea + commiturile în baza de date SQL
      - Face commit de release și tag Git

    Mod manual:
      - .\bump-version.ps1 -Part minor  → bumpează minor, fără SQL, fără tag
      - .\bump-version.ps1 -Part major -Tag → bumpează major, face tag

.PARAMETER Part
    Componenta de incrementat: major, minor sau patch (implicit: patch)

.PARAMETER Eod
    End-of-day: bumpează patch, salvează commiturile zilei în SQL, face commit + tag + push

.PARAMETER Tag
    Creează tag Git după bump (fără SQL logging)

.EXAMPLE
    .\bump-version.ps1 -Eod                  # folosire zilnică recomandată
    .\bump-version.ps1 -Part minor -Tag       # feature release
    .\bump-version.ps1 -Part major -Tag       # major release
    .\bump-version.ps1 -Part patch            # doar actualizează fișierele
#>

param(
    [ValidateSet("major", "minor", "patch")]
    [string]$Part = "patch",

    [switch]$Eod,   # End-of-day: commit-uri azi → SQL → tag

    [switch]$Tag    # Doar tag Git, fără SQL
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

# ══════════════════════════════════════════════════════════════
# 1. Citire versiune curentă
# ══════════════════════════════════════════════════════════════
$propsPath = Join-Path $Root "Directory.Build.props"
$propsXml  = [xml](Get-Content $propsPath -Raw)
$current   = $propsXml.Project.PropertyGroup.Version

if (-not $current) { Write-Error "Nu am găsit <Version> în Directory.Build.props"; exit 1 }

$parts = $current -split '\.'
if ($parts.Count -ne 3) { Write-Error "Versiunea '$current' nu este MAJOR.MINOR.PATCH"; exit 1 }

[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

# ══════════════════════════════════════════════════════════════
# 2. Determinare componentă de incrementat
# ══════════════════════════════════════════════════════════════
if ($Eod) { $Part = "patch" }   # -Eod forțează patch

switch ($Part) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++;             $patch = 0 }
    "patch" { $patch++ }
}

$newVersion = "$major.$minor.$patch"
Write-Host ""
Write-Host "  Versiune: $current → $newVersion" -ForegroundColor Cyan

# ══════════════════════════════════════════════════════════════
# 3. Actualizare fișiere versiune
# ══════════════════════════════════════════════════════════════
$propsXml.Project.PropertyGroup.Version = $newVersion
$propsXml.Save($propsPath)
Write-Host "  ✓ Directory.Build.props actualizat" -ForegroundColor Green

$pkgPath    = Join-Path $Root "client\package.json"
$pkgContent = Get-Content $pkgPath -Raw
$pkgContent = $pkgContent -replace '"version"\s*:\s*"[^"]+"', "`"version`": `"$newVersion`""
Set-Content -Path $pkgPath -Value $pkgContent -NoNewline
Write-Host "  ✓ package.json actualizat" -ForegroundColor Green

# ══════════════════════════════════════════════════════════════
# 4. Colectare commit-uri zilei (sau de la ultimul tag)
# ══════════════════════════════════════════════════════════════
function Get-CommitsSinceLastTag {
    Push-Location $Root
    try {
        $lastTag = git describe --tags --abbrev=0 --match "v*" 2>$null
        if ($LASTEXITCODE -eq 0 -and $lastTag) {
            $range = "$lastTag..HEAD"
            Write-Host "  → Commit-uri de la $lastTag până la HEAD" -ForegroundColor DarkGray
        } else {
            # Fără tag anterior: ia commit-urile de azi
            $today = (Get-Date).ToString("yyyy-MM-dd")
            $range = "--after=`"$today 00:00:00`""
            Write-Host "  → Commit-uri de azi ($today)" -ForegroundColor DarkGray
        }

        $log = git log $range --pretty=format:"%H|%s|%ci" --no-merges 2>$null
        if (-not $log) { return @() }

        return $log -split "`n" | Where-Object { $_ -ne "" } | ForEach-Object {
            $cols = $_ -split '\|', 3
            [PSCustomObject]@{
                Hash    = $cols[0].Trim().Substring(0, [Math]::Min(40, $cols[0].Trim().Length))
                Message = $cols[1].Trim()
                Date    = [datetime]::Parse($cols[2].Trim().Substring(0, 19))
            }
        }
    } finally {
        Pop-Location
    }
}

# ══════════════════════════════════════════════════════════════
# 5. Salvare în SQL (doar cu -Eod)
# ══════════════════════════════════════════════════════════════
function Save-ToSql {
    param(
        [string]$Version,
        [object[]]$Commits
    )

    # Citire connection string din appsettings.json
    $appsettings = Join-Path $Root "src\ValyanClinic.API\appsettings.json"
    $cfg = Get-Content $appsettings -Raw | ConvertFrom-Json
    $connectionString = $cfg.ConnectionStrings.DefaultConnection

    if (-not $connectionString) {
        Write-Warning "Nu am găsit DefaultConnection în appsettings.json — SQL logging omis."
        return
    }

    try {
        Add-Type -AssemblyName "System.Data" -ErrorAction SilentlyContinue

        $conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $conn.Open()

        # Insert release
        $cmdRelease = $conn.CreateCommand()
        $cmdRelease.CommandText = @"
INSERT INTO dbo.VersionReleases (Version, ReleasedAt, Notes)
OUTPUT INSERTED.Id
VALUES (@v, SYSDATETIME(), @notes)
"@
        $cmdRelease.Parameters.AddWithValue("@v", $Version) | Out-Null
        $notes = "$($Commits.Count) commit(uri) — $(Get-Date -Format 'dd.MM.yyyy')"
        $cmdRelease.Parameters.AddWithValue("@notes", $notes) | Out-Null
        $releaseId = $cmdRelease.ExecuteScalar()

        # Insert fiecare commit
        foreach ($c in $Commits) {
            $cmdCommit = $conn.CreateCommand()
            $cmdCommit.CommandText = @"
INSERT INTO dbo.VersionCommits (ReleaseId, CommitHash, CommitMessage, CommitDate)
VALUES (@rid, @hash, @msg, @date)
"@
            $cmdCommit.Parameters.AddWithValue("@rid",  $releaseId)         | Out-Null
            $cmdCommit.Parameters.AddWithValue("@hash", $c.Hash)            | Out-Null
            $cmdCommit.Parameters.AddWithValue("@msg",  $c.Message)         | Out-Null
            $cmdCommit.Parameters.AddWithValue("@date", $c.Date) | Out-Null
            $cmdCommit.ExecuteNonQuery() | Out-Null
        }

        $conn.Close()
        Write-Host "  ✓ $($Commits.Count) commit(uri) salvate în SQL (v$Version, releaseId=$releaseId)" -ForegroundColor Green
    } catch {
        Write-Warning "SQL logging eșuat: $_"
    }
}

# ══════════════════════════════════════════════════════════════
# 6. Git commit + tag
# ══════════════════════════════════════════════════════════════
function Invoke-GitRelease {
    param([string]$Version)
    Push-Location $Root
    try {
        git add Directory.Build.props client/package.json
        git commit -m "chore: release v$Version"
        git tag "v$Version"
        Write-Host "  ✓ Commit și tag v$Version create" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# ══════════════════════════════════════════════════════════════
# 7. Execuție principală
# ══════════════════════════════════════════════════════════════
if ($Eod) {
    Write-Host ""
    Write-Host "  [ End-of-Day Release ]" -ForegroundColor Magenta

    # Auto-commit orice fișiere staged care nu sunt încă commise
    Push-Location $Root
    $staged = git diff --cached --name-only 2>$null
    if ($staged) {
        $stagedList = ($staged -split "`n" | Where-Object { $_ -ne "" }) -join ", "
        $autoMsg = "feat: session work $(Get-Date -Format 'yyyy-MM-dd') — $($staged.Count) fisiere modificate"
        Write-Host "  ⚠ Există fișiere staged necommise — le commit automat:" -ForegroundColor Yellow
        $staged -split "`n" | Where-Object { $_ -ne "" } | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
        git commit -m $autoMsg | Out-Null
        Write-Host "  ✓ Committed: $autoMsg" -ForegroundColor Green
        Write-Host ""
    }
    Pop-Location

    $commits = Get-CommitsSinceLastTag

    if ($commits.Count -eq 0) {
        Write-Host "  ⚠ Nu există commit-uri noi față de ultimul tag. Release omis." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "  Commit-uri incluse in v${newVersion}:" -ForegroundColor White
    $commits | ForEach-Object { Write-Host "    · $($_.Message)  ($($_.Date.ToString('HH:mm')))" -ForegroundColor DarkGray }
    Write-Host ""

    Save-ToSql -Version $newVersion -Commits $commits
    Invoke-GitRelease -Version $newVersion

    Write-Host ""
    Write-Host "  Publică pe GitHub cu:" -ForegroundColor Yellow
    Write-Host "    git push && git push --tags" -ForegroundColor Yellow

} elseif ($Tag) {
    Invoke-GitRelease -Version $newVersion
    Write-Host ""
    Write-Host "  Publică pe GitHub cu:" -ForegroundColor Yellow
    Write-Host "    git push && git push --tags" -ForegroundColor Yellow

} else {
    Write-Host ""
    Write-Host "  Fișierele actualizate. Commit manual:" -ForegroundColor Yellow
    Write-Host "    git add Directory.Build.props client/package.json" -ForegroundColor Yellow
    Write-Host "    git commit -m `"chore: bump version to $newVersion`"" -ForegroundColor Yellow
    Write-Host "    git tag v$newVersion" -ForegroundColor Yellow
}

Write-Host ""
