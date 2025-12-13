@echo off
echo ======================================
echo Adding LibreOffice Layer to Lambda Functions
echo ======================================
echo.

set LAYER_ARN=arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1
set REGION=eu-west-1

echo [1/5] Updating pdfmastertool-pdf-to-word...
aws lambda update-function-configuration ^
  --function-name pdfmastertool-pdf-to-word ^
  --layers %LAYER_ARN% ^
  --region %REGION%

echo.
echo [2/5] Updating pdfmastertool-word-to-pdf...
aws lambda update-function-configuration ^
  --function-name pdfmastertool-word-to-pdf ^
  --layers %LAYER_ARN% ^
  --region %REGION%

echo.
echo [3/5] Updating pdfmastertool-pdf-to-excel...
aws lambda update-function-configuration ^
  --function-name pdfmastertool-pdf-to-excel ^
  --layers %LAYER_ARN% ^
  --region %REGION%

echo.
echo [4/5] Updating pdfmastertool-pdf-to-ppt...
aws lambda update-function-configuration ^
  --function-name pdfmastertool-pdf-to-ppt ^
  --layers %LAYER_ARN% ^
  --region %REGION%

echo.
echo [5/5] Updating pdfmastertool-ppt-to-pdf...
aws lambda update-function-configuration ^
  --function-name pdfmastertool-ppt-to-pdf ^
  --layers %LAYER_ARN% ^
  --region %REGION%

echo.
echo ======================================
echo Done! All functions updated with LibreOffice layer.
echo ======================================
echo.
echo Next: Test the functions at http://localhost:9001/tools/pdf-to-word
pause













