@echo off
echo ============================================
echo Building Lambda Containers with LibreOffice
echo ============================================
echo.
echo This will take 30-45 minutes (first time)
echo LibreOffice needs to be downloaded and built into images
echo.
pause

set ACCOUNT_ID=137288645009
set REGION=eu-west-1
set ECR_BASE=%ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com

echo.
echo [Step 1/4] Login to AWS ECR...
aws ecr get-login-password --region %REGION% | docker login --username AWS --password-stdin %ECR_BASE%

echo.
echo [Step 2/4] Creating ECR repositories...
aws ecr create-repository --repository-name pdfmastertool-pdf-to-word --region %REGION% 2>nul
aws ecr create-repository --repository-name pdfmastertool-word-to-pdf --region %REGION% 2>nul
aws ecr create-repository --repository-name pdfmastertool-pdf-to-excel --region %REGION% 2>nul
aws ecr create-repository --repository-name pdfmastertool-pdf-to-ppt --region %REGION% 2>nul
aws ecr create-repository --repository-name pdfmastertool-ppt-to-pdf --region %REGION% 2>nul

echo.
echo [Step 3/4] Building Docker images... (This will take time!)
echo.

echo Building PDF to Word...
cd pdf-to-word
docker build -t pdfmastertool-pdf-to-word:latest .
docker tag pdfmastertool-pdf-to-word:latest %ECR_BASE%/pdfmastertool-pdf-to-word:latest
docker push %ECR_BASE%/pdfmastertool-pdf-to-word:latest
cd ..

echo.
echo Building Word to PDF...
cd word-to-pdf
docker build -t pdfmastertool-word-to-pdf:latest .
docker tag pdfmastertool-word-to-pdf:latest %ECR_BASE%/pdfmastertool-word-to-pdf:latest
docker push %ECR_BASE%/pdfmastertool-word-to-pdf:latest
cd ..

echo.
echo Building PDF to Excel...
cd pdf-to-excel
docker build -t pdfmastertool-pdf-to-excel:latest .
docker tag pdfmastertool-pdf-to-excel:latest %ECR_BASE%/pdfmastertool-pdf-to-excel:latest
docker push %ECR_BASE%/pdfmastertool-pdf-to-excel:latest
cd ..

echo.
echo Building PDF to PPT...
cd pdf-to-ppt
docker build -t pdfmastertool-pdf-to-ppt:latest .
docker tag pdfmastertool-pdf-to-ppt:latest %ECR_BASE%/pdfmastertool-pdf-to-ppt:latest
docker push %ECR_BASE%/pdfmastertool-pdf-to-ppt:latest
cd ..

echo.
echo Building PPT to PDF...
cd ppt-to-pdf
docker build -t pdfmastertool-ppt-to-pdf:latest .
docker tag pdfmastertool-ppt-to-pdf:latest %ECR_BASE%/pdfmastertool-ppt-to-pdf:latest
docker push %ECR_BASE%/pdfmastertool-ppt-to-pdf:latest
cd ..

echo.
echo [Step 4/4] Creating Lambda functions with Image type...

aws lambda create-function ^
  --function-name pdfmastertool-pdf-to-word ^
  --package-type Image ^
  --code ImageUri=%ECR_BASE%/pdfmastertool-pdf-to-word:latest ^
  --role arn:aws:iam::%ACCOUNT_ID%:role/Pdfmaster ^
  --timeout 900 ^
  --memory-size 3008 ^
  --region %REGION% 2>nul

aws lambda create-function-url-config ^
  --function-name pdfmastertool-pdf-to-word ^
  --auth-type NONE ^
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
  --region %REGION% 2>nul

aws lambda add-permission ^
  --function-name pdfmastertool-pdf-to-word ^
  --statement-id FunctionURLAllowPublicAccess ^
  --action lambda:InvokeFunctionUrl ^
  --principal "*" ^
  --function-url-auth-type NONE ^
  --region %REGION% 2>nul

aws lambda create-function ^
  --function-name pdfmastertool-word-to-pdf ^
  --package-type Image ^
  --code ImageUri=%ECR_BASE%/pdfmastertool-word-to-pdf:latest ^
  --role arn:aws:iam::%ACCOUNT_ID%:role/Pdfmaster ^
  --timeout 900 ^
  --memory-size 3008 ^
  --region %REGION% 2>nul

aws lambda create-function-url-config ^
  --function-name pdfmastertool-word-to-pdf ^
  --auth-type NONE ^
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
  --region %REGION% 2>nul

aws lambda add-permission ^
  --function-name pdfmastertool-word-to-pdf ^
  --statement-id FunctionURLAllowPublicAccess ^
  --action lambda:InvokeFunctionUrl ^
  --principal "*" ^
  --function-url-auth-type NONE ^
  --region %REGION% 2>nul

aws lambda create-function ^
  --function-name pdfmastertool-pdf-to-excel ^
  --package-type Image ^
  --code ImageUri=%ECR_BASE%/pdfmastertool-pdf-to-excel:latest ^
  --role arn:aws:iam::%ACCOUNT_ID%:role/Pdfmaster ^
  --timeout 900 ^
  --memory-size 3008 ^
  --region %REGION% 2>nul

aws lambda create-function-url-config ^
  --function-name pdfmastertool-pdf-to-excel ^
  --auth-type NONE ^
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
  --region %REGION% 2>nul

aws lambda add-permission ^
  --function-name pdfmastertool-pdf-to-excel ^
  --statement-id FunctionURLAllowPublicAccess ^
  --action lambda:InvokeFunctionUrl ^
  --principal "*" ^
  --function-url-auth-type NONE ^
  --region %REGION% 2>nul

aws lambda create-function ^
  --function-name pdfmastertool-pdf-to-ppt ^
  --package-type Image ^
  --code ImageUri=%ECR_BASE%/pdfmastertool-pdf-to-ppt:latest ^
  --role arn:aws:iam::%ACCOUNT_ID%:role/Pdfmaster ^
  --timeout 900 ^
  --memory-size 3008 ^
  --region %REGION% 2>nul

aws lambda create-function-url-config ^
  --function-name pdfmastertool-pdf-to-ppt ^
  --auth-type NONE ^
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
  --region %REGION% 2>nul

aws lambda add-permission ^
  --function-name pdfmastertool-pdf-to-ppt ^
  --statement-id FunctionURLAllowPublicAccess ^
  --action lambda:InvokeFunctionUrl ^
  --principal "*" ^
  --function-url-auth-type NONE ^
  --region %REGION% 2>nul

aws lambda create-function ^
  --function-name pdfmastertool-ppt-to-pdf ^
  --package-type Image ^
  --code ImageUri=%ECR_BASE%/pdfmastertool-ppt-to-pdf:latest ^
  --role arn:aws:iam::%ACCOUNT_ID%:role/Pdfmaster ^
  --timeout 900 ^
  --memory-size 3008 ^
  --region %REGION% 2>nul

aws lambda create-function-url-config ^
  --function-name pdfmastertool-ppt-to-pdf ^
  --auth-type NONE ^
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
  --region %REGION% 2>nul

aws lambda add-permission ^
  --function-name pdfmastertool-ppt-to-pdf ^
  --statement-id FunctionURLAllowPublicAccess ^
  --action lambda:InvokeFunctionUrl ^
  --principal "*" ^
  --function-url-auth-type NONE ^
  --region %REGION% 2>nul

echo.
echo ============================================
echo Done! All Lambda functions updated!
echo ============================================
echo.
echo Test at: http://localhost:9001/tools/pdf-to-word
echo.
pause


