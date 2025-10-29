@echo off
REM Deploy remaining 3 PDFMasterTool Lambda functions
REM Run this from aws/ directory

echo ========================================
echo Deploying PDFMasterTool Lambda Functions
echo ========================================
echo.

cd lambda

echo [1/3] Creating pdf-to-excel function...
aws lambda create-function ^
  --function-name pdfmastertool-pdf-to-excel ^
  --runtime nodejs20.x ^
  --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/lambda-execution-role ^
  --handler pdf-to-excel.handler ^
  --zip-file fileb://pdf-to-excel.zip ^
  --timeout 120 ^
  --memory-size 2048 ^
  --region eu-west-1 ^
  --environment Variables={S3_BUCKET=%S3_BUCKET_NAME%,AWS_REGION=eu-west-1}

echo.
echo [2/3] Creating pdf-to-ppt function...
aws lambda create-function ^
  --function-name pdfmastertool-pdf-to-ppt ^
  --runtime nodejs20.x ^
  --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/lambda-execution-role ^
  --handler pdf-to-ppt.handler ^
  --zip-file fileb://pdf-to-ppt.zip ^
  --timeout 120 ^
  --memory-size 2048 ^
  --region eu-west-1 ^
  --environment Variables={S3_BUCKET=%S3_BUCKET_NAME%,AWS_REGION=eu-west-1}

echo.
echo [3/3] Creating ppt-to-pdf function...
aws lambda create-function ^
  --function-name pdfmastertool-ppt-to-pdf ^
  --runtime nodejs20.x ^
  --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/lambda-execution-role ^
  --handler ppt-to-pdf.handler ^
  --zip-file fileb://ppt-to-pdf.zip ^
  --timeout 120 ^
  --memory-size 2048 ^
  --region eu-west-1 ^
  --environment Variables={S3_BUCKET=%S3_BUCKET_NAME%,AWS_REGION=eu-west-1}

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Enable Function URLs for each function in AWS Console
echo 2. Copy the Function URLs
echo 3. Add them to your .env file
echo.
pause











