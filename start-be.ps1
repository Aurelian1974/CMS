<#
.SYNOPSIS
    Porneste Backend-ul ValyanClinic.API (dotnet run) intr-o fereastra noua.
.PARAMETER Env
    Mediul de executie (Development / Staging / Production). Default: Development.
.EXAMPLE
    .\start-be.ps1
    .\start-be.ps1 -Env Production
#>
param(
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Env = "Development"
)

$ErrorActionPreference = "Stop"

$projectPath = Join-Path $PSScriptRoot "src\ValyanClinic.API\ValyanClinic.API.csproj"

Write-Host ""
Write-Host "=== Pornire Backend ($Env) ===" -ForegroundColor Cyan

# Verificam daca ruleaza deja
$already = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*ValyanClinic.API*" }
if ($already) {
    Write-Host "  Backend este deja pornit (PID $($already[0].Id))." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

$args = "run --project `"$projectPath`""

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "`$env:ASPNETCORE_ENVIRONMENT='$Env'; dotnet $args" `
    -WindowStyle Normal

Write-Host "  Backend pornit in fereastra noua (env: $Env)." -ForegroundColor Green
Write-Host "  URL: https://localhost:7001  /  http://localhost:5001" -ForegroundColor DarkGray
Write-Host ""
