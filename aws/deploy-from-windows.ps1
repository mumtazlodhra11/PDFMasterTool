# 🚀 PDFMasterTool - Deploy to EC2 from Windows
# PowerShell script to deploy Lambda functions via EC2

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_HOST,
    
    [Parameter(Mandatory=$false)]
    [string]$EC2_USER = "ec2-user",
    
    [Parameter(Mandatory=$false)]
    [string]$SSH_KEY = "",
    
    [Parameter(Mandatory=$false)]
    [string]$AWS_REGION = "us-east-1"
)

Write-Host "🚀 PDFMasterTool - EC2 Deployment from Windows" -ForegroundColor Blue
Write-Host "=" * 60 -ForegroundColor Blue
Write-Host ""

# Configuration
$PROJECT_DIR = Split-Path -Parent $PSScriptRoot
$LAMBDA_DIR = Join-Path $PSScriptRoot "lambda"
$REMOTE_DIR = "/home/$EC2_USER/pdfmastertool-deploy"

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH not found! Please install OpenSSH." -ForegroundColor Red
    Write-Host "   Install: Settings > Apps > Optional Features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "   EC2 Host: $EC2_HOST"
Write-Host "   EC2 User: $EC2_USER"
Write-Host "   AWS Region: $AWS_REGION"
Write-Host ""

# Build SSH command
$SSH_CMD = "ssh"
$SCP_CMD = "scp"
if ($SSH_KEY) {
    $SSH_CMD = "ssh -i `"$SSH_KEY`""
    $SCP_CMD = "scp -i `"$SSH_KEY`""
}

Write-Host "🔍 Testing SSH connection..." -ForegroundColor Blue
$testConnection = "$SSH_CMD $EC2_USER@$EC2_HOST 'echo OK'"
$result = Invoke-Expression $testConnection 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to EC2!" -ForegroundColor Red
    Write-Host "   Command: $testConnection" -ForegroundColor Yellow
    Write-Host "   Error: $result" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH connection successful" -ForegroundColor Green
Write-Host ""

# Create remote directory
Write-Host "📁 Creating remote directory..." -ForegroundColor Blue
Invoke-Expression "$SSH_CMD $EC2_USER@$EC2_HOST 'mkdir -p $REMOTE_DIR/lambda'"
Write-Host "✅ Remote directory created" -ForegroundColor Green
Write-Host ""

# Upload Lambda ZIP files
Write-Host "📤 Uploading Lambda functions..." -ForegroundColor Blue

$zipFiles = @(
    "word-to-pdf.zip",
    "ppt-to-pdf.zip",
    "pdf-to-word.zip",
    "pdf-to-excel.zip",
    "pdf-to-ppt.zip"
)

foreach ($zipFile in $zipFiles) {
    $localPath = Join-Path $LAMBDA_DIR $zipFile
    if (Test-Path $localPath) {
        Write-Host "   Uploading $zipFile..." -ForegroundColor Cyan
        Invoke-Expression "$SCP_CMD `"$localPath`" $EC2_USER@${EC2_HOST}:$REMOTE_DIR/lambda/"
        Write-Host "   ✅ $zipFile uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $zipFile not found" -ForegroundColor Yellow
    }
}
Write-Host ""

# Upload deployment script
Write-Host "📤 Uploading deployment script..." -ForegroundColor Blue
$deployScript = Join-Path $PSScriptRoot "ec2-deploy-lambda.sh"
Invoke-Expression "$SCP_CMD `"$deployScript`" $EC2_USER@${EC2_HOST}:$REMOTE_DIR/"
Write-Host "✅ Deployment script uploaded" -ForegroundColor Green
Write-Host ""

# Execute deployment on EC2
Write-Host "🚀 Executing deployment on EC2..." -ForegroundColor Blue
Write-Host ""

$deployCommand = @"
cd $REMOTE_DIR && \
chmod +x ec2-deploy-lambda.sh && \
export AWS_REGION=$AWS_REGION && \
./ec2-deploy-lambda.sh
"@

Invoke-Expression "$SSH_CMD $EC2_USER@$EC2_HOST '$deployCommand'"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Download .env file
    Write-Host "📥 Downloading .env file..." -ForegroundColor Blue
    $envPath = Join-Path $PROJECT_DIR ".env"
    Invoke-Expression "$SCP_CMD $EC2_USER@${EC2_HOST}:$REMOTE_DIR/.env `"$envPath`""
    
    if (Test-Path $envPath) {
        Write-Host "✅ .env file downloaded to: $envPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Function URLs:" -ForegroundColor Blue
        Get-Content $envPath | Where-Object { $_ -match "PUBLIC_LAMBDA" } | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment Complete! Next steps:" -ForegroundColor Green
    Write-Host "   1. Test locally: npm run dev" -ForegroundColor Yellow
    Write-Host "   2. Visit: http://localhost:9001/tools/word-to-pdf" -ForegroundColor Yellow
    Write-Host "   3. Build for prod: npm run build" -ForegroundColor Yellow
    Write-Host "   4. Deploy frontend: vercel --prod" -ForegroundColor Yellow
    
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "   Check error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✨ Done! Chalo test karte hain! 🚀" -ForegroundColor Green

