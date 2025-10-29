#!/bin/bash

# Google Cloud Run Deployment Script
# Deploy PDF Master Tool backend with LibreOffice

set -e  # Exit on error

echo "🚀 Google Cloud Run Deployment"
echo "================================"

# Configuration
PROJECT_ID="pdfmastertool"  # Change this to your project ID
SERVICE_NAME="pdf-converter"
REGION="europe-west1"  # Or your preferred region
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo ""
echo "📋 Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Service: ${SERVICE_NAME}"
echo "  Region: ${REGION}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found!"
    echo ""
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found"

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo ""
    echo "🔐 Please login to Google Cloud..."
    gcloud auth login
fi

echo "✅ Authenticated"

# Set project
echo ""
echo "🔧 Setting project..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo ""
echo "🔌 Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

echo "✅ APIs enabled"

# Build Docker image
echo ""
echo "🐳 Building Docker image..."
echo "  This may take 5-10 minutes..."
gcloud builds submit --tag ${IMAGE_NAME}

echo "✅ Image built successfully"

# Deploy to Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0

echo ""
echo "================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================"

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "🎉 Your API is live at:"
echo "  ${SERVICE_URL}"
echo ""
echo "📋 Test endpoints:"
echo "  ${SERVICE_URL}/health"
echo "  ${SERVICE_URL}/convert/pdf-to-word"
echo "  ${SERVICE_URL}/convert/pdf-to-excel"
echo "  ${SERVICE_URL}/convert/pdf-to-ppt"
echo "  ${SERVICE_URL}/convert/word-to-pdf"
echo "  ${SERVICE_URL}/convert/ppt-to-pdf"
echo ""
echo "💡 Add this URL to your frontend .env file:"
echo "  VITE_API_URL=${SERVICE_URL}"
echo ""
echo "🎊 Happy converting!"


