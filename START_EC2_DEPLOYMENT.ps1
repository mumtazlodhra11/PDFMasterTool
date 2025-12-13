# Automated EC2 Deployment - Start Here!
$ErrorActionPreference = "Continue"
$region = "eu-west-1"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PDFMaster EC2 Deployment (Automated)" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Create IAM role for EC2" -ForegroundColor Gray
Write-Host "  2. Launch EC2 instance (t2.medium)" -ForegroundColor Gray
Write-Host "  3. Upload your code" -ForegroundColor Gray
Write-Host "  4. EC2 will build Docker images (35 min)" -ForegroundColor Gray
Write-Host "  5. Deploy Lambda functions" -ForegroundColor Gray
Write-Host "  6. Get Function URLs" -ForegroundColor Gray
Write-Host ""
Write-Host "Total time: ~45 minutes" -ForegroundColor Yellow
Write-Host "Cost: ~$0.05" -ForegroundColor Yellow
Write-Host ""

$accountId = (aws sts get-caller-identity --query Account --output text)
Write-Host "AWS Account: $accountId" -ForegroundColor Cyan
Write-Host "Region: $region" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create IAM Role
Write-Host "Step 1: Creating IAM role..." -ForegroundColor Yellow

$roleName = "PDFMaster-EC2-Build-Role"
$profileName = "PDFMaster-EC2-Build-Profile"

# Trust policy
@'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
'@ | Set-Content "trust-policy.json"

# Create role
aws iam create-role --role-name $roleName --assume-role-policy-document file://trust-policy.json 2>$null

# Attach policies
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess" 2>$null
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AWSLambda_FullAccess" 2>$null
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" 2>$null

# Create instance profile
aws iam create-instance-profile --instance-profile-name $profileName 2>$null
aws iam add-role-to-instance-profile --instance-profile-name $profileName --role-name $roleName 2>$null

Write-Host "[OK] IAM role created" -ForegroundColor Green
Write-Host "Waiting 10 seconds for IAM propagation..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Step 2: Package code
Write-Host ""
Write-Host "Step 2: Packaging code..." -ForegroundColor Yellow

if (Test-Path "code.zip") {
    Remove-Item "code.zip" -Force
}

Compress-Archive -Path "aws\lambda-containers" -DestinationPath "code.zip" -Force
Write-Host "[OK] Code packaged: code.zip" -ForegroundColor Green

# Step 3: Upload to S3
Write-Host ""
Write-Host "Step 3: Uploading code to S3..." -ForegroundColor Yellow

$bucketName = "pdfmaster-temp-$accountId"
aws s3 mb "s3://$bucketName" --region $region 2>$null
aws s3 cp "code.zip" "s3://$bucketName/" --region $region

Write-Host "[OK] Code uploaded to S3" -ForegroundColor Green

# Step 4: Create EC2 user data script
Write-Host ""
Write-Host "Step 4: Creating EC2 launch script..." -ForegroundColor Yellow

$userData = @"
#!/bin/bash
exec > /var/log/user-data.log 2>&1
set -x

REGION="$region"
ACCOUNT_ID="$accountId"
BUCKET="$bucketName"

# Install Docker
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Download code
mkdir -p /home/ec2-user/build
cd /home/ec2-user/build
aws s3 cp s3://\$BUCKET/code.zip . --region \$REGION
unzip -q code.zip
cd lambda-containers

