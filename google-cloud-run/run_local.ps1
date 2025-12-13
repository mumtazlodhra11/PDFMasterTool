# Local development server for Cloud Run
# Run this to test Excel to PDF conversion locally

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Local Cloud Run Server" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if LibreOffice is installed
try {
    $loVersion = libreoffice --version 2>&1
    Write-Host "✅ LibreOffice found: $loVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  LibreOffice not found in PATH" -ForegroundColor Yellow
    Write-Host "   LibreOffice is required for Excel to PDF conversion" -ForegroundColor Yellow
    Write-Host "   Install from: https://www.libreoffice.org/download/" -ForegroundColor Yellow
}

# Navigate to directory
Push-Location $PSScriptRoot

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "`n🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Set environment variables
$env:PORT = "9001"
$env:PYTHONUNBUFFERED = "1"

Write-Host "`n🚀 Starting server on http://localhost:9001" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Yellow

# Run the server
python app.py

# Deactivate virtual environment
deactivate

Pop-Location

