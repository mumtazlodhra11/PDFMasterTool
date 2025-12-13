# Upload fixed Dockerfiles to S3 for EC2

Write-Host "📦 Creating updated zip with fixed Dockerfiles..." -ForegroundColor Cyan

# Remove old zip
if (Test-Path "lambda-containers-fixed.zip") {
    Remove-Item "lambda-containers-fixed.zip" -Force
}

# Create zip with updated files
Compress-Archive -Path "aws\lambda-containers" -DestinationPath "lambda-containers-fixed.zip" -Force

Write-Host "✅ Zip created: lambda-containers-fixed.zip" -ForegroundColor Green
Write-Host ""

# Upload to S3
Write-Host "📤 Uploading to S3..." -ForegroundColor Cyan
aws s3 cp "lambda-containers-fixed.zip" "s3://pdfmastertool-builds/source/lambda-containers-ec2.zip" --region eu-west-1

Write-Host ""
Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 On EC2, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd ~" -ForegroundColor Cyan
Write-Host "aws s3 cp s3://pdfmastertool-builds/source/lambda-containers-ec2.zip . --region eu-west-1" -ForegroundColor Cyan
Write-Host "rm -rf lambda-containers  # Remove old" -ForegroundColor Cyan
Write-Host "unzip -q -o lambda-containers-ec2.zip -d ." -ForegroundColor Cyan
Write-Host "cd lambda-containers/lambda-containers" -ForegroundColor Cyan
Write-Host "ls -la  # Verify Dockerfiles" -ForegroundColor Cyan
Write-Host ""














