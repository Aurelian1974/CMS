<#
.SYNOPSIS
    Porneste complet aplicatia ValyanClinic (Backend + Frontend) in ferestre separate.
.PARAMETER Env
    Mediul de executie pentru Backend (Development / Staging / Production). Default: Development.
.EXAMPLE
    .\start-all.ps1
    .\start-all.ps1 -Env Production
#>
param(
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Env = "Development"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "=== Pornire ValyanClinic (BE + FE) ===" -ForegroundColor Cyan
Write-Host ""

& "$root\start-be.ps1" -Env $Env

# Mica intarziere pentru a nu suprapune ferestrele
Start-Sleep -Milliseconds 500

& "$root\start-fe.ps1"

Write-Host "Aplicatia a fost pornita." -ForegroundColor Cyan
Write-Host "  Backend : https://localhost:7001" -ForegroundColor DarkGray
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
