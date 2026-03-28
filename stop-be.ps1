<#
.SYNOPSIS
    Oprește procesul Backend (dotnet ValyanClinic.API).
.EXAMPLE
    .\stop-be.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Oprire Backend ===" -ForegroundColor Cyan

$beProcs = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*ValyanClinic.API*" }

if ($beProcs) {
    $beProcs | ForEach-Object {
        Write-Host "  Oprire proces dotnet (PID $($_.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "  Backend oprit." -ForegroundColor Green
} else {
    Write-Host "  Niciun proces backend gasit." -ForegroundColor DarkGray
}

Write-Host ""
