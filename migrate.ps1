<#
.SYNOPSIS
    Rulează DbUp: migrări schema (tabele, seed) + obiectele DB (SP-uri, Views, Functions).

.DESCRIPTION
    Execută aplicația în mod CLI cu argumentul --migrate.
    Fazele sunt:
      1. Migrări schema (Scripts/Migrations/) — rulate o singură dată, tracked în SchemaVersions
      2. Obiecte DB   (Scripts/StoredProcedures/) — rulate la fiecare execuție (mereu la zi)

    Nu pornește web server-ul. Poate fi rulat oricând, inclusiv în CI/CD.

.PARAMETER Env
    Mediul de execuție (Development / Staging / Production). Default: Development.

.EXAMPLE
    .\migrate.ps1
    .\migrate.ps1 -Env Production
#>
param(
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Env = "Development"
)

$ErrorActionPreference = "Stop"
$env:ASPNETCORE_ENVIRONMENT = $Env

$projectPath = Join-Path $PSScriptRoot "src\ValyanClinic.API\ValyanClinic.API.csproj"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DbUp Migration  [$Env]" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

dotnet run --project $projectPath -- --migrate

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "Migrare finalizata cu succes." -ForegroundColor Green
} else {
    Write-Host "Migrarea a esuat (exit code: $exitCode)." -ForegroundColor Red
    exit $exitCode
}
