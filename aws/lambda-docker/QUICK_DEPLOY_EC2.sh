#!/bin/bash

# 🚀 One-Click Docker Lambda Deployment for EC2
# Run this on your EC2 instance

set -e

echo "================================================"
echo "🚀 PDFMasterTool - Docker Lambda Deployment"
echo "================================================"
echo ""

# Check Docker
echo "📦 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed! Please logout and login again, then re-run this script."
    exit 1
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo "⚠️  Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ Please logout and login again, then re-run this script."
    exit 1
fi

echo "✅ Docker is ready!"
echo ""

# Check AWS CLI
echo "🔑 Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi
echo "✅ AWS CLI found!"
echo ""

# Get region
AWS_REGION=${AWS_REGION:-$(aws configure get region)}
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="eu-west-1"
fi

echo "📋 Region: $AWS_REGION"
echo ""

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# ECR login
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if not exists
echo "📦 Creating ECR repository..."
aws ecr create-repository \
    --repository-name pdfmastertool-lambda \
    --region $AWS_REGION \
    2>/dev/null || echo "✅ Repository already exists"

echo ""
echo "🏗️  Building Docker image (this will take 5-10 minutes)..."
docker build -t pdfmastertool-lambda:latest .

# Tag and push
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pdfmastertool-lambda:latest"
docker tag pdfmastertool-lambda:latest $ECR_URI

echo ""
echo "⬆️  Pushing to ECR (this may take 2-3 minutes)..."
docker push $ECR_URI

echo ""
echo "🚀 Updating Lambda functions..."

# Get or create Lambda role
ROLE_NAME="PDFMasterTool-Lambda-Role"
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "❌ Lambda role not found. Please create it first."
    exit 1
fi

# Function names
FUNCTIONS=(
    "pdfmastertool-pdf-to-word:pdf-to-word"
    "pdfmastertool-pdf-to-excel:pdf-to-excel"
    "pdfmastertool-pdf-to-ppt:pdf-to-ppt"
)

echo ""
echo "📝 Your Lambda Function URLs:"
echo "=============================="

for FUNC_PAIR in "${FUNCTIONS[@]}"; do
    IFS=':' read -r FUNC_NAME HANDLER <<< "$FUNC_PAIR"
    
    echo ""
    echo "📦 Updating: $FUNC_NAME"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNC_NAME \
        --image-uri $ECR_URI \
        --region $AWS_REGION \
        2>/dev/null || echo "⚠️  Update failed for $FUNC_NAME"
    
    # Get Function URL
    FUNC_URL=$(aws lambda get-function-url-config \
        --function-name $FUNC_NAME \
        --region $AWS_REGION \
        --query 'FunctionUrl' \
        --output text 2>/dev/null || echo "No URL configured")
    
    echo "✅ $FUNC_NAME: $FUNC_URL"
done

echo ""
echo "=============================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================="
echo ""
echo "🎉 Your Lambda functions are now using Docker with LibreOffice!"
echo "🔗 Test them with the URLs above"
echo ""



