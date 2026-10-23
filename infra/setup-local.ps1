$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDataDirectory = Join-Path (Split-Path -Parent $repoRoot) "$(Split-Path -Leaf $repoRoot)-local"
$envFile = Join-Path $localDataDirectory '.env'
$composeFile = Join-Path $repoRoot 'infra/compose.yaml'

if (Test-Path -LiteralPath $envFile) {
    Write-Output "Local credentials already exist at $envFile; keeping them to preserve access to existing database volumes."
    return
}

New-Item -ItemType Directory -Path $localDataDirectory -Force | Out-Null

function New-LocalSecret {
    return [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
}

$postgresAdmin = New-LocalSecret
$ordersRuntime = New-LocalSecret
$ordersMigrator = New-LocalSecret
$mongoRoot = New-LocalSecret
$catalogRuntime = New-LocalSecret
$catalogSeed = New-LocalSecret

$content = @(
    'POSTGRES_PORT=5432',
    'MONGO_PORT=27017',
    'ORDERS_PORT=3000',
    'CATALOG_PORT=8080',
    'EVALUATOR_PORT=4173',
    "POSTGRES_ADMIN_PASSWORD=$postgresAdmin",
    "ORDERS_RUNTIME_PASSWORD=$ordersRuntime",
    "ORDERS_MIGRATOR_PASSWORD=$ordersMigrator",
    "MONGO_ROOT_PASSWORD=$mongoRoot",
    "CATALOG_RUNTIME_PASSWORD=$catalogRuntime",
    "CATALOG_SEED_PASSWORD=$catalogSeed",
    "ORDERS_DATABASE_URL=postgresql://orders_runtime:$ordersRuntime@postgres:5432/orders",
    "ORDERS_MIGRATION_DATABASE_URL=postgresql://orders_migrator:$ordersMigrator@postgres:5432/orders",
    "ORDERS_TEST_DATABASE_URL=postgresql://orders_runtime:$ordersRuntime@postgres:5432/orders_test",
    "ORDERS_TEST_MIGRATION_DATABASE_URL=postgresql://orders_migrator:$ordersMigrator@postgres:5432/orders_test",
    "CATALOG_MONGODB_URI=mongodb://catalog_runtime:$catalogRuntime@mongo:27017/catalog?authSource=catalog",
    'CATALOG_MONGODB_DATABASE=catalog',
    "MONGO_ADMIN_URI=mongodb://mongo_root:$mongoRoot@mongo:27017/admin?authSource=admin",
    'CATALOG_URL=http://catalog:8080',
    'DISCOUNT_ENABLED=true',
    'DISCOUNT_RULE_ID=volume-v1',
    'DISCOUNT_MIN_SUBTOTAL_CENTS=50000',
    'DISCOUNT_RATE_BPS=1000'
)

[System.IO.File]::WriteAllText($envFile, ($content -join [Environment]::NewLine) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Output "Local development secrets were generated outside the repository at $envFile."
Write-Output ('Start the databases, APIs, and evaluator with: docker compose --env-file "{0}" -f "{1}" up -d --build --wait' -f $envFile, $composeFile)
