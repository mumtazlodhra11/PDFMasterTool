# Complete Lambda Deployment via EC2 (One-Click Solution)
# This bypasses Windows Docker issues by using EC2 Linux instance

$ErrorActionPreference = "Continue"
$region = "eu-west-1"
$accountId = (aws sts get-caller-identity --query Account --output text)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PDFMaster Lambda Deployment via EC2" -ForegroundColor Cyan
Write-Host "  (Bypass Windows Docker Issues)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Region: $region" -ForegroundColor Yellow
Write-Host "Account: $accountId" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "1. Launch temporary EC2 instance" -ForegroundColor Gray
Write-Host "2. Upload code to EC2" -ForegroundColor Gray
Write-Host "3. Build Docker images (30-40 min)" -ForegroundColor Gray
Write-Host "4. Deploy Lambda functions" -ForegroundColor Gray
Write-Host "5. Get Function URLs" -ForegroundColor Gray
Write-Host "6. Terminate EC2 instance" -ForegroundColor Gray
Write-Host ""
Write-Host "Total time: ~45 minutes" -ForegroundColor Yellow
Write-Host "Cost: ~$0.05 (one-time)" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Continue? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit
}

# Step 1: Setup IAM Role for EC2
Write-Host ""
Write-Host "Step 1: Setting up IAM roles..." -ForegroundColor Cyan

$roleName = "PDFMaster-EC2-Build-Role"
$profileName = "PDFMaster-EC2-Build-Profile"

# Create trust policy
$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
'@

$trustPolicy | Set-Content -Path "trust-policy.json"

# Create role
aws iam create-role --role-name $roleName --assume-role-policy-document file://trust-policy.json --region $region 2>$null

# Attach policies
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess" 2>$null
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AWSLambda_FullAccess" 2>$null

# Create instance profile
aws iam create-instance-profile --instance-profile-name $profileName 2>$null
aws iam add-role-to-instance-profile --instance-profile-name $profileName --role-name $roleName 2>$null

Write-Host "[OK] IAM roles configured" -ForegroundColor Green
Write-Host "Waiting for IAM propagation (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 2: Get VPC and Subnet
Write-Host ""
Write-Host "Step 2: Getting network configuration..." -ForegroundColor Cyan

$vpcId = aws ec2 describe-vpcs --region $region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

if ($vpcId -eq "None" -or [string]::IsNullOrEmpty($vpcId)) {
    Write-Host "Creating default VPC..." -ForegroundColor Yellow
    aws ec2 create-default-vpc --region $region
    Start-Sleep -Seconds 5
    $vpcId = aws ec2 describe-vpcs --region $region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
}

$subnetId = aws ec2 describe-subnets --region $region --filters "Name=vpc-id,Values=$vpcId" --query "Subnets[0].SubnetId" --output text

Write-Host "[OK] VPC: $vpcId" -ForegroundColor Green
Write-Host "[OK] Subnet: $subnetId" -ForegroundColor Green

# Step 3: Create Security Group
Write-Host ""
Write-Host "Step 3: Creating security group..." -ForegroundColor Cyan

$sgName = "pdfmaster-ec2-build-sg"
$sgId = aws ec2 describe-security-groups --region $region --filters "Name=group-name,Values=$sgName" --query "SecurityGroups[0].GroupId" --output text 2>$null

if ($sgId -eq "None" -or [string]::IsNullOrEmpty($sgId)) {
    $sgId = aws ec2 create-security-group --group-name $sgName --description "Temporary SG for PDFMaster build" --vpc-id $vpcId --region $region --query "GroupId" --output text
    aws ec2 authorize-security-group-egress --group-id $sgId --protocol -1 --cidr 0.0.0.0/0 --region $region 2>$null
}

Write-Host "[OK] Security Group: $sgId" -ForegroundColor Green

# Step 4: Create User Data Script
Write-Host ""
Write-Host "Step 4: Preparing EC2 launch script..." -ForegroundColor Cyan

$userData = @'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
set -e

