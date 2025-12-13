#!/bin/bash
# Create Lambda Functions from Container Images
# Run this after all Docker images are built and pushed

set -e

REGION="eu-west-1"
ACCOUNT_ID="137288645009"

FUNCTIONS=("word-to-pdf" "ppt-to-pdf" "pdf-to-word" "pdf-to-excel" "pdf-to-ppt")
REPOS=(
    "pdfmastertool-word-to-pdf"
    "pdfmastertool-ppt-to-pdf"
    "pdfmastertool-pdf-to-word"
    "pdfmastertool-pdf-to-excel"
    "pdfmastertool-pdf-to-ppt"
)

echo "=========================================="
echo "🚀 Creating Lambda Functions from Containers"
echo "=========================================="
echo ""

# Get IAM Role ARN
echo "🔍 Getting IAM Role..."
ROLE_ARN=$(aws iam get-role --role-name PDFMasterLambdaRole --query 'Role.Arn' --output text 2>/dev/null)

if [ -z "$ROLE_ARN" ]; then
    echo "❌ ERROR: PDFMasterLambdaRole not found!"
    echo "Please create the IAM role first."
    exit 1
fi

echo "✅ Using Role: $ROLE_ARN"
echo ""

# Delete old word-to-pdf if it exists (ZIP version)
echo "🗑️  Checking for old functions..."
aws lambda delete-function --function-name pdfmaster-word-to-pdf --region $REGION 2>/dev/null || echo "  (No old word-to-pdf found)"
sleep 5

echo ""
echo "📦 Creating Lambda Functions..."
echo ""

# Create all functions
for i in "${!FUNCTIONS[@]}"; do
    FUNC="${FUNCTIONS[$i]}"
    REPO="${REPOS[$i]}"
    LAMBDA_NAME="pdfmaster-$FUNC"
    IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
    
    echo "[$((i+1))/5] Creating $LAMBDA_NAME..."
    
    # Check if function already exists
    if aws lambda get-function --function-name "$LAMBDA_NAME" --region $REGION &>/dev/null; then
        echo "  Function exists, updating..."
        aws lambda update-function-code \
            --function-name "$LAMBDA_NAME" \
            --image-uri "$IMAGE_URI" \
            --region $REGION > /dev/null
        
        aws lambda wait function-updated \
            --function-name "$LAMBDA_NAME" \
            --region $REGION
        
        echo "  ✅ Updated $LAMBDA_NAME"
    else
        # Create new function
        aws lambda create-function \
            --function-name "$LAMBDA_NAME" \
            --package-type Image \
            --code ImageUri="$IMAGE_URI" \
            --role "$ROLE_ARN" \
            --timeout 300 \
            --memory-size 2048 \
            --region $REGION > /dev/null
        
        echo "  ✅ Created $LAMBDA_NAME"
    fi
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_NAME" \
        --timeout 300 \
        --memory-size 2048 \
        --region $REGION > /dev/null
    
    sleep 3
done

echo ""
echo "=========================================="
echo "🌐 Creating Function URLs..."
echo "=========================================="
echo ""

# Create Function URLs with CORS
FUNCTION_URLS=()

for FUNC in "${FUNCTIONS[@]}"; do
    LAMBDA_NAME="pdfmaster-$FUNC"
    
    echo "Creating Function URL for $LAMBDA_NAME..."
    
    # Create or update Function URL
    aws lambda create-function-url-config \
        --function-name "$LAMBDA_NAME" \
        --auth-type NONE \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["*"],
            "AllowMethods": ["POST", "OPTIONS"],
            "AllowOrigins": ["*"],
            "ExposeHeaders": [],
            "MaxAge": 86400
        }' \
        --region $REGION 2>/dev/null || \
    aws lambda update-function-url-config \
        --function-name "$LAMBDA_NAME" \
        --auth-type NONE \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["*"],
            "AllowMethods": ["POST", "OPTIONS"],
            "AllowOrigins": ["*"],
            "ExposeHeaders": [],
            "MaxAge": 86400
        }' \
        --region $REGION > /dev/null
    
    # Get Function URL
    FUNC_URL=$(aws lambda get-function-url-config \
        --function-name "$LAMBDA_NAME" \
        --region $REGION \
        --query 'FunctionUrl' \
        --output text)
    
    FUNCTION_URLS+=("$FUNC_URL")
    
    echo "  ✅ URL: $FUNC_URL"
    echo ""
done

echo "=========================================="
echo "✅ ALL FUNCTIONS CREATED!"
echo "=========================================="
echo ""
echo "📋 Function URLs:"
echo ""

for i in "${!FUNCTIONS[@]}"; do
    FUNC="${FUNCTIONS[$i]}"
    URL="${FUNCTION_URLS[$i]}"
    
    case $FUNC in
        "word-to-pdf")
            echo "PUBLIC_LAMBDA_WORD_TO_PDF=$URL"
            ;;
        "ppt-to-pdf")
            echo "PUBLIC_LAMBDA_PPT_TO_PDF=$URL"
            ;;
        "pdf-to-word")
            echo "PUBLIC_LAMBDA_PDF_TO_WORD=$URL"
            ;;
        "pdf-to-excel")
            echo "PUBLIC_LAMBDA_PDF_TO_EXCEL=$URL"
            ;;
        "pdf-to-ppt")
            echo "PUBLIC_LAMBDA_PDF_TO_PPT=$URL"
            ;;
    esac
done

echo ""
echo "=========================================="
echo "📝 Copy these URLs to .env file!"
echo "=========================================="














