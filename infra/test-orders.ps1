$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDataDirectory = Join-Path (Split-Path -Parent $repoRoot) "$(Split-Path -Leaf $repoRoot)-local"
$envFile = Join-Path $localDataDirectory '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Local credentials are missing. Run infra/setup-local.ps1 first."
}

foreach ($entry in Get-Content -LiteralPath $envFile) {
    if ($entry -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}

if (-not $env:ORDERS_TEST_DATABASE_URL) {
    $env:ORDERS_TEST_DATABASE_URL = $env:ORDERS_DATABASE_URL -replace '/orders(?=\?|$)', '/orders_test'
}
if (-not $env:ORDERS_TEST_MIGRATION_DATABASE_URL) {
    $env:ORDERS_TEST_MIGRATION_DATABASE_URL = $env:ORDERS_MIGRATION_DATABASE_URL -replace '/orders(?=\?|$)', '/orders_test'
}
$env:ORDERS_TEST_DATABASE_URL = $env:ORDERS_TEST_DATABASE_URL -replace '@postgres:', '@127.0.0.1:'
$env:ORDERS_TEST_MIGRATION_DATABASE_URL = $env:ORDERS_TEST_MIGRATION_DATABASE_URL -replace '@postgres:', '@127.0.0.1:'
$env:ORDERS_DATABASE_URL = $env:ORDERS_DATABASE_URL -replace '@postgres:', '@127.0.0.1:'

Push-Location (Join-Path $repoRoot 'pedidos-typescript')
try {
    npm run test:integration
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
