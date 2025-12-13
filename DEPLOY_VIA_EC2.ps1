# Simple EC2 Deployment Solution
# This creates an EC2 instance that will build and deploy everything

$region = "eu-west-1"

Write-Host ""
Write-Host "=== PDFMaster EC2 Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Launch EC2
Write-Host "Launching EC2 instance..." -ForegroundColor Yellow

aws ec2 run-instances --cli-input-json @"
{
  "ImageId": "resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64",
  "InstanceType": "t2.medium",
  "KeyName": "",
  "IamInstanceProfile": {
    "Name": "PDFMaster-EC2-Build-Profile"
  },
  "TagSpecifications": [{
    "ResourceType": "instance",
    "Tags": [{"Key": "Name", "Value": "PDFMaster-Build"}]
  }],
  "UserData": "$(
    $script = @'
#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
'@
    [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($script))
  )"
}
"@ --region $region

Write-Host "[OK] EC2 launching..." -ForegroundColor Green
Write-Host ""
Write-Host "Check EC2 console for instance details" -ForegroundColor Yellow









