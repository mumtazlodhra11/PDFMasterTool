# Complete Lambda Deployment Script
$ErrorActionPreference = "Continue"
$region = "eu-west-1"

Write-Host "`n=== PDFMasterTool Lambda Deployment ===" -ForegroundColor Cyan

# Function names
$functions = @(
    "pdfmaster-word-to-pdf",
    "pdfmaster-ppt-to-pdf",
    "pdfmaster-pdf-to-word",
    "pdfmaster-pdf-to-excel",
    "pdfmaster-pdf-to-ppt"
)

$urls = @{}

# Step 1: Create Function URLs
Write-Host "`n📋 Creating Function URLs...`n" -ForegroundColor Cyan

foreach ($func in $functions) {
    Write-Host "Processing $func..." -ForegroundColor Yellow
    
    # Try to create Function URL
    $url = aws lambda create-function-url-config --function-name $func --auth-type NONE --cors "AllowOrigins=*,AllowMethods=POST OPTIONS,AllowHeaders=Content-Type" --region $region --query FunctionUrl --output text 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Created: $url" -ForegroundColor Green
        $urls[$func] = $url
    } else {
        # Try to get existing URL
        $existingUrl = aws lambda get-function-url-config --function-name $func --region $region --query FunctionUrl --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Already exists: $existingUrl" -ForegroundColor Green
            $urls[$func] = $existingUrl
        } else {
            Write-Host "❌ Failed for $func" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 1
}

# Step 2: Update .env file
Write-Host "`n📋 Updating .env file...`n" -ForegroundColor Cyan

$envPath = "D:\PDFMasterTool\.env"
$envContent = ""

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    Write-Host "✅ Found existing .env" -ForegroundColor Green
} else {
    Write-Host "📝 Creating new .env" -ForegroundColor Yellow
}

# Remove old Lambda URL lines
$envLines = @()
if ($envContent) {
    $envLines = $envContent -split "`n" | Where-Object { $_ -notmatch "^VITE_LAMBDA_.*_URL=" }
}

# Build new content
$newEnvContent = ($envLines -join "`n").TrimEnd()
$newEnvContent += "`n`n# Lambda Function URLs`n"

$lambdaVars = @{
    "VITE_LAMBDA_WORD_TO_PDF_URL" = $urls["pdfmaster-word-to-pdf"]
    "VITE_LAMBDA_PPT_TO_PDF_URL" = $urls["pdfmaster-ppt-to-pdf"]
    "VITE_LAMBDA_PDF_TO_WORD_URL" = $urls["pdfmaster-pdf-to-word"]
    "VITE_LAMBDA_PDF_TO_EXCEL_URL" = $urls["pdfmaster-pdf-to-excel"]
    "VITE_LAMBDA_PDF_TO_PPT_URL" = $urls["pdfmaster-pdf-to-ppt"]
}

foreach ($key in $lambdaVars.Keys) {
    $value = $lambdaVars[$key]
    if ($value) {
        $newEnvContent += "$key=$value`n"
        Write-Host "✅ Added $key" -ForegroundColor Green
    } else {
        $newEnvContent += "# $key=DEPLOYMENT_FAILED`n"
        Write-Host "⚠️  Skipped $key" -ForegroundColor Yellow
    }
}

$newEnvContent | Set-Content -Path $envPath -NoNewline

# Step 3: Summary
Write-Host "`n📋 Deployment Summary`n" -ForegroundColor Cyan

$successCount = ($urls.Values | Where-Object { $_ }).Count
Write-Host "Deployed: $successCount / 5`n" -ForegroundColor Green

foreach ($func in $functions) {
    if ($urls[$func]) {
        Write-Host "✅ $func" -ForegroundColor Green
        Write-Host "   $($urls[$func])" -ForegroundColor Gray
    } else {
        Write-Host "❌ $func - FAILED" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Done! Restart server: npm run dev`n" -ForegroundColor Green
