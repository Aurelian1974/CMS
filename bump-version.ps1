<#
.SYNOPSIS
    Bump semantic version (major/minor/patch) pentru ValyanClinic.
    Actualizează Directory.Build.props + client/package.json, face commit și tag Git.

.PARAMETER Part
    Componenta de incrementat: major, minor sau patch (implicit: patch)

.PARAMETER Tag
    Dacă este specificat, creează și tag-ul Git (ex: v0.1.1)

.EXAMPLE
    .\bump-version.ps1 -Part patch -Tag
    .\bump-version.ps1 -Part minor -Tag
    .\bump-version.ps1 -Part major -Tag
    .\bump-version.ps1 -Part patch          # doar actualizează fișierele, fără commit/tag
#>

param(
    [ValidateSet("major", "minor", "patch")]
    [string]$Part = "patch",

    [switch]$Tag
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

# ── 1. Citire versiune curentă din Directory.Build.props ──────────────────────
$propsPath = Join-Path $Root "Directory.Build.props"
$propsXml  = [xml](Get-Content $propsPath -Raw)
$current   = $propsXml.Project.PropertyGroup.Version

if (-not $current) {
    Write-Error "Nu am găsit <Version> în Directory.Build.props"
    exit 1
}

$parts = $current -split '\.'
if ($parts.Count -ne 3) {
    Write-Error "Versiunea '$current' nu este în format MAJOR.MINOR.PATCH"
    exit 1
}

[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

# ── 2. Incrementare ───────────────────────────────────────────────────────────
switch ($Part) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++;             $patch = 0 }
    "patch" { $patch++ }
}

$newVersion = "$major.$minor.$patch"
Write-Host "Versiune: $current → $newVersion" -ForegroundColor Cyan

# ── 3. Actualizare Directory.Build.props ─────────────────────────────────────
$propsXml.Project.PropertyGroup.Version = $newVersion
$propsXml.Save($propsPath)
Write-Host "✓ Directory.Build.props actualizat" -ForegroundColor Green

# ── 4. Actualizare client/package.json ───────────────────────────────────────
$pkgPath    = Join-Path $Root "client\package.json"
$pkgContent = Get-Content $pkgPath -Raw
$pkgContent = $pkgContent -replace '"version"\s*:\s*"[^"]+"', "`"version`": `"$newVersion`""
Set-Content -Path $pkgPath -Value $pkgContent -NoNewline
Write-Host "✓ package.json actualizat" -ForegroundColor Green

# ── 5. Commit + Tag Git (opțional) ───────────────────────────────────────────
if ($Tag) {
    Push-Location $Root
    try {
        git add Directory.Build.props client/package.json
        git commit -m "chore: bump version to $newVersion"
        git tag "v$newVersion"
        Write-Host "✓ Commit și tag v$newVersion create" -ForegroundColor Green
        Write-Host ""
        Write-Host "Pentru a publica pe GitHub:" -ForegroundColor Yellow
        Write-Host "  git push && git push --tags" -ForegroundColor Yellow
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host ""
    Write-Host "Fișierele au fost actualizate. Pentru a face commit manual:" -ForegroundColor Yellow
    Write-Host "  git add Directory.Build.props client/package.json" -ForegroundColor Yellow
    Write-Host "  git commit -m `"chore: bump version to $newVersion`"" -ForegroundColor Yellow
    Write-Host "  git tag v$newVersion" -ForegroundColor Yellow
}
