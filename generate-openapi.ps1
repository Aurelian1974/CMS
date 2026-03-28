<#
.SYNOPSIS
    Generează schema OpenAPI din backend și tipurile TypeScript pentru frontend.

.DESCRIPTION
    1. Construiește ValyanClinic.API
    2. Rulează API-ul în modul export pentru a produce openapi/openapi-v1.json
    3. Rulează openapi-typescript pentru a genera client/src/api/generated/schema.d.ts

.EXAMPLE
    .\generate-openapi.ps1
    .\generate-openapi.ps1 -SkipTypeGen   # generează doar JSON-ul, fără TypeScript
#>
param(
    [switch]$SkipTypeGen,
    [string]$OutputDir = "openapi"
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$apiProject   = Join-Path $root "src\ValyanClinic.API\ValyanClinic.API.csproj"
$outputJson   = Join-Path $root "$OutputDir\openapi-v1.json"
$clientDir    = Join-Path $root "client"

Write-Host "=== Generare schema OpenAPI ===" -ForegroundColor Cyan

# 1. Build
Write-Host "1. Build ValyanClinic.API..." -ForegroundColor Yellow
dotnet build $apiProject -c Debug --nologo -q
if ($LASTEXITCODE -ne 0) { throw "Build eșuat." }

# 2. Export schema (rulare API în modul special, fără HTTP)
New-Item -ItemType Directory -Force -Path (Join-Path $root $OutputDir) | Out-Null

Write-Host "2. Export schema OpenAPI -> $outputJson" -ForegroundColor Yellow
dotnet run --project $apiProject --no-build -- --export-openapi --output $outputJson
if ($LASTEXITCODE -ne 0) { throw "Export schema eșuat." }

Write-Host "   Schema salvata: $outputJson" -ForegroundColor Green

if ($SkipTypeGen) {
    Write-Host "SkipTypeGen activat — generarea tipurilor TypeScript sarita." -ForegroundColor Gray
    exit 0
}

# 3. Generare tipuri TypeScript cu openapi-typescript
Write-Host "3. Generare tipuri TypeScript cu openapi-typescript..." -ForegroundColor Yellow

$schemaTs = Join-Path $clientDir "src\api\generated\schema.d.ts"
New-Item -ItemType Directory -Force -Path (Split-Path $schemaTs) | Out-Null

Push-Location $clientDir
try {
    npx openapi-typescript $outputJson --output $schemaTs
    if ($LASTEXITCODE -ne 0) { throw "openapi-typescript a esuat." }
    Write-Host "   Tipuri generate: $schemaTs" -ForegroundColor Green

    # 4. Verificare contract — tsc --noEmit prins desincronizarile la compile time
    Write-Host "4. Verificare contract API (tsc --noEmit)..." -ForegroundColor Yellow
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) { throw "Contract API incalcat — tipurile TypeScript nu mai sunt compatibile cu schema backend-ului. Ruleaza 'npm run build' in client/ pentru detalii." }
    Write-Host "   Contract OK — tipurile sunt compatibile cu schema backend-ului." -ForegroundColor Green
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Gata! ===" -ForegroundColor Cyan
Write-Host "Verifica diff-ul in git pentru openapi/openapi-v1.json si client/src/api/generated/schema.d.ts" -ForegroundColor White
