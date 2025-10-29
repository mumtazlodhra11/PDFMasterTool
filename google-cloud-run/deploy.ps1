# Google Cloud Run Deployment Script (PowerShell)
# Deploy PDF Master Tool backend with LibreOffice

Write-Host "🚀 Google Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "pdfmastertool"  # Change this to your project ID
$SERVICE_NAME = "pdf-converter"
$REGION = "europe-west1"  # Or your preferred region
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Project ID: $PROJECT_ID"
Write-Host "  Service: $SERVICE_NAME"
Write-Host "  Region: $REGION"
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
    Write-Host "✅ gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ gcloud CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing, restart PowerShell and run this script again."
    exit 1
}

# Check if logged in
$account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $account) {
    Write-Host ""
    Write-Host "🔐 Please login to Google Cloud..." -ForegroundColor Yellow
    gcloud auth login
}

Write-Host "✅ Authenticated as: $account" -ForegroundColor Green

# Set project
Write-Host ""
Write-Host "🔧 Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host ""
Write-Host "🔌 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable `
    cloudbuild.googleapis.com `
    run.googleapis.com `
    containerregistry.googleapis.com

Write-Host "✅ APIs enabled" -ForegroundColor Green

# Build Docker image
Write-Host ""
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Gray
gcloud builds submit --tag $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image built successfully" -ForegroundColor Green

# Deploy to Cloud Run
Write-Host ""
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 1 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 0

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# Get service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'

Write-Host ""
Write-Host "🎉 Your API is live at:" -ForegroundColor Green
Write-Host "  $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Test endpoints:" -ForegroundColor Yellow
Write-Host "  $SERVICE_URL/health"
Write-Host "  $SERVICE_URL/convert/pdf-to-word"
Write-Host "  $SERVICE_URL/convert/pdf-to-excel"
Write-Host "  $SERVICE_URL/convert/pdf-to-ppt"
Write-Host "  $SERVICE_URL/convert/word-to-pdf"
Write-Host "  $SERVICE_URL/convert/ppt-to-pdf"
Write-Host ""
Write-Host "💡 Add this URL to your frontend .env file:" -ForegroundColor Yellow
Write-Host "  VITE_API_URL=$SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎊 Happy converting!" -ForegroundColor Green


