<#
.SYNOPSIS
    Creează conturile de test per rol folosite de e2e/specs/dashboard-roles.spec.ts.

.DESCRIPTION
    Doar pentru baze de dev/test. Idempotent. Parola = parola contului admin.

.EXAMPLE
    .\e2e\seed\seed-role-users.ps1 -Server VALERIA
#>
param(
    [string]$Server   = $(if ($env:VALYAN_SQL_SERVER) { $env:VALYAN_SQL_SERVER } else { 'localhost' }),
    [string]$Database = 'ValyanClinic'
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'seed-role-users.sql'

sqlcmd -S $Server -d $Database -E -C -I -b -f 65001 -i $script
if ($LASTEXITCODE -ne 0) { throw "Seed E2E eșuat (exit $LASTEXITCODE)." }

Write-Host 'Seed E2E aplicat.' -ForegroundColor Green
