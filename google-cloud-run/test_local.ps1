# Test Excel to PDF conversion locally
# Make sure the server is running first (run run_local.ps1)

param(
    [string]$ExcelFile = "sample.xlsx"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Excel to PDF Conversion" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if file exists
if (-not (Test-Path $ExcelFile)) {
    Write-Host "❌ File not found: $ExcelFile" -ForegroundColor Red
    Write-Host "`nUsage: .\test_local.ps1 -ExcelFile path/to/file.xlsx" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Testing file: $ExcelFile" -ForegroundColor Yellow
Write-Host "🌐 Server: http://localhost:9001`n" -ForegroundColor Yellow

# Test the conversion
python test_local.py $ExcelFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Test completed! Check the generated PDF." -ForegroundColor Green
} else {
    Write-Host "`n❌ Test failed!" -ForegroundColor Red
}

