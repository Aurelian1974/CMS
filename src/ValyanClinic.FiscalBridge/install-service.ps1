#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Publică și instalează ValyanClinic Fiscal Bridge ca serviciu Windows pe PC-ul de la recepție.

.DESCRIPTION
    1. Publică bridge-ul în -InstallDir (self-contained nu e necesar dacă .NET 10 e instalat).
    2. Creează / actualizează serviciul Windows „ValyanClinicFiscalBridge" (pornire automată).
    3. Afișează token-ul de asociere — se introduce o singură dată în ValyanClinic → Încasări → Casa de marcat.

    Înainte de primul start editați appsettings.json din -InstallDir:
      Printer:Driver = "Datecs", PortName (ex: COM3), BaudRate, OperatorCode, TillNumber
      Bridge:AllowedOrigins = adresa aplicației ValyanClinic (ex: http://server-cabinet:5173)
    Parola operatorului se setează criptat: ValyanClinic.FiscalBridge.exe --set-operator-password

.EXAMPLE
    .\install-service.ps1 -InstallDir "C:\ValyanClinic\FiscalBridge"
#>
param(
    [string]$InstallDir = "C:\ValyanClinic\FiscalBridge",
    [string]$ServiceName = "ValyanClinicFiscalBridge"
)

$ErrorActionPreference = "Stop"
$project = Join-Path $PSScriptRoot "ValyanClinic.FiscalBridge.csproj"

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing -and $existing.Status -eq "Running") {
    Write-Host "Opresc serviciul existent..."
    Stop-Service -Name $ServiceName
}

# appsettings.json configurat pe PC nu se suprascrie la actualizare
$settings = Join-Path $InstallDir "appsettings.json"
$backup = $null
if (Test-Path $settings) {
    $backup = "$settings.bak"
    Copy-Item $settings $backup -Force
}

Write-Host "Public în $InstallDir ..."
dotnet publish $project -c Release -o $InstallDir --nologo
if ($LASTEXITCODE -ne 0) { throw "dotnet publish a eșuat." }

if ($backup) { Move-Item $backup $settings -Force }

$exe = Join-Path $InstallDir "ValyanClinic.FiscalBridge.exe"
if (-not $existing) {
    New-Service -Name $ServiceName -BinaryPathName "`"$exe`"" -DisplayName "ValyanClinic Fiscal Bridge" `
        -Description "Tipărire bonuri fiscale pentru ValyanClinic (ascultă doar pe 127.0.0.1)." -StartupType Automatic | Out-Null
    # Repornire automată după o cădere
    sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/5000/restart/30000 | Out-Null
}

Start-Service -Name $ServiceName
Write-Host "Serviciul rulează. Token de asociere:"
& $exe --show-token
