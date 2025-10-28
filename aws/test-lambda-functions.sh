#!/bin/bash
# 🧪 Test All Lambda Functions

set -e

echo "🧪 Testing Lambda Functions"
echo "==========================="
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ .env file not found!"
    echo "Run ./ec2-deploy-lambda.sh first"
    exit 1
fi

# Load environment variables
source ../.env

# Test data (base64 encoded "Hello World")
TEST_DATA='SGVsbG8gV29ybGQ='

# Function to test Lambda
test_lambda() {
    local name=$1
    local url=$2
    
    echo "Testing: $name"
    echo "URL: $url"
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "{\"fileContent\":\"$TEST_DATA\",\"fileName\":\"test.txt\"}" \
        -w "\nHTTP_CODE:%{http_code}")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | grep -v "HTTP_CODE:")
    
    if [ "$http_code" == "200" ]; then
        echo "✅ Success! Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "❌ Failed! HTTP Code: $http_code"
        echo "$body"
    fi
    echo ""
}

# Test all functions
echo "📋 Testing all Lambda functions..."
echo ""

test_lambda "Word to PDF" "$PUBLIC_LAMBDA_WORD_TO_PDF"
test_lambda "PPT to PDF" "$PUBLIC_LAMBDA_PPT_TO_PDF"
test_lambda "PDF to Word" "$PUBLIC_LAMBDA_PDF_TO_WORD"
test_lambda "PDF to Excel" "$PUBLIC_LAMBDA_PDF_TO_EXCEL"
test_lambda "PDF to PPT" "$PUBLIC_LAMBDA_PDF_TO_PPT"

echo "✅ All tests completed!"

