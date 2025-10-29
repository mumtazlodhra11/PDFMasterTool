@echo off
REM PDFMasterTool AWS Deployment Script for Windows
REM Deploys Lambda functions to AWS Ireland (eu-west-1)

echo.
echo ==================================================
echo   🚀 PDFMasterTool AWS Deployment
echo ==================================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ AWS CLI not found. Please install it first:
    echo    https://aws.amazon.com/cli/
    exit /b 1
)

REM Check if SAM CLI is installed
where sam >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ AWS SAM CLI not found. Please install it:
    echo    choco install aws-sam-cli
    echo    Or visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
    exit /b 1
)

REM Load environment variables from .env
if not exist ..\.env (
    echo ❌ .env file not found!
    exit /b 1
)

echo 📋 Loading AWS credentials from .env...
for /f "usebackq tokens=1,2 delims==" %%a in ("..\.env") do (
    if not "%%a"=="" (
        if not "%%a:~0,1%"=="#" (
            set %%a=%%b
        )
    )
)

REM Configure AWS credentials
echo 🔐 Configuring AWS credentials...
aws configure set aws_access_key_id %AWS_ACCESS_KEY_ID%
aws configure set aws_secret_access_key %AWS_SECRET_ACCESS_KEY%
aws configure set region %AWS_REGION%

REM Verify credentials
echo ✅ Verifying AWS credentials...
for /f "usebackq" %%i in (`aws sts get-caller-identity --query Account --output text`) do set AWS_ACCOUNT=%%i
echo    Account ID: %AWS_ACCOUNT%
echo    Region: %AWS_REGION%
echo.

REM Build Lambda functions
echo 📦 Building Lambda functions...
cd lambda
call npm install --production
cd ..

REM Deploy with SAM
echo 🚀 Deploying to AWS...
echo.

sam deploy ^
  --template-file template.yaml ^
  --stack-name pdfmastertool ^
  --region %AWS_REGION% ^
  --capabilities CAPABILITY_IAM ^
  --no-confirm-changeset ^
  --no-fail-on-empty-changeset

echo.
echo ==================================================
echo   ✅ Deployment Complete!
echo ==================================================
echo.

REM Get function URLs
echo 📋 Lambda Function URLs:
echo.

aws lambda list-function-url-configs ^
  --region %AWS_REGION% ^
  --query "FunctionUrlConfigs[*].[FunctionName,FunctionUrl]" ^
  --output table

echo.
echo 💡 Next Steps:
echo    1. Copy the Function URLs above
echo    2. Update your .env file with these URLs
echo    3. Restart your dev server: npm run dev
echo.
echo 🎉 All 5 conversion tools are now live on AWS!
echo.

pause