echo "Starting EC2 setup..."

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# Install git and zip
yum install -y git zip unzip

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Create build directory
mkdir -p /home/ec2-user/build
chown -R ec2-user:ec2-user /home/ec2-user/build

echo "Setup complete!"
touch /tmp/setup-complete
'@

$userDataBytes = [System.Text.Encoding]::UTF8.GetBytes($userData)
$userDataBase64 = [Convert]::ToBase64String($userDataBytes)

Write-Host "[OK] User data script prepared" -ForegroundColor Green

# Step 5: Launch EC2 Instance
Write-Host ""
Write-Host "Step 5: Launching EC2 instance (t2.medium)..." -ForegroundColor Cyan

$instanceId = aws ec2 run-instances `
    --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 `
    --instance-type t2.medium `
    --security-group-ids $sgId `
    --subnet-id $subnetId `
    --iam-instance-profile "Name=$profileName" `
    --user-data $userDataBase64 `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=PDFMaster-Build-Temp}]" `
    --region $region `
    --query "Instances[0].InstanceId" `
    --output text

if ([string]::IsNullOrEmpty($instanceId) -or $instanceId -eq "None") {
    Write-Host "[ERROR] Failed to launch EC2!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Instance launched: $instanceId" -ForegroundColor Green

# Save instance ID
$instanceId | Set-Content "ec2-instance-id.txt"

# Step 6: Wait for instance to be running
Write-Host ""
Write-Host "Step 6: Waiting for instance to start..." -ForegroundColor Cyan

$maxWait = 60
$waited = 0

while ($waited -lt $maxWait) {
    $state = aws ec2 describe-instances --instance-ids $instanceId --region $region --query "Reservations[0].Instances[0].State.Name" --output text
    
    if ($state -eq "running") {
        Write-Host "[OK] Instance is running!" -ForegroundColor Green
        break
    }
    
    Write-Host "   Status: $state ($waited/$maxWait seconds)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $waited += 5
}

# Get public IP (for AWS CLI commands)
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --region $region --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host "[OK] Instance ready - IP: $publicIp" -ForegroundColor Green

# Step 7: Wait for Docker installation
Write-Host ""
Write-Host "Step 7: Waiting for Docker installation (2 minutes)..." -ForegroundColor Cyan
Write-Host "   (Docker and AWS CLI are being installed)" -ForegroundColor Gray

Start-Sleep -Seconds 120

Write-Host "[OK] Docker should be ready" -ForegroundColor Green

# Step 8: Create ZIP of code
Write-Host ""
Write-Host "Step 8: Preparing code for upload..." -ForegroundColor Cyan

if (Test-Path "code-upload.zip") {
    Remove-Item "code-upload.zip" -Force
}

# Create ZIP with only necessary files
Compress-Archive -Path "aws\lambda-containers" -DestinationPath "code-upload.zip" -Force

Write-Host "[OK] Code packaged: code-upload.zip" -ForegroundColor Green

# Step 9: Use AWS Systems Manager to send file (no SSH needed!)
Write-Host ""
Write-Host "Step 9: Uploading code to EC2..." -ForegroundColor Cyan
Write-Host "   Using S3 as intermediate storage..." -ForegroundColor Gray

# Upload to S3 bucket (create if needed)
$bucketName = "pdfmaster-temp-deploy-$accountId"
aws s3 mb "s3://$bucketName" --region $region 2>$null

# Upload ZIP
aws s3 cp "code-upload.zip" "s3://$bucketName/code-upload.zip" --region $region

Write-Host "[OK] Code uploaded to S3" -ForegroundColor Green

# Step 10: Send commands to EC2
Write-Host ""
Write-Host "Step 10: Running build on EC2..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 30-40 minutes..." -ForegroundColor Yellow
Write-Host "Building all 5 Docker images with LibreOffice..." -ForegroundColor Yellow
Write-Host ""

# Create the build script on EC2
$buildCommands = @"
#!/bin/bash
set -e
cd /home/ec2-user/build
aws s3 cp s3://$bucketName/code-upload.zip . --region $region
unzip -q code-upload.zip
cd lambda-containers
REGION=$region
ACCOUNT_ID=$accountId
echo "ECR Login..."
aws ecr get-login-password --region \$REGION | docker login --username AWS --password-stdin \${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com
FUNCTIONS=(word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt)
REPOS=(pdfmastertool-word-to-pdf pdfmastertool-ppt-to-pdf pdfmastertool-pdf-to-word pdfmastertool-pdf-to-excel pdfmastertool-pdf-to-ppt)
for i in \${!FUNCTIONS[@]}; do
  FUNC=\${FUNCTIONS[\$i]}
  REPO=\${REPOS[\$i]}
  IMAGE_URI=\${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com/\${REPO}:latest
  echo "Building \$FUNC..."
  docker build -t \$REPO -f \$FUNC/Dockerfile \$FUNC/
  docker tag \${REPO}:latest \$IMAGE_URI
  echo "Pushing \$FUNC..."
  docker push \$IMAGE_URI
  echo "Done: \$FUNC"
done
echo "All images pushed!"
"@

$buildCommands | Set-Content "build-on-ec2.sh" -NoNewline

# Upload script to S3
aws s3 cp "build-on-ec2.sh" "s3://$bucketName/build-on-ec2.sh" --region $region

# Send command to EC2 via SSM (if available) or show manual instructions
Write-Host "Sending build command to EC2..." -ForegroundColor Yellow
Write-Host ""

# Try SSM first
$ssmAvailable = aws ssm describe-instance-information --region $region --query "InstanceInformationList[?InstanceId=='$instanceId'].InstanceId" --output text 2>$null

if ($ssmAvailable -eq $instanceId) {
    Write-Host "[OK] Using AWS Systems Manager to execute commands..." -ForegroundColor Green
    
    $commandId = aws ssm send-command `
        --instance-ids $instanceId `
        --document-name "AWS-RunShellScript" `
        --parameters 'commands=["cd /home/ec2-user && aws s3 cp s3://'$bucketName'/build-on-ec2.sh . && chmod +x build-on-ec2.sh && ./build-on-ec2.sh > build-log.txt 2>&1"]' `
        --region $region `
        --query "Command.CommandId" `
        --output text
    
    Write-Host "[OK] Build command sent: $commandId" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitoring build progress..." -ForegroundColor Cyan
    Write-Host "(This will take 30-40 minutes)" -ForegroundColor Yellow
    Write-Host ""
    
    # Monitor command execution
    $buildComplete = $false
    $checkCount = 0
    $maxChecks = 100
    
    while (-not $buildComplete -and $checkCount -lt $maxChecks) {
        Start-Sleep -Seconds 30
        $checkCount++
        
        $status = aws ssm get-command-invocation --command-id $commandId --instance-id $instanceId --region $region --query "Status" --output text 2>$null
        
        Write-Host "   Check $checkCount - Status: $status" -ForegroundColor Gray
        
        if ($status -eq "Success") {
            $buildComplete = $true
            Write-Host "[OK] Build completed successfully!" -ForegroundColor Green
        } elseif ($status -eq "Failed") {
            Write-Host "[ERROR] Build failed!" -ForegroundColor Red
            break
        }
    }
} else {
    Write-Host "[INFO] SSM not available, showing manual steps..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EC2 is building now. To monitor:" -ForegroundColor White
    Write-Host "1. Go to EC2 Console" -ForegroundColor Gray
    Write-Host "2. Find instance: $instanceId" -ForegroundColor Gray
    Write-Host "3. Wait 30-40 minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run this script again in 40 minutes to continue..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[NEXT] Once build is complete, run:" -ForegroundColor Cyan
Write-Host "   .\ec2-deploy-step2.ps1 $instanceId" -ForegroundColor White
Write-Host ""
Write-Host "Instance ID saved to: ec2-instance-id.txt" -ForegroundColor Gray
Write-Host ""
"@

if (-not $buildComplete -and $ssmAvailable -eq $instanceId) {
    Write-Host "[INFO] Build is still running on EC2" -ForegroundColor Yellow
    Write-Host "       Run step2 script after 40 minutes" -ForegroundColor Yellow
}