# ECR Login
aws ecr get-login-password --region \$REGION | docker login --username AWS --password-stdin \${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com

# Build and push all images
FUNCTIONS=(word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt)
REPOS=(pdfmastertool-word-to-pdf pdfmastertool-ppt-to-pdf pdfmastertool-pdf-to-word pdfmastertool-pdf-to-excel pdfmastertool-pdf-to-ppt)

for i in "\${!FUNCTIONS[@]}"; do
  FUNC="\${FUNCTIONS[\$i]}"
  REPO="\${REPOS[\$i]}"
  IMAGE_URI="\${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com/\${REPO}:latest"
  
  echo "Building \$FUNC..."
  docker build -t \$REPO -f \$FUNC/Dockerfile \$FUNC/
  docker tag \${REPO}:latest \$IMAGE_URI
  docker push \$IMAGE_URI
  echo "Pushed \$FUNC"
done

# Deploy Lambda functions
ROLE_ARN=\$(aws iam get-role --role-name PDFMasterLambdaRole --query 'Role.Arn' --output text)

aws lambda delete-function --function-name pdfmaster-word-to-pdf --region \$REGION 2>/dev/null
sleep 5

for i in "\${!FUNCTIONS[@]}"; do
  FUNC="\${FUNCTIONS[\$i]}"
  REPO="\${REPOS[\$i]}"
  LAMBDA_NAME="pdfmaster-\$FUNC"
  IMAGE_URI="\${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com/\${REPO}:latest"
  
  aws lambda create-function \
    --function-name \$LAMBDA_NAME \
    --package-type Image \
    --code ImageUri=\$IMAGE_URI \
    --role \$ROLE_ARN \
    --timeout 300 \
    --memory-size 2048 \
    --region \$REGION
  
  sleep 3
done

# Create Function URLs
for FUNC in "\${FUNCTIONS[@]}"; do
  LAMBDA_NAME="pdfmaster-\$FUNC"
  
  URL=\$(aws lambda create-function-url-config \
    --function-name \$LAMBDA_NAME \
    --auth-type NONE \
    --cors AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type \
    --region \$REGION \
    --query FunctionUrl \
    --output text 2>&1)
  
  if [[ \$? -ne 0 ]]; then
    URL=\$(aws lambda get-function-url-config \
      --function-name \$LAMBDA_NAME \
      --region \$REGION \
      --query FunctionUrl \
      --output text)
  fi
  
  echo "\$LAMBDA_NAME=\$URL" >> /tmp/urls.txt
done

# Upload URLs to S3
aws s3 cp /tmp/urls.txt s3://\$BUCKET/ --region \$REGION

echo "DEPLOYMENT COMPLETE!" > /tmp/deployment-complete
"@

$userDataBytes = [System.Text.Encoding]::UTF8.GetBytes($userData)
$userDataBase64 = [Convert]::ToBase64String($userDataBytes)

Write-Host "[OK] EC2 script prepared" -ForegroundColor Green

# Step 5: Launch EC2
Write-Host ""
Write-Host "Step 5: Launching EC2 instance..." -ForegroundColor Yellow

$instanceId = aws ec2 run-instances `
    --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 `
    --instance-type t2.medium `
    --iam-instance-profile "Name=$profileName" `
    --user-data $userDataBase64 `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=PDFMaster-Build}]" `
    --region $region `
    --query 'Instances[0].InstanceId' `
    --output text

if ([string]::IsNullOrEmpty($instanceId) -or $instanceId -eq "None") {
    Write-Host "[ERROR] Failed to launch EC2!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] EC2 launched: $instanceId" -ForegroundColor Green

# Save instance ID
$instanceId | Set-Content "ec2-instance-id.txt"

# Wait for running
Write-Host ""
Write-Host "Waiting for instance to start..." -ForegroundColor Yellow

$maxWait = 12
$waited = 0

while ($waited -lt $maxWait) {
    $state = aws ec2 describe-instances --instance-ids $instanceId --region $region --query "Reservations[0].Instances[0].State.Name" --output text
    
    if ($state -eq "running") {
        Write-Host "[OK] Instance is running!" -ForegroundColor Green
        break
    }
    
    Write-Host "   Status: $state" -ForegroundColor Gray
    Start-Sleep -Seconds 5
    $waited++
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  EC2 is now building Docker images!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "This will take 35-40 minutes..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host "S3 Bucket: $bucketName" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check progress:" -ForegroundColor White
Write-Host "1. Go to EC2 Console" -ForegroundColor Gray
Write-Host "2. Find instance: PDFMaster-Build" -ForegroundColor Gray
Write-Host "3. Click 'Monitor and troubleshoot' > 'Get system log'" -ForegroundColor Gray
Write-Host ""
Write-Host "When complete (in 40 minutes), run:" -ForegroundColor Yellow
Write-Host "  .\GET_URLS_AND_CLEANUP.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or I can wait and auto-check..." -ForegroundColor Cyan
$wait = Read-Host "Wait here and auto-check? (Y/N)"

if ($wait -eq "Y" -or $wait -eq "y") {
    Write-Host ""
    Write-Host "Waiting 40 minutes for build to complete..." -ForegroundColor Yellow
    Write-Host "(You can press Ctrl+C and run GET_URLS_AND_CLEANUP.ps1 later)" -ForegroundColor Gray
    Write-Host ""
    
    $checkInterval = 120  # Check every 2 minutes
    $totalWait = 0
    $maxTotalWait = 2400  # 40 minutes
    
    while ($totalWait -lt $maxTotalWait) {
        Start-Sleep -Seconds $checkInterval
        $totalWait += $checkInterval
        $minutesWaited = [math]::Floor($totalWait / 60)
        
        Write-Host "[$minutesWaited/40 minutes] Checking build status..." -ForegroundColor Gray
        
        # Check if deployment complete file exists in S3
        $urlsExist = aws s3 ls "s3://$bucketName/urls.txt" --region $region 2>$null
        
        if (-not [string]::IsNullOrEmpty($urlsExist)) {
            Write-Host ""
            Write-Host "[SUCCESS] Build complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Running cleanup script..." -ForegroundColor Yellow
            
            # Run cleanup
            .\GET_URLS_AND_CLEANUP.ps1
            break
        }
    }
    
    if ($totalWait -ge $maxTotalWait) {
        Write-Host ""
        Write-Host "[TIMEOUT] 40 minutes passed. Please check EC2 console." -ForegroundColor Yellow
        Write-Host "Run GET_URLS_AND_CLEANUP.ps1 when ready." -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "OK! Come back in 40 minutes and run:" -ForegroundColor Yellow
    Write-Host "  .\GET_URLS_AND_CLEANUP.ps1" -ForegroundColor White
    Write-Host ""
}









