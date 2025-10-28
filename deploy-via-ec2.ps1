# Deploy Lambda Functions via EC2 (Bypass Windows Docker Issues)
# This script creates a temporary EC2 instance, builds images, and deploys Lambda functions

$ErrorActionPreference = "Continue"
$region = "eu-west-1"
$accountId = (aws sts get-caller-identity --query Account --output text)

Write-Host ""
Write-Host "=== Deploy via EC2 (Bypass Local Docker) ===" -ForegroundColor Cyan
Write-Host "Region: $region" -ForegroundColor Yellow
Write-Host "Account: $accountId" -ForegroundColor Yellow
Write-Host ""

# Step 1: Launch EC2 Instance
Write-Host "Step 1: Launching EC2 instance..." -ForegroundColor Cyan

# Get default VPC
$vpcId = aws ec2 describe-vpcs --region $region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

if ($vpcId -eq "None" -or [string]::IsNullOrEmpty($vpcId)) {
    Write-Host "[ERROR] No default VPC found. Creating one..." -ForegroundColor Red
    aws ec2 create-default-vpc --region $region
    Start-Sleep -Seconds 5
    $vpcId = aws ec2 describe-vpcs --region $region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
}

Write-Host "[OK] Using VPC: $vpcId" -ForegroundColor Green

# Get default subnet
$subnetId = aws ec2 describe-subnets --region $region --filters "Name=vpc-id,Values=$vpcId" --query "Subnets[0].SubnetId" --output text

Write-Host "[OK] Using Subnet: $subnetId" -ForegroundColor Green

# Create security group (if doesn't exist)
$sgName = "pdfmaster-ec2-build-sg"
$sgId = aws ec2 describe-security-groups --region $region --filters "Name=group-name,Values=$sgName" --query "SecurityGroups[0].GroupId" --output text 2>$null

if ($sgId -eq "None" -or [string]::IsNullOrEmpty($sgId)) {
    Write-Host "Creating security group..." -ForegroundColor Yellow
    $sgId = aws ec2 create-security-group --group-name $sgName --description "Temporary SG for PDFMaster build" --vpc-id $vpcId --region $region --query "GroupId" --output text
    
    # Allow SSH (optional, for debugging)
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $region 2>$null
    
    Write-Host "[OK] Security group created: $sgId" -ForegroundColor Green
} else {
    Write-Host "[OK] Using existing security group: $sgId" -ForegroundColor Green
}

# Create IAM instance profile (if doesn't exist)
$roleName = "PDFMaster-EC2-Build-Role"
$profileName = "PDFMaster-EC2-Build-Profile"

Write-Host "Setting up IAM role for EC2..." -ForegroundColor Yellow

# Create role
aws iam create-role --role-name $roleName --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}' --region $region 2>$null

# Attach policies
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess" --region $region 2>$null
aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AWSLambda_FullAccess" --region $region 2>$null

# Create instance profile
aws iam create-instance-profile --instance-profile-name $profileName --region $region 2>$null

# Add role to profile
aws iam add-role-to-instance-profile --instance-profile-name $profileName --role-name $roleName --region $region 2>$null

Write-Host "[OK] IAM role configured" -ForegroundColor Green
Write-Host "Waiting for IAM propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# User data script for EC2
$userData = @"
#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install git
yum install -y git

# Create build directory
mkdir -p /home/ec2-user/build
chown ec2-user:ec2-user /home/ec2-user/build

# Signal completion
touch /tmp/setup-complete
"@

$userDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userData))

Write-Host "Launching EC2 instance (t2.medium for Docker)..." -ForegroundColor Yellow

# Launch instance (Amazon Linux 2023)
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

if ([string]::IsNullOrEmpty($instanceId)) {
    Write-Host "[ERROR] Failed to launch EC2 instance!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] EC2 Instance launched: $instanceId" -ForegroundColor Green

# Wait for instance to be running
Write-Host "Waiting for instance to be running..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $state = aws ec2 describe-instances --instance-ids $instanceId --region $region --query "Reservations[0].Instances[0].State.Name" --output text
    
    if ($state -eq "running") {
        Write-Host "[OK] Instance is running!" -ForegroundColor Green
        break
    }
    
    $attempt++
    Write-Host "   Status: $state (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "[SUCCESS] EC2 Instance Ready!" -ForegroundColor Green
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for Docker to install" -ForegroundColor White
Write-Host "2. Run: .\deploy-via-ec2-step2.ps1 $instanceId" -ForegroundColor White
Write-Host ""
Write-Host "Saving instance ID..." -ForegroundColor Yellow
$instanceId | Set-Content "ec2-instance-id.txt"
Write-Host "[OK] Saved to ec2-instance-id.txt" -ForegroundColor Green
Write-Host ""





