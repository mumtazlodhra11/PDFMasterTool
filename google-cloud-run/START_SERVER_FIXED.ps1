# Fixed server start script with execution policy fix
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Local Cloud Run Server" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Fix execution policy
Write-Host "🔧 Fixing PowerShell execution policy..." -ForegroundColor Yellow
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force | Out-Null

# Navigate to correct directory
Push-Location $PSScriptRoot
Write-Host "📁 Directory: $(Get-Location)" -ForegroundColor Green

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "`n🔧 Activating virtual environment..." -ForegroundColor Yellow
& "$PSScriptRoot\venv\Scripts\Activate.ps1"

# Install dependencies if needed
Write-Host "`n📥 Checking dependencies..." -ForegroundColor Yellow
python -m pip install -q fastapi uvicorn python-multipart openpyxl 2>&1 | Out-Null

# Set environment variables
$env:PORT = "9001"
$env:PYTHONUNBUFFERED = "1"

Write-Host "`n🚀 Starting server on http://localhost:9001" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Yellow
Write-Host "   Test at: http://localhost:9001/health`n" -ForegroundColor Cyan

# Run the server
python app.py

# Cleanup
deactivate
Pop-Location


