#!/bin/bash
# 🚀 PDFMasterTool - EC2 Lambda Deployment Script
# Deploy all 5 Lambda functions from EC2 instance

set -e  # Exit on error

echo "🚀 PDFMasterTool - Lambda Deployment Script"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
MEMORY_SIZE=2048
TIMEOUT=120
RUNTIME="nodejs20.x"
ARCHITECTURE="x86_64"

# Function names
FUNCTIONS=(
    "word-to-pdf"
    "ppt-to-pdf"
    "pdf-to-word"
    "pdf-to-excel"
    "pdf-to-ppt"
)

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Region: $AWS_REGION"
echo "   Memory: ${MEMORY_SIZE}MB"
echo "   Timeout: ${TIMEOUT}s"
echo "   Runtime: $RUNTIME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found!${NC}"
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
fi

# Check AWS credentials
echo -e "${BLUE}🔑 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo ""
    echo "Please configure AWS CLI:"
    echo "  aws configure"
    echo ""
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_access_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "  export AWS_DEFAULT_REGION=us-east-1"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT_ID${NC}"
echo ""

# Change to lambda directory
cd "$(dirname "$0")/lambda"

# Create IAM role for Lambda if it doesn't exist
ROLE_NAME="PDFMasterTool-Lambda-Role"
echo -e "${BLUE}📝 Checking IAM Role: $ROLE_NAME${NC}"

if ! aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
    echo "Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF
    
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "Execution role for PDFMasterTool Lambda functions"
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    echo -e "${GREEN}✅ IAM Role created${NC}"
    echo "Waiting 10 seconds for role to propagate..."
    sleep 10
else
    echo -e "${GREEN}✅ IAM Role exists${NC}"
fi

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"
echo "   Role ARN: $ROLE_ARN"
echo ""

# Deploy each Lambda function
echo -e "${BLUE}🚀 Deploying Lambda Functions...${NC}"
echo ""

FUNCTION_URLS=()

for func in "${FUNCTIONS[@]}"; do
    FUNCTION_NAME="pdfmastertool-${func}"
    ZIP_FILE="${func}.zip"
    
    echo -e "${YELLOW}📦 Deploying: $FUNCTION_NAME${NC}"
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo "   Function exists, updating code..."
        
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file "fileb://$ZIP_FILE" \
            --region "$AWS_REGION" \
            > /dev/null
        
        echo "   Updating configuration..."
        
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --region "$AWS_REGION" \
            > /dev/null
        
        echo -e "${GREEN}   ✅ Updated existing function${NC}"
    else
        echo "   Creating new function..."
        
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --role "$ROLE_ARN" \
            --handler "${func}.handler" \
            --zip-file "fileb://$ZIP_FILE" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --architectures "$ARCHITECTURE" \
            --region "$AWS_REGION" \
            --environment "Variables={AWS_REGION=$AWS_REGION,NODE_OPTIONS=--max-old-space-size=2048}" \
            > /dev/null
        
        echo -e "${GREEN}   ✅ Created new function${NC}"
        
        # Wait a bit for function to be ready
        sleep 3
    fi
    
    # Create or update Function URL
    echo "   Configuring Function URL..."
    
    if aws lambda get-function-url-config --function-name "$FUNCTION_NAME" --region "$AWS_REGION" &> /dev/null; then
        FUNCTION_URL=$(aws lambda get-function-url-config \
            --function-name "$FUNCTION_NAME" \
            --region "$AWS_REGION" \
            --query 'FunctionUrl' \
            --output text)
    else
        # Add permission for public access
        aws lambda add-permission \
            --function-name "$FUNCTION_NAME" \
            --statement-id "FunctionURLAllowPublicAccess" \
            --action "lambda:InvokeFunctionUrl" \
            --principal "*" \
            --function-url-auth-type "NONE" \
            --region "$AWS_REGION" \
            > /dev/null 2>&1 || true
        
        # Create Function URL
        FUNCTION_URL=$(aws lambda create-function-url-config \
            --function-name "$FUNCTION_NAME" \
            --auth-type "NONE" \
            --cors "AllowOrigins=*,AllowMethods=POST,AllowHeaders=*,MaxAge=86400" \
            --region "$AWS_REGION" \
            --query 'FunctionUrl' \
            --output text)
    fi
    
    echo -e "${GREEN}   ✅ Function URL: $FUNCTION_URL${NC}"
    echo ""
    
    FUNCTION_URLS+=("$func|$FUNCTION_URL")
done

# Create .env file
echo -e "${BLUE}📝 Creating .env file...${NC}"

ENV_FILE="../../.env"
ENV_CONTENT=""

# Read existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    # Backup existing .env
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    echo "   Backed up existing .env to .env.backup"
fi

# Generate new .env content
cat > "$ENV_FILE" <<EOF
# AWS Lambda Function URLs
# Generated on $(date)
# Region: $AWS_REGION

EOF

for entry in "${FUNCTION_URLS[@]}"; do
    IFS='|' read -r func url <<< "$entry"
    env_name=$(echo "PUBLIC_LAMBDA_${func}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    echo "${env_name}=${url}" >> "$ENV_FILE"
done

echo -e "${GREEN}✅ .env file created: $ENV_FILE${NC}"
echo ""

# Display summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 DEPLOYMENT COMPLETE! 🎉                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Deployed Functions:${NC}"

for entry in "${FUNCTION_URLS[@]}"; do
    IFS='|' read -r func url <<< "$entry"
    echo "   ✅ $func"
    echo "      → $url"
done

echo ""
echo -e "${BLUE}📝 Environment Variables (.env):${NC}"
cat "$ENV_FILE"

echo ""
echo -e "${YELLOW}🔍 Next Steps:${NC}"
echo "   1. Test the functions using curl or frontend"
echo "   2. Deploy frontend: npm run build"
echo "   3. Configure CORS if needed"
echo "   4. Monitor CloudWatch Logs for errors"
echo ""

echo -e "${BLUE}💡 Test Example:${NC}"
echo '   curl -X POST "$(head -1 .env | cut -d= -f2)" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"fileContent":"SGVsbG8=","fileName":"test.txt"}'"'"
echo ""

echo -e "${GREEN}✨ Deployment successful! Chalo test karte hain! 🚀${NC}"

