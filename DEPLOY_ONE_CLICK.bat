@echo off
REM ========================================
REM PDFMasterTool - One-Click Deployment
REM ========================================

echo.
echo ========================================
echo   PDFMasterTool - Lambda Deployment
echo   EC2 IP: 34.241.164.163
echo ========================================
echo.

REM Get SSH key path
set /p SSH_KEY="Enter SSH key file path (or press Enter to try without key): "

echo.
echo Connecting to EC2 and deploying...
echo.

if "%SSH_KEY%"=="" (
    REM Try without key
    ssh ec2-user@34.241.164.163 "cd ~/PDFMasterTool/aws && chmod +x ec2-deploy-lambda.sh && ./ec2-deploy-lambda.sh"
) else (
    REM With key
    ssh -i "%SSH_KEY%" ec2-user@34.241.164.163 "cd ~/PDFMasterTool/aws && chmod +x ec2-deploy-lambda.sh && ./ec2-deploy-lambda.sh"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Successful!
    echo   Downloading .env file...
    echo ========================================
    echo.
    
    if "%SSH_KEY%"=="" (
        scp ec2-user@34.241.164.163:~/PDFMasterTool/.env .env
    ) else (
        scp -i "%SSH_KEY%" ec2-user@34.241.164.163:~/PDFMasterTool/.env .env
    )
    
    echo.
    echo ========================================
    echo   .env file downloaded!
    echo ========================================
    echo.
    type .env
    echo.
    echo Save this .env file to: D:\PDFMasterTool\.env
    echo.
) else (
    echo.
    echo ========================================
    echo   Deployment Failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. EC2 is running
    echo 2. SSH key is correct
    echo 3. PDFMasterTool folder exists on EC2
    echo.
)

pause

