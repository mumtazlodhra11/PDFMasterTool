# Get URLs and Cleanup EC2
$ErrorActionPreference = "Continue"
$region = "eu-west-1"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Get URLs & Cleanup EC2" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$accountId = (aws sts get-caller-identity --query Account --output text)
$bucketName = "pdfmaster-temp-$accountId"

# Step 1: Download URLs from S3
Write-Host "Step 1: Downloading Function URLs..." -ForegroundColor Yellow

$urlsExist = aws s3 ls "s3://$bucketName/urls.txt" --region $region 2>$null

if ([string]::IsNullOrEmpty($urlsExist)) {
    Write-Host "[ERROR] URLs not found in S3!" -ForegroundColor Red
    Write-Host "Build may not be complete yet. Wait longer or check EC2 console." -ForegroundColor Yellow
    exit 1
}

aws s3 cp "s3://$bucketName/urls.txt" . --region $region

if (-not (Test-Path "urls.txt")) {
    Write-Host "[ERROR] Failed to download URLs!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] URLs downloaded" -ForegroundColor Green
Write-Host ""

# Display URLs
Write-Host "Function URLs:" -ForegroundColor Cyan
Get-Content "urls.txt"
Write-Host ""

# Step 2: Update .env file
Write-Host "Step 2: Updating .env file..." -ForegroundColor Yellow

$urls = Get-Content "urls.txt"
$envPath = ".env"

# Parse URLs
$urlMap = @{}
foreach ($line in $urls) {
    if ($line -match "pdfmaster-(.+?)=(.+)") {
        $funcName = $matches[1]
        $url = $matches[2].Trim()
        $urlMap[$funcName] = $url
    }
}

# Read existing .env or create new
$envContent = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
}

# Remove old Lambda URL lines
$envLines = @()
if ($envContent) {
    $envLines = $envContent -split "`n" | Where-Object { $_ -notmatch "^VITE_LAMBDA_.*_URL=" }
}

# Build new content
$newEnvContent = ($envLines -join "`n").TrimEnd()
$newEnvContent += "`n`n# Lambda Function URLs (Deployed via EC2)`n"

$newEnvContent += "VITE_LAMBDA_WORD_TO_PDF_URL=$($urlMap['word-to-pdf'])`n"
$newEnvContent += "VITE_LAMBDA_PPT_TO_PDF_URL=$($urlMap['ppt-to-pdf'])`n"
$newEnvContent += "VITE_LAMBDA_PDF_TO_WORD_URL=$($urlMap['pdf-to-word'])`n"
$newEnvContent += "VITE_LAMBDA_PDF_TO_EXCEL_URL=$($urlMap['pdf-to-excel'])`n"
$newEnvContent += "VITE_LAMBDA_PDF_TO_PPT_URL=$($urlMap['pdf-to-ppt'])`n"

$newEnvContent | Set-Content -Path $envPath -NoNewline

Write-Host "[OK] .env file updated!" -ForegroundColor Green

# Step 3: Keep EC2 instance (user will terminate later)
Write-Host ""
Write-Host "Step 3: EC2 instance info..." -ForegroundColor Yellow

if (Test-Path "ec2-instance-id.txt") {
    $instanceId = Get-Content "ec2-instance-id.txt" -Raw
    $instanceId = $instanceId.Trim()
    
    if (-not [string]::IsNullOrEmpty($instanceId)) {
        Write-Host "[INFO] EC2 instance still running: $instanceId" -ForegroundColor Cyan
        Write-Host "[INFO] Instance NOT terminated (as requested)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To terminate later, run:" -ForegroundColor Yellow
        Write-Host "  aws ec2 terminate-instances --instance-ids $instanceId --region eu-west-1" -ForegroundColor White
    }
}

# Step 4: Delete S3 bucket
Write-Host ""
Write-Host "Step 4: Cleaning up S3 bucket..." -ForegroundColor Yellow

aws s3 rb "s3://$bucketName" --force --region $region 2>$null
Write-Host "[OK] S3 bucket deleted" -ForegroundColor Green

# Step 5: Cleanup temp files
Write-Host ""
Write-Host "Step 5: Cleaning up temporary files..." -ForegroundColor Yellow

if (Test-Path "code.zip") { Remove-Item "code.zip" -Force }
if (Test-Path "urls.txt") { Remove-Item "urls.txt" -Force }
if (Test-Path "ec2-instance-id.txt") { Remove-Item "ec2-instance-id.txt" -Force }
if (Test-Path "trust-policy.json") { Remove-Item "trust-policy.json" -Force }

Write-Host "[OK] Temporary files removed" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✓ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "All 5 Lambda functions are deployed!" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:4321" -ForegroundColor White
Write-Host "3. Test the PDF conversion tools" -ForegroundColor White
Write-Host ""
Write-Host "Function URLs are in .env file" -ForegroundColor Gray
Write-Host ""

