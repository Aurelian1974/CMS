<#
.SYNOPSIS
    Oprește complet aplicația ValyanClinic (Frontend + Backend).
.EXAMPLE
    .\stop-all.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Oprire ValyanClinic (FE + BE) ===" -ForegroundColor Cyan

# ── Backend (dotnet run / dotnet exec) ───────────────────────────────────────
$beProcs = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*ValyanClinic.API*" }

if ($beProcs) {
    $beProcs | ForEach-Object {
        Write-Host "  [BE] Oprire proces dotnet (PID $($_.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "  [BE] Backend oprit." -ForegroundColor Green
} else {
    Write-Host "  [BE] Niciun proces backend găsit." -ForegroundColor DarkGray
}

# ── Frontend (node / vite) ────────────────────────────────────────────────────
$feProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*client*" }

if ($feProcs) {
    $feProcs | ForEach-Object {
        Write-Host "  [FE] Oprire proces node (PID $($_.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "  [FE] Frontend oprit." -ForegroundColor Green
} else {
    Write-Host "  [FE] Niciun proces frontend găsit." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Aplicatia a fost oprita." -ForegroundColor Cyan
Write-Host ""
