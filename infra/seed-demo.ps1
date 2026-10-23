$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDirectory = Join-Path (Split-Path -Parent $repoRoot) "$(Split-Path -Leaf $repoRoot)-local"
$envFile = Join-Path $localDirectory '.env'
$composeFile = Join-Path $repoRoot 'infra/compose.yaml'

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
    throw "Local credentials were not found at $envFile. Run .\infra\setup-local.ps1 first."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Start Docker Desktop and try again.'
}

Write-Output 'Applying the idempotent catalog demo seed...'
& docker compose --env-file $envFile --file $composeFile run --rm mongo-bootstrap
if ($LASTEXITCODE -ne 0) {
    throw 'Catalog demo seed failed. Check Docker Compose output above.'
}

Write-Output 'Catalog demo seed completed. Existing products and orders were preserved.'
