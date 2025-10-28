# PDFMasterTool Lambda Deployment Script
$ErrorActionPreference = "Continue"
$region = "eu-west-1"
$accountId = (aws sts get-caller-identity --query Account --output text)

Write-Host ""
Write-Host "=== PDFMasterTool Complete Deployment ===" -ForegroundColor Cyan
Write-Host "Region: $region" -ForegroundColor Yellow
Write-Host "Account: $accountId" -ForegroundColor Yellow
Write-Host ""

# Wait for Docker
Write-Host "Step 1: Waiting for Docker..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts) {
    $result = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is running!" -ForegroundColor Green
        $dockerReady = $true
        break
    }
    
    $attempt++
    Write-Host "   Waiting... attempt $attempt/$maxAttempts" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $dockerReady) {
    Write-Host "[ERROR] Docker Desktop failed to start!" -ForegroundColor Red
    exit 1
}

# ECR Login
Write-Host ""
Write-Host "Step 2: ECR Login..." -ForegroundColor Cyan

aws ecr get-login-password --region $region | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$region.amazonaws.com"

Write-Host "[OK] ECR login successful!" -ForegroundColor Green

# Build and Push Images
Write-Host ""
Write-Host "Step 3: Building Docker images (30-40 minutes)..." -ForegroundColor Cyan

$functions = @("word-to-pdf", "ppt-to-pdf", "pdf-to-word", "pdf-to-excel", "pdf-to-ppt")
$repos = @("pdfmastertool-word-to-pdf", "pdfmastertool-ppt-to-pdf", "pdfmastertool-pdf-to-word", "pdfmastertool-pdf-to-excel", "pdfmastertool-pdf-to-ppt")
$imageUris = @{}

for ($i = 0; $i -lt $functions.Length; $i++) {
    $name = $functions[$i]
    $repo = $repos[$i]
    $imageUri = "$accountId.dkr.ecr.$region.amazonaws.com/${repo}:latest"
    
    Write-Host ""
    Write-Host "Building $name..." -ForegroundColor Yellow
    
    $dockerfilePath = "aws\lambda-containers\$name\Dockerfile"
    $contextPath = "aws\lambda-containers\$name"
    
    docker build -t $repo -f $dockerfilePath $contextPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed for $name" -ForegroundColor Red
        continue
    }
    
    Write-Host "[OK] Built $name" -ForegroundColor Green
    
    docker tag "${repo}:latest" $imageUri
    
    Write-Host "Pushing $name to ECR..." -ForegroundColor Yellow
    docker push $imageUri
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Push failed for $name" -ForegroundColor Red
        continue
    }
    
    Write-Host "[OK] Pushed $name" -ForegroundColor Green
    $imageUris[$name] = $imageUri
}

Write-Host ""
Write-Host "[OK] Images built and pushed: $($imageUris.Count)/5" -ForegroundColor Green

# Delete old function
Write-Host ""
Write-Host "Step 4: Cleaning old word-to-pdf function..." -ForegroundColor Cyan
aws lambda delete-function --function-name pdfmaster-word-to-pdf --region $region 2>&1 | Out-Null
Write-Host "[OK] Cleaned up" -ForegroundColor Green
Start-Sleep -Seconds 5

# Create Lambda Functions
Write-Host ""
Write-Host "Step 5: Creating Lambda functions..." -ForegroundColor Cyan

$roleName = "PDFMasterLambdaRole"
$roleArn = (aws iam get-role --role-name $roleName --query "Role.Arn" --output text)

for ($i = 0; $i -lt $functions.Length; $i++) {
    $name = $functions[$i]
    $lambdaName = "pdfmaster-$name"
    
    if (-not $imageUris.ContainsKey($name)) {
        Write-Host "[SKIP] $name (no image)" -ForegroundColor Yellow
        continue
    }
    
    $imageUri = $imageUris[$name]
    
    Write-Host "Creating $lambdaName..." -ForegroundColor Yellow
    
    aws lambda create-function --function-name $lambdaName --package-type Image --code ImageUri=$imageUri --role $roleArn --timeout 300 --memory-size 2048 --region $region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Created $lambdaName" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed $lambdaName" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 3
}

# Create Function URLs
Write-Host ""
Write-Host "Step 6: Creating Function URLs..." -ForegroundColor Cyan

$functionUrls = @{}

for ($i = 0; $i -lt $functions.Length; $i++) {
    $name = $functions[$i]
    $lambdaName = "pdfmaster-$name"
    
    Write-Host "Creating URL for $lambdaName..." -ForegroundColor Yellow
    
    $url = aws lambda create-function-url-config --function-name $lambdaName --auth-type NONE --cors AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type --region $region --query FunctionUrl --output text 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $url" -ForegroundColor Green
        $functionUrls[$lambdaName] = $url
    } else {
        $existingUrl = aws lambda get-function-url-config --function-name $lambdaName --region $region --query FunctionUrl --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] $existingUrl" -ForegroundColor Green
            $functionUrls[$lambdaName] = $existingUrl
        } else {
            Write-Host "[ERROR] Failed URL for $lambdaName" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
}

# Update .env
Write-Host ""
Write-Host "Step 7: Updating .env file..." -ForegroundColor Cyan

$envPath = "D:\PDFMasterTool\.env"
$envContent = ""

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
}

$envLines = @()
if ($envContent) {
    $envLines = $envContent -split "`n" | Where-Object { $_ -notmatch "^VITE_LAMBDA_.*_URL=" }
}

$newEnvContent = ($envLines -join "`n").TrimEnd()
$newEnvContent += "`n`n# Lambda Function URLs`n"

$envVars = @{
    "VITE_LAMBDA_WORD_TO_PDF_URL" = $functionUrls["pdfmaster-word-to-pdf"]
    "VITE_LAMBDA_PPT_TO_PDF_URL" = $functionUrls["pdfmaster-ppt-to-pdf"]
    "VITE_LAMBDA_PDF_TO_WORD_URL" = $functionUrls["pdfmaster-pdf-to-word"]
    "VITE_LAMBDA_PDF_TO_EXCEL_URL" = $functionUrls["pdfmaster-pdf-to-excel"]
    "VITE_LAMBDA_PDF_TO_PPT_URL" = $functionUrls["pdfmaster-pdf-to-ppt"]
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if ($value) {
        $newEnvContent += "$key=$value`n"
        Write-Host "[OK] Added $key" -ForegroundColor Green
    } else {
        $newEnvContent += "# $key=FAILED`n"
        Write-Host "[SKIP] $key" -ForegroundColor Yellow
    }
}

$newEnvContent | Set-Content -Path $envPath -NoNewline

Write-Host ""
Write-Host "[OK] .env file updated!" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== Deployment Summary ===" -ForegroundColor Cyan

$successCount = $functionUrls.Count
Write-Host ""
Write-Host "Deployed Functions: $successCount / 5" -ForegroundColor Green
Write-Host ""

foreach ($lambdaName in $functionUrls.Keys) {
    Write-Host "[OK] $lambdaName" -ForegroundColor Green
    Write-Host "     $($functionUrls[$lambdaName])" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[SUCCESS] Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. Test the tools in your browser" -ForegroundColor White
Write-Host ""





