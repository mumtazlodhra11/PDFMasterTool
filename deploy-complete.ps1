# Complete Lambda Deployment with Docker
# This script automates the entire deployment process

$ErrorActionPreference = "Continue"
$region = "eu-west-1"
$accountId = (aws sts get-caller-identity --query Account --output text)

Write-Host "`n=== PDFMasterTool Complete Deployment ===" -ForegroundColor Cyan
Write-Host "Region: $region" -ForegroundColor Yellow
Write-Host "Account: $accountId`n" -ForegroundColor Yellow

# Step 1: Wait for Docker to be ready
Write-Host "📋 Step 1: Waiting for Docker Desktop to start..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker is running!" -ForegroundColor Green
            $dockerReady = $true
            break
        }
    } catch {}
    
    $attempt++
    Write-Host "   Waiting... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $dockerReady) {
    Write-Host "❌ Docker Desktop failed to start!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop manually and run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 2: ECR Login
Write-Host "`n📋 Step 2: Logging into AWS ECR..." -ForegroundColor Cyan

aws ecr get-login-password --region $region | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$region.amazonaws.com"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECR login failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ECR login successful!" -ForegroundColor Green

# Step 3: Build and Push Docker Images
Write-Host "`n📋 Step 3: Building and pushing Docker images..." -ForegroundColor Cyan
Write-Host "   This will take 30-40 minutes (be patient!)..." -ForegroundColor Yellow

$functions = @(
    @{name="word-to-pdf"; repo="pdfmastertool-word-to-pdf"},
    @{name="ppt-to-pdf"; repo="pdfmastertool-ppt-to-pdf"},
    @{name="pdf-to-word"; repo="pdfmastertool-pdf-to-word"},
    @{name="pdf-to-excel"; repo="pdfmastertool-pdf-to-excel"},
    @{name="pdf-to-ppt"; repo="pdfmastertool-pdf-to-ppt"}
)

$imageUris = @{}

foreach ($func in $functions) {
    $name = $func.name
    $repo = $func.repo
    $imageUri = "$accountId.dkr.ecr.$region.amazonaws.com/${repo}:latest"
    
    Write-Host "`n🐳 Building $name..." -ForegroundColor Yellow
    
    $dockerfilePath = "aws\lambda-containers\$name\Dockerfile"
    $contextPath = "aws\lambda-containers\$name"
    
    if (-not (Test-Path $dockerfilePath)) {
        Write-Host "❌ Dockerfile not found: $dockerfilePath" -ForegroundColor Red
        continue
    }
    
    # Build image
    docker build -t $repo -f $dockerfilePath $contextPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed for $name" -ForegroundColor Red
        continue
    }
    
    Write-Host "✅ Built $name" -ForegroundColor Green
    
    # Tag image
    docker tag "${repo}:latest" $imageUri
    
    Write-Host "📤 Pushing $name to ECR..." -ForegroundColor Yellow
    
    # Push image
    docker push $imageUri
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Push failed for $name" -ForegroundColor Red
        continue
    }
    
    Write-Host "✅ Pushed $name" -ForegroundColor Green
    $imageUris[$name] = $imageUri
}

Write-Host "`n✅ Docker images built and pushed: $($imageUris.Count)/5" -ForegroundColor Green

# Step 4: Delete old word-to-pdf function (ZIP version)
Write-Host "`n📋 Step 4: Cleaning up old word-to-pdf function..." -ForegroundColor Cyan

aws lambda delete-function --function-name pdfmaster-word-to-pdf --region $region 2>&1 | Out-Null
Write-Host "✅ Old function deleted" -ForegroundColor Green
Start-Sleep -Seconds 5

# Step 5: Create Lambda Functions
Write-Host "`n📋 Step 5: Creating Lambda functions from container images..." -ForegroundColor Cyan

$roleName = "PDFMasterLambdaRole"
$roleArn = (aws iam get-role --role-name $roleName --query "Role.Arn" --output text)

Write-Host "Using IAM Role: $roleArn" -ForegroundColor Gray

foreach ($func in $functions) {
    $name = $func.name
    $lambdaName = "pdfmaster-$name"
    
    if (-not $imageUris.ContainsKey($name)) {
        Write-Host "⚠️  Skipping $name (no image)" -ForegroundColor Yellow
        continue
    }
    
    $imageUri = $imageUris[$name]
    
    Write-Host "`nCreating $lambdaName..." -ForegroundColor Yellow
    
    aws lambda create-function `
        --function-name $lambdaName `
        --package-type Image `
        --code ImageUri=$imageUri `
        --role $roleArn `
        --timeout 300 `
        --memory-size 2048 `
        --region $region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Created $lambdaName" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create $lambdaName" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 3
}

# Step 6: Create Function URLs
Write-Host "`n📋 Step 6: Creating Function URLs..." -ForegroundColor Cyan

$functionUrls = @{}

foreach ($func in $functions) {
    $name = $func.name
    $lambdaName = "pdfmaster-$name"
    
    Write-Host "Creating URL for $lambdaName..." -ForegroundColor Yellow
    
    $url = aws lambda create-function-url-config `
        --function-name $lambdaName `
        --auth-type NONE `
        --cors AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type `
        --region $region `
        --query FunctionUrl `
        --output text 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ URL created: $url" -ForegroundColor Green
        $functionUrls[$lambdaName] = $url
    } else {
        # Try to get existing URL
        $existingUrl = aws lambda get-function-url-config `
            --function-name $lambdaName `
            --region $region `
            --query FunctionUrl `
            --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Existing URL: $existingUrl" -ForegroundColor Green
            $functionUrls[$lambdaName] = $existingUrl
        } else {
            Write-Host "❌ Failed to get URL for $lambdaName" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
}

# Step 7: Update .env file
Write-Host "`n📋 Step 7: Updating .env file..." -ForegroundColor Cyan

$envPath = "D:\PDFMasterTool\.env"
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
$newEnvContent += "`n`n# Lambda Function URLs - Auto-generated`n"

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
        Write-Host "✅ Added $key" -ForegroundColor Green
    } else {
        $newEnvContent += "# $key=FAILED`n"
        Write-Host "⚠️  Skipped $key" -ForegroundColor Yellow
    }
}

$newEnvContent | Set-Content -Path $envPath -NoNewline

Write-Host "`n✅ .env file updated!" -ForegroundColor Green

# Final Summary
Write-Host "`n📋 Deployment Summary" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$successCount = $functionUrls.Count
Write-Host "`nDeployed Functions: $successCount / 5" -ForegroundColor $(if ($successCount -eq 5) { "Green" } else { "Yellow" })

Write-Host "`nFunction URLs:" -ForegroundColor Yellow
foreach ($lambdaName in $functionUrls.Keys) {
    Write-Host "✅ $lambdaName" -ForegroundColor Green
    Write-Host "   $($functionUrls[$lambdaName])" -ForegroundColor Gray
}

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. Test the tools in your browser" -ForegroundColor White
Write-Host "3. Check console for any errors" -ForegroundColor White
Write-Host ""

