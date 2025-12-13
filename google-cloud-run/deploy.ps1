<#
  Minimal Google Cloud Run deployment script (emoji-free)
  Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File .\google-cloud-run\deploy.ps1
#>

Param(
  [string]$ProjectId = "pdfmastertool-963643",
  [string]$Region = "europe-west1",
  [string]$ServiceName = "pdf-converter"
)

$ErrorActionPreference = 'Stop'

# Resolve image name
$ImageName = "gcr.io/$ProjectId/$ServiceName"

# Ensure gcloud exists
Get-Command gcloud | Out-Null

# Auth/project
gcloud config set project $ProjectId | Out-Null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com | Out-Null

# Build (run in this directory)
Push-Location $PSScriptRoot
gcloud builds submit --tag $ImageName .
Pop-Location

# Deploy
gcloud run deploy $ServiceName `
  --image $ImageName `
    --platform managed `
  --region $Region `
    --allow-unauthenticated `
    --memory 2Gi `
  --cpu 2 `
  --timeout 900 `
  --cpu-boost | Out-Null

$ServiceUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"
Write-Host "Service URL: $ServiceUrl"

