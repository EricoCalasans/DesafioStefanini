$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$localDataDirectory = Join-Path (Split-Path -Parent $repoRoot) "$(Split-Path -Leaf $repoRoot)-local"
$envFile = Join-Path $localDataDirectory '.env'
$composeFile = Join-Path $repoRoot 'infra\compose.yaml'
if (-not (Test-Path -LiteralPath $envFile)) {
    throw 'Local credentials are missing. Run infra/setup-local.ps1 first.'
}

foreach ($entry in Get-Content -LiteralPath $envFile) {
    if ($entry -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}

if (-not $env:MONGO_ADMIN_URI) { throw 'MONGO_ADMIN_URI is required.' }

function Invoke-MongoEval([string] $JavaScript) {
    $output = & docker compose --env-file $envFile -f $composeFile exec -T mongo mongosh $env:MONGO_ADMIN_URI --quiet --eval $JavaScript
    if ($LASTEXITCODE -ne 0) { throw 'MongoDB diagnostic command failed.' }
    return ($output -join "`n").Trim()
}

$statusText = Invoke-MongoEval 'print(JSON.stringify(db.getSiblingDB("catalog").getProfilingStatus()))'
$profileStatus = $statusText | ConvertFrom-Json
if ($profileStatus.was -ne 0 -or $profileStatus.filter) {
    throw 'Refusing to change profiling settings because profiling is already active or filtered.'
}
$restoreLevel = [int]$profileStatus.was
$restoreSlowMs = [int]$profileStatus.slowms
$restoreSampleRate = [double]$profileStatus.sampleRate
$profilingEnabled = $false

try {
    [void](Invoke-MongoEval 'db.getSiblingDB("catalog").setProfilingLevel(2, { slowms: 0, sampleRate: 1 }); print("profiling enabled")')
    $profilingEnabled = $true
    $countCommand = 'print(db.getSiblingDB("catalog").system.profile.countDocuments({ "command.find": "products" }))'
    $measurements = @()

    foreach ($itemCount in @(1, 10, 100)) {
        $ids = @()
        for ($index = 0; $index -lt $itemCount; $index++) {
            $ids += [Guid]::NewGuid().ToString('D').ToLowerInvariant()
        }

        $before = [int](Invoke-MongoEval $countCommand)
        $payload = @{ productIds = $ids } | ConvertTo-Json -Depth 4 -Compress
        $response = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8080/api/v1/products/query' -ContentType 'application/json' -Body $payload
        $after = [int](Invoke-MongoEval $countCommand)
        $commandCount = $after - $before
        if ($commandCount -ne 1) {
            throw "Expected one Mongo find command for $itemCount requested IDs; observed $commandCount."
        }
        if (@($response.missingProductIds).Count -ne $itemCount) {
            throw "Catalog returned an unexpected result for a batch of $itemCount IDs."
        }
        $measurements += [pscustomobject]@{
            requestedIds = $itemCount
            mongoFindCommands = $commandCount
            found = @($response.products).Count
            missing = @($response.missingProductIds).Count
        }
    }

    $batchIds = '["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]'
    $batchExplainScript = 'const d=db.getSiblingDB("catalog");const e=d.products.find({_id:{$in:' + $batchIds + '}}).explain("executionStats");print(JSON.stringify({winningPlan:e.queryPlanner.winningPlan,nReturned:e.executionStats.nReturned,docsExamined:e.executionStats.totalDocsExamined,keysExamined:e.executionStats.totalKeysExamined}));'
    $pageExplainScript = 'const d=db.getSiblingDB("catalog");const e=d.products.find({active:true}).sort({_id:1}).skip(0).limit(20).explain("executionStats");print(JSON.stringify({winningPlan:e.queryPlanner.winningPlan,nReturned:e.executionStats.nReturned,docsExamined:e.executionStats.totalDocsExamined,keysExamined:e.executionStats.totalKeysExamined}));'
    $batchExplain = (Invoke-MongoEval $batchExplainScript) | ConvertFrom-Json
    $pageExplain = (Invoke-MongoEval $pageExplainScript) | ConvertFrom-Json
    $batchPlanJson = ConvertTo-Json -InputObject $batchExplain.winningPlan -Depth 30 -Compress
    $pagePlanJson = ConvertTo-Json -InputObject $pageExplain.winningPlan -Depth 30 -Compress
    if ($batchPlanJson -notmatch '"indexName":"_id_"') {
        throw 'The batch query plan did not use the MongoDB _id_ index.'
    }
    if ($pagePlanJson -notmatch '"indexName":"ix_products_active_id"') {
        throw 'The active page plan did not use ix_products_active_id.'
    }

    Write-Output 'MongoDB batch-command counts:'
    $measurements | Format-Table -AutoSize | Out-String | Write-Output
    Write-Output "Batch explain: $($batchExplain | ConvertTo-Json -Depth 30 -Compress)"
    Write-Output "Page explain: $($pageExplain | ConvertTo-Json -Depth 30 -Compress)"
}
finally {
    if ($profilingEnabled) {
        $restoreScript = "db.getSiblingDB('catalog').setProfilingLevel($restoreLevel, { slowms: $restoreSlowMs, sampleRate: $restoreSampleRate }); print('profiling restored')"
        [void](Invoke-MongoEval $restoreScript)
        Write-Output "MongoDB profiling restored to level $restoreLevel."
    }
}
