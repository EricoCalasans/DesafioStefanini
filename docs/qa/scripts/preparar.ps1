$ErrorActionPreference = 'Stop'
$qaRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$qaLocal = Join-Path (Split-Path -Parent $qaRoot) 'desafio-local/qa-20261022'
$qaEnvFile = Join-Path $qaLocal '.env'
New-Item -ItemType Directory -Path $qaLocal -Force | Out-Null
$qaVenv = Join-Path $qaLocal 'venv-documentacao'
$qaPython = Join-Path $qaVenv 'Scripts/python.exe'
if (-not (Test-Path -LiteralPath $qaPython)) {
    python -m venv $qaVenv
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar o ambiente Python isolado de documentação.' }
}
& $qaPython -m pip install --disable-pip-version-check --no-warn-script-location -r (Join-Path $qaRoot 'docs/validation/requirements-documentacao.txt')
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível instalar as dependências fixadas da documentação.' }
if (-not (Test-Path -LiteralPath $qaEnvFile)) {
    $qaSettings = [ordered]@{
        POSTGRES_PORT = '35432'; MONGO_PORT = '37017'; ORDERS_PORT = '33000'; CATALOG_PORT = '38080'
    }
    foreach ($qaKey in @('POSTGRES_ADMIN_PASSWORD', 'ORDERS_RUNTIME_PASSWORD', 'ORDERS_MIGRATOR_PASSWORD', 'MONGO_ROOT_PASSWORD', 'CATALOG_RUNTIME_PASSWORD', 'CATALOG_SEED_PASSWORD')) {
        $qaSettings[$qaKey] = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
    }
    $qaSettings.ORDERS_DATABASE_URL = "postgresql://orders_runtime:$($qaSettings.ORDERS_RUNTIME_PASSWORD)@postgres:5432/orders"
    $qaSettings.ORDERS_MIGRATION_DATABASE_URL = "postgresql://orders_migrator:$($qaSettings.ORDERS_MIGRATOR_PASSWORD)@postgres:5432/orders"
    $qaSettings.ORDERS_TEST_DATABASE_URL = "postgresql://orders_runtime:$($qaSettings.ORDERS_RUNTIME_PASSWORD)@postgres:5432/orders_test"
    $qaSettings.ORDERS_TEST_MIGRATION_DATABASE_URL = "postgresql://orders_migrator:$($qaSettings.ORDERS_MIGRATOR_PASSWORD)@postgres:5432/orders_test"
    $qaSettings.MONGO_ADMIN_URI = "mongodb://mongo_root:$($qaSettings.MONGO_ROOT_PASSWORD)@mongo:27017/admin?authSource=admin"
    $qaSettings.CATALOG_MONGODB_URI = "mongodb://catalog_runtime:$($qaSettings.CATALOG_RUNTIME_PASSWORD)@mongo:27017/catalog?authSource=catalog"
    $qaSettings.CATALOG_MONGODB_DATABASE = 'catalog'
    $qaSettings.DISCOUNT_ENABLED = 'true'; $qaSettings.DISCOUNT_RULE_ID = 'volume-v1'
    $qaSettings.DISCOUNT_MIN_SUBTOTAL_CENTS = '50000'; $qaSettings.DISCOUNT_RATE_BPS = '1000'
    [IO.File]::WriteAllLines($qaEnvFile, @($qaSettings.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }))
}
$qaOverride = @'
services:
  orders:
    image: coe-qa-orders:20261022
  orders-migrate:
    image: coe-qa-orders:20261022
  catalog:
    image: coe-qa-catalog:20261022
'@
[IO.File]::WriteAllText((Join-Path $qaLocal 'compose.qa.yaml'), $qaOverride)
Write-Output "QA isolado preparado em $qaLocal. Segredos preservados fora do Git."
