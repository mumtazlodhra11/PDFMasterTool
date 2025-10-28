#!/bin/bash
# This script runs on EC2 to build and deploy all Lambda functions
set -e

REGION="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo ""
echo "=== Building Docker Images on EC2 ==="
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# Navigate to build directory
cd /home/ec2-user/build

# ECR Login
echo "Step 1: ECR Login..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
echo "[OK] Logged into ECR"

# Build and push all 5 functions
FUNCTIONS=("word-to-pdf" "ppt-to-pdf" "pdf-to-word" "pdf-to-excel" "pdf-to-ppt")
REPOS=("pdfmastertool-word-to-pdf" "pdfmastertool-ppt-to-pdf" "pdfmastertool-pdf-to-word" "pdfmastertool-pdf-to-excel" "pdfmastertool-pdf-to-ppt")

echo ""
echo "Step 2: Building and pushing Docker images..."
echo "This will take 30-40 minutes..."
echo ""

IMAGE_URIS=()

for i in "${!FUNCTIONS[@]}"; do
    FUNC="${FUNCTIONS[$i]}"
    REPO="${REPOS[$i]}"
    IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
    
    echo "[$((i+1))/5] Building $FUNC..."
    
    # Build image
    docker build -t $REPO \
        -f aws/lambda-containers/$FUNC/Dockerfile \
        aws/lambda-containers/$FUNC/
    
    if [ $? -ne 0 ]; then
        echo "[ERROR] Build failed for $FUNC"
        continue
    fi
    
    echo "[OK] Built $FUNC"
    
    # Tag image
    docker tag ${REPO}:latest $IMAGE_URI
    
    # Push image
    echo "Pushing $FUNC to ECR..."
    docker push $IMAGE_URI
    
    if [ $? -ne 0 ]; then
        echo "[ERROR] Push failed for $FUNC"
        continue
    fi
    
    echo "[OK] Pushed $FUNC"
    IMAGE_URIS+=("$IMAGE_URI")
    echo ""
done

echo ""
echo "[SUCCESS] All images built and pushed!"
echo "Images: ${#IMAGE_URIS[@]}/5"
echo ""

# Get IAM role ARN
ROLE_ARN=$(aws iam get-role --role-name PDFMasterLambdaRole --query "Role.Arn" --output text)

echo "Step 3: Creating Lambda functions..."
echo "Using role: $ROLE_ARN"
echo ""

# Delete old word-to-pdf function
aws lambda delete-function --function-name pdfmaster-word-to-pdf --region $REGION 2>/dev/null || true
sleep 5

# Create all functions
for i in "${!FUNCTIONS[@]}"; do
    FUNC="${FUNCTIONS[$i]}"
    LAMBDA_NAME="pdfmaster-$FUNC"
    REPO="${REPOS[$i]}"
    IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
    
    echo "Creating $LAMBDA_NAME..."
    
    aws lambda create-function \
        --function-name $LAMBDA_NAME \
        --package-type Image \
        --code ImageUri=$IMAGE_URI \
        --role $ROLE_ARN \
        --timeout 300 \
        --memory-size 2048 \
        --region $REGION 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[OK] Created $LAMBDA_NAME"
    else
        echo "[ERROR] Failed to create $LAMBDA_NAME"
    fi
    
    sleep 3
done

echo ""
echo "Step 4: Creating Function URLs..."
echo ""

# Create function URLs
for FUNC in "${FUNCTIONS[@]}"; do
    LAMBDA_NAME="pdfmaster-$FUNC"
    
    echo "Creating URL for $LAMBDA_NAME..."
    
    URL=$(aws lambda create-function-url-config \
        --function-name $LAMBDA_NAME \
        --auth-type NONE \
        --cors AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type \
        --region $REGION \
        --query FunctionUrl \
        --output text 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "[OK] $URL"
        echo "$LAMBDA_NAME=$URL" >> /tmp/function-urls.txt
    else
        # Try to get existing URL
        URL=$(aws lambda get-function-url-config \
            --function-name $LAMBDA_NAME \
            --region $REGION \
            --query FunctionUrl \
            --output text 2>&1)
        
        if [ $? -eq 0 ]; then
            echo "[OK] $URL"
            echo "$LAMBDA_NAME=$URL" >> /tmp/function-urls.txt
        else
            echo "[ERROR] Failed to get URL"
        fi
    fi
    
    sleep 2
done

echo ""
echo "============================================"
echo "[SUCCESS] Deployment Complete!"
echo "============================================"
echo ""
echo "Function URLs saved to: /tmp/function-urls.txt"
echo ""
cat /tmp/function-urls.txt
echo ""





