param(
    [Parameter(Mandatory)][ValidateSet('orders', 'catalog')][string]$Service,
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9-]+$')][string]$Revision
)
$ErrorActionPreference = 'Stop'
$qaRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$qaLocal = Join-Path (Split-Path -Parent $qaRoot) 'desafio-local/qa-20261022'
$qaEvidence = Join-Path $qaRoot 'docs/qa/evidencias'
$qaArgs = @('compose', '-p', 'desafio-qa-20261022', '--env-file', (Join-Path $qaLocal '.env'), '-f', (Join-Path $qaRoot 'infra/compose.yaml'), '-f', (Join-Path $qaLocal 'compose.qa.yaml'))
docker @qaArgs up -d --build --wait --no-deps $Service 2>&1 | Tee-Object -FilePath (Join-Path $qaEvidence "$Revision-publicacao.txt")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$qaPort = if ($Service -eq 'orders') { 33000 } else { 38080 }
$qaUrl = "http://127.0.0.1:$qaPort/health/ready"
$qaReady = $false
$qaDeadline = [DateTime]::UtcNow.AddSeconds(30)
while ([DateTime]::UtcNow -lt $qaDeadline) {
    try {
        $qaResponse = Invoke-WebRequest -Uri $qaUrl -TimeoutSec 2 -SkipHttpErrorCheck
        if ($qaResponse.StatusCode -eq 200) { $qaReady = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 300
}
if (-not $qaReady) { throw "QA readiness não recuperou: $qaUrl" }
$qaImage = docker inspect "desafio-qa-20261022-$Service-1" --format '{{.Image}} {{.Created}}'
@("Service=$Service", "URL=$qaUrl", 'Ready=200', 'ProductionTraffic=none; loopback and isolated Compose project', $qaImage) | Tee-Object -FilePath (Join-Path $qaEvidence "$Revision-revisao.txt")
