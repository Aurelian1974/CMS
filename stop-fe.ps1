<#
.SYNOPSIS
    Oprește procesul Frontend (node / vite dev server).
.EXAMPLE
    .\stop-fe.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Oprire Frontend ===" -ForegroundColor Cyan

$feProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*client*" }

if ($feProcs) {
    $feProcs | ForEach-Object {
        Write-Host "  Oprire proces node (PID $($_.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "  Frontend oprit." -ForegroundColor Green
} else {
    Write-Host "  Niciun proces frontend gasit." -ForegroundColor DarkGray
}

Write-Host ""
