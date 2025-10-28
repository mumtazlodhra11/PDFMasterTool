# ========================================
# PDFMasterTool - Automated Deployment
# ========================================

$EC2_IP = "34.241.164.163"
$EC2_USER = "ec2-user"

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  PDFMasterTool - Lambda Deployment" -ForegroundColor Blue
Write-Host "  EC2 IP: $EC2_IP" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Ask for SSH key
$SSH_KEY = Read-Host "Enter SSH key file path (or press Enter to try without key)"

Write-Host ""
Write-Host "Step 1: Checking EC2 connection..." -ForegroundColor Cyan

# Test connection
if ($SSH_KEY) {
    $testCmd = "ssh -i `"$SSH_KEY`" -o ConnectTimeout=5 $EC2_USER@$EC2_IP 'echo OK'"
} else {
    $testCmd = "ssh -o ConnectTimeout=5 $EC2_USER@$EC2_IP 'echo OK'"
}

$result = Invoke-Expression $testCmd 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Cannot connect to EC2!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. EC2 is running" -ForegroundColor Yellow
    Write-Host "2. SSH key is correct" -ForegroundColor Yellow
    Write-Host "3. Security group allows SSH from your IP" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Connected to EC2 successfully!" -ForegroundColor Green
Write-Host ""

# Check if project exists
Write-Host "Step 2: Checking project on EC2..." -ForegroundColor Cyan

if ($SSH_KEY) {
    $checkProject = "ssh -i `"$SSH_KEY`" $EC2_USER@$EC2_IP 'test -d ~/PDFMasterTool && echo EXISTS || echo NOT_FOUND'"
} else {
    $checkProject = "ssh $EC2_USER@$EC2_IP 'test -d ~/PDFMasterTool && echo EXISTS || echo NOT_FOUND'"
}

$projectExists = Invoke-Expression $checkProject 2>&1

if ($projectExists -notmatch "EXISTS") {
    Write-Host "✗ PDFMasterTool folder not found on EC2!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Uploading project files..." -ForegroundColor Yellow
    
    if ($SSH_KEY) {
        scp -i "$SSH_KEY" -r "$PSScriptRoot" "$EC2_USER@${EC2_IP}:~/PDFMasterTool"
    } else {
        scp -r "$PSScriptRoot" "$EC2_USER@${EC2_IP}:~/PDFMasterTool"
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to upload project files!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Project uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "✓ Project found on EC2!" -ForegroundColor Green
}

Write-Host ""

# Check region
Write-Host "Step 3: Checking EC2 region..." -ForegroundColor Cyan

if ($SSH_KEY) {
    $region = ssh -i "$SSH_KEY" $EC2_USER@$EC2_IP "curl -s http://169.254.169.254/latest/meta-data/placement/region"
} else {
    $region = ssh $EC2_USER@$EC2_IP "curl -s http://169.254.169.254/latest/meta-data/placement/region"
}

Write-Host "✓ EC2 Region: $region" -ForegroundColor Green
Write-Host ""

# Deploy Lambda
Write-Host "Step 4: Deploying Lambda functions..." -ForegroundColor Cyan
Write-Host "(This will take 5-10 minutes...)" -ForegroundColor Yellow
Write-Host ""

$deployCmd = @"
cd ~/PDFMasterTool/aws && \
chmod +x ec2-deploy-lambda.sh && \
AWS_REGION=$region ./ec2-deploy-lambda.sh
"@

if ($SSH_KEY) {
    ssh -i "$SSH_KEY" $EC2_USER@$EC2_IP $deployCmd
} else {
    ssh $EC2_USER@$EC2_IP $deployCmd
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check AWS credentials on EC2:" -ForegroundColor Yellow
    Write-Host "  ssh $EC2_USER@$EC2_IP" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""

# Download .env file
Write-Host "Step 5: Downloading .env file..." -ForegroundColor Cyan

$envPath = Join-Path $PSScriptRoot ".env"

if ($SSH_KEY) {
    scp -i "$SSH_KEY" "$EC2_USER@${EC2_IP}:~/PDFMasterTool/.env" $envPath
} else {
    scp "$EC2_USER@${EC2_IP}:~/PDFMasterTool/.env" $envPath
}

if ($LASTEXITCODE -eq 0 -and (Test-Path $envPath)) {
    Write-Host "✓ .env file downloaded!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  Lambda Function URLs:" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
    Get-Content $envPath | Where-Object { $_ -match "PUBLIC_LAMBDA" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Cyan
    }
    Write-Host ""
} else {
    Write-Host "✗ Failed to download .env file" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually download it:" -ForegroundColor Yellow
    if ($SSH_KEY) {
        Write-Host "  scp -i `"$SSH_KEY`" $EC2_USER@${EC2_IP}:~/PDFMasterTool/.env ." -ForegroundColor Yellow
    } else {
        Write-Host "  scp $EC2_USER@${EC2_IP}:~/PDFMasterTool/.env ." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 DEPLOYMENT COMPLETE! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test locally: npm run dev" -ForegroundColor Yellow
Write-Host "2. Visit: http://localhost:9001/tools/word-to-pdf" -ForegroundColor Yellow
Write-Host "3. Build for production: npm run build" -ForegroundColor Yellow
Write-Host "4. Deploy frontend: vercel --prod" -ForegroundColor Yellow
Write-Host ""

pause

