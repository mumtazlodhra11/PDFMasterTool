@echo off
REM 🚀 Simple Windows Deployment Script
REM Deploy Lambda functions via EC2

echo.
echo ======================================
echo    PDFMasterTool - Lambda Deployment
echo ======================================
echo.

REM Check if PowerShell is available
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PS_CMD=pwsh
) else (
    set PS_CMD=powershell
)

REM Get EC2 host from user
set /p EC2_HOST="Enter your EC2 IP address or hostname: "

if "%EC2_HOST%"=="" (
    echo Error: EC2 host is required!
    pause
    exit /b 1
)

REM Ask for SSH key
set /p SSH_KEY="Enter path to SSH key file (or press Enter to skip): "

echo.
echo Starting deployment...
echo EC2 Host: %EC2_HOST%
echo.

if "%SSH_KEY%"=="" (
    REM Deploy without SSH key
    %PS_CMD% -ExecutionPolicy Bypass -File "%~dp0deploy-from-windows.ps1" -EC2_HOST "%EC2_HOST%"
) else (
    REM Deploy with SSH key
    %PS_CMD% -ExecutionPolicy Bypass -File "%~dp0deploy-from-windows.ps1" -EC2_HOST "%EC2_HOST%" -SSH_KEY "%SSH_KEY%"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================
    echo    Deployment Failed!
    echo ======================================
    pause
    exit /b 1
)

echo.
echo ======================================
echo    Deployment Complete! 
echo ======================================
echo.
echo Check .env file for Function URLs
echo.
pause
