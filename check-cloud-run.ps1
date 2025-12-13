# Check Cloud Run Service Status
Write-Host "Checking Cloud Run Service Status..." -ForegroundColor Cyan

$ServiceUrl = "https://pdf-converter-607448904463.europe-west1.run.app"

Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Root endpoint accessible!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Root endpoint failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "`nIf health check fails, the service needs to be redeployed." -ForegroundColor Yellow
Write-Host "Run: cd google-cloud-run && powershell -File .\deploy.ps1" -ForegroundColor Yellow














