#!/bin/bash

# PDFMasterTool AWS Deployment Script
# Deploys Lambda functions to AWS Ireland (eu-west-1)

set -e  # Exit on error

echo ""
echo "══════════════════════════════════════════════════"
echo "  🚀 PDFMasterTool AWS Deployment"
echo "══════════════════════════════════════════════════"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Installing..."
    echo ""
    echo "Please install SAM CLI:"
    echo "   Windows: choco install aws-sam-cli"
    echo "   Mac: brew install aws-sam-cli"
    echo "   Or visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Load environment variables
if [ -f ../.env ]; then
    echo "📋 Loading AWS credentials from .env..."
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Configure AWS credentials
echo "🔐 Configuring AWS credentials..."
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"

# Verify credentials
echo "✅ Verifying AWS credentials..."
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "   Account ID: $AWS_ACCOUNT"
echo "   Region: $AWS_REGION"
echo ""

# Build Lambda functions
echo "📦 Building Lambda functions..."
cd lambda
npm install --production
cd ..

# Deploy with SAM
echo "🚀 Deploying to AWS..."
echo ""

sam deploy \
  --template-file template.yaml \
  --stack-name pdfmastertool \
  --region $AWS_REGION \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "══════════════════════════════════════════════════"
echo ""

# Get function URLs
echo "📋 Lambda Function URLs:"
echo ""

aws lambda list-function-url-configs \
  --region $AWS_REGION \
  --query 'FunctionUrlConfigs[*].[FunctionName,FunctionUrl]' \
  --output table

echo ""
echo "💡 Next Steps:"
echo "   1. Copy the Function URLs above"
echo "   2. Update your .env file with these URLs"
echo "   3. Restart your dev server: npm run dev"
echo ""
echo "🎉 All 5 conversion tools are now live on AWS!"
echo ""













