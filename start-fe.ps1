<#
.SYNOPSIS
    Porneste Frontend-ul ValyanClinic (npm run dev) intr-o fereastra noua.
.EXAMPLE
    .\start-fe.ps1
#>

$ErrorActionPreference = "Stop"

$clientPath = Join-Path $PSScriptRoot "client"

Write-Host ""
Write-Host "=== Pornire Frontend ===" -ForegroundColor Cyan

# Verificam daca ruleaza deja
$already = Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*client*" }
if ($already) {
    Write-Host "  Frontend este deja pornit (PID $($already[0].Id))." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Set-Location '$clientPath'; npm run dev" `
    -WindowStyle Normal

Write-Host "  Frontend pornit in fereastra noua." -ForegroundColor Green
Write-Host "  URL: http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
