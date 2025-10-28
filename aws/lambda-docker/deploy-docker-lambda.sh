#!/bin/bash

# Deploy Lambda Functions with Docker Images
# This script builds Docker images and deploys them to AWS Lambda

set -e

REGION=${AWS_REGION:-eu-west-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_NAME="pdfmastertool-lambda"
IMAGE_TAG="latest"

echo "=================================="
echo "PDFMasterTool Lambda Docker Deploy"
echo "=================================="
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running!"
  echo "Please start Docker and try again."
  exit 1
fi

# Create ECR repository if it doesn't exist
echo "📦 Step 1: Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $REGION > /dev/null 2>&1 || \
  aws ecr create-repository --repository-name $ECR_REPO_NAME --region $REGION

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"
echo "✅ ECR Repository: $ECR_URI"
echo ""

# Login to ECR
echo "🔐 Step 2: Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI
echo "✅ Logged in to ECR"
echo ""

# Build Docker image
echo "🐳 Step 3: Building Docker image..."
echo "This will take 5-10 minutes (downloading LibreOffice + dependencies)..."
cd "$(dirname "$0")"
docker build -t $ECR_REPO_NAME:$IMAGE_TAG .
echo "✅ Docker image built"
echo ""

# Tag and push image
echo "📤 Step 4: Pushing image to ECR..."
docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
docker push $ECR_URI:$IMAGE_TAG
echo "✅ Image pushed to ECR"
echo ""

# Update Lambda functions
echo "🚀 Step 5: Updating Lambda functions..."

FUNCTIONS=(
  "pdfmaster-pdf-to-word"
  "pdfmaster-pdf-to-excel"
  "pdfmaster-pdf-to-ppt"
)

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
  echo "Updating $FUNCTION_NAME..."
  
  # Check if function exists
  if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
    # Update existing function
    aws lambda update-function-code \
      --function-name $FUNCTION_NAME \
      --image-uri $ECR_URI:$IMAGE_TAG \
      --region $REGION > /dev/null
    
    # Update configuration for better performance
    aws lambda update-function-configuration \
      --function-name $FUNCTION_NAME \
      --memory-size 1536 \
      --timeout 300 \
      --region $REGION > /dev/null
    
    echo "  ✅ Updated $FUNCTION_NAME"
  else
    echo "  ⚠️  Function $FUNCTION_NAME not found, skipping..."
  fi
done

echo ""
echo "=================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================="
echo ""
echo "Lambda functions updated with Docker images containing LibreOffice."
echo ""
echo "🧪 Test your functions:"
echo "  http://localhost:9002/tools/pdf-to-word"
echo "  http://localhost:9002/tools/pdf-to-excel"
echo "  http://localhost:9002/tools/pdf-to-ppt"
echo ""
echo "⚠️  Note: First invocation will be slow (cold start with large image)"
echo "   Subsequent calls will be faster (~2-5 seconds)"
echo ""


