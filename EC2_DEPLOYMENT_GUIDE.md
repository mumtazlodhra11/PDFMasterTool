# 🚀 Deploy via EC2 - Simple Guide

## Why EC2?
Windows Docker issues کو bypass کرنے کے لیے - EC2 Linux پر Docker perfectly کام کرتا ہے!

---

## ⏱️ Total Time: 45 minutes
## 💰 Cost: ~$0.05 (one-time)

---

## 📋 Step 1: Launch EC2 Instance (5 minutes)

### Run this command:

```powershell
aws ec2 run-instances `
  --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 `
  --instance-type t2.medium `
  --iam-instance-profile Name=PDFMaster-EC2-Build-Profile `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=PDFMaster-Build}]' `
  --region eu-west-1 `
  --query 'Instances[0].InstanceId' `
  --output text
```

### You'll get an Instance ID like: `i-1234567890abcdef`

**Save this ID!**

---

## 📋 Step 2: Wait & Connect (2 minutes)

### Go to AWS Console:
1. Open EC2 Dashboard
2. Find your instance: **PDFMaster-Build**
3. Wait until "Status Check" = `2/2 checks passed`
4. Click "Connect" → "Session Manager" → "Connect"

You'll get a terminal in your browser!

---

## 📋 Step 3: Install Docker (3 minutes)

### In the EC2 terminal, run these commands:

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
docker --version
aws --version

echo "Setup complete!"
```

---

## 📋 Step 4: Upload Code (2 minutes)

### On your Windows machine:

```powershell
# Create ZIP of Lambda containers
Compress-Archive -Path "aws\lambda-containers" -DestinationPath "code.zip" -Force

# Upload to S3
$accountId = (aws sts get-caller-identity --query Account --output text)
aws s3 mb "s3://pdfmaster-temp-$accountId" --region eu-west-1
aws s3 cp "code.zip" "s3://pdfmaster-temp-$accountId/" --region eu-west-1

echo "Code uploaded!"
```

---

## 📋 Step 5: Download & Extract on EC2 (1 minute)

### Back in EC2 terminal:

```bash
# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Download code
aws s3 cp "s3://pdfmaster-temp-$ACCOUNT_ID/code.zip" . --region eu-west-1

# Extract
unzip code.zip
cd lambda-containers

echo "Code ready!"
```

---

## 📋 Step 6: Build & Push Images (30-35 minutes) ☕

### In EC2 terminal:

```bash
#!/bin/bash
REGION="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR Login
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Build and push all 5 images
FUNCTIONS=(word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt)
REPOS=(pdfmastertool-word-to-pdf pdfmastertool-ppt-to-pdf pdfmastertool-pdf-to-word pdfmastertool-pdf-to-excel pdfmastertool-pdf-to-ppt)

for i in "${!FUNCTIONS[@]}"; do
  FUNC="${FUNCTIONS[$i]}"
  REPO="${REPOS[$i]}"
  IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
  
  echo "[$((i+1))/5] Building $FUNC..."
  docker build -t $REPO -f $FUNC/Dockerfile $FUNC/
  docker tag ${REPO}:latest $IMAGE_URI
  
  echo "Pushing $FUNC..."
  docker push $IMAGE_URI
  
  echo "✓ Done: $FUNC"
  echo ""
done

echo "All images pushed!"
```

**Wait 30-35 minutes... Go have coffee! ☕**

---

## 📋 Step 7: Deploy Lambda Functions (2 minutes)

### In EC2 terminal:

```bash
REGION="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN=$(aws iam get-role --role-name PDFMasterLambdaRole --query 'Role.Arn' --output text)

# Delete old word-to-pdf (ZIP version)
aws lambda delete-function --function-name pdfmaster-word-to-pdf --region $REGION 2>/dev/null
sleep 5

# Create all 5 functions
FUNCTIONS=(word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt)
REPOS=(pdfmastertool-word-to-pdf pdfmastertool-ppt-to-pdf pdfmastertool-pdf-to-word pdfmastertool-pdf-to-excel pdfmastertool-pdf-to-ppt)

for i in "${!FUNCTIONS[@]}"; do
  FUNC="${FUNCTIONS[$i]}"
  REPO="${REPOS[$i]}"
  LAMBDA_NAME="pdfmaster-$FUNC"
  IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"
  
  echo "Creating $LAMBDA_NAME..."
  aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --package-type Image \
    --code ImageUri=$IMAGE_URI \
    --role $ROLE_ARN \
    --timeout 300 \
    --memory-size 2048 \
    --region $REGION
  
  sleep 3
done

echo "All functions created!"
```

---

## 📋 Step 8: Create Function URLs (1 minute)

### In EC2 terminal:

```bash
REGION="eu-west-1"
FUNCTIONS=(word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt)

echo "Function URLs:" > urls.txt

for FUNC in "${FUNCTIONS[@]}"; do
  LAMBDA_NAME="pdfmaster-$FUNC"
  
  URL=$(aws lambda create-function-url-config \
    --function-name $LAMBDA_NAME \
    --auth-type NONE \
    --cors AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type \
    --region $REGION \
    --query FunctionUrl \
    --output text 2>&1)
  
  if [[ $? -ne 0 ]]; then
    URL=$(aws lambda get-function-url-config \
      --function-name $LAMBDA_NAME \
      --region $REGION \
      --query FunctionUrl \
      --output text)
  fi
  
  echo "$LAMBDA_NAME=$URL" >> urls.txt
  echo "✓ $LAMBDA_NAME"
  echo "  $URL"
done

echo ""
echo "URLs saved to urls.txt"
cat urls.txt
```

---

## 📋 Step 9: Download URLs (1 minute)

### In EC2 terminal:

```bash
# Upload URLs to S3
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3 cp urls.txt "s3://pdfmaster-temp-$ACCOUNT_ID/" --region eu-west-1

echo "URLs uploaded to S3!"
```

### On your Windows machine:

```powershell
# Download URLs
$accountId = (aws sts get-caller-identity --query Account --output text)
aws s3 cp "s3://pdfmaster-temp-$accountId/urls.txt" . --region eu-west-1

# Display
Get-Content urls.txt

# Parse and update .env
$urls = Get-Content urls.txt
$envContent = Get-Content .env -Raw

# Update .env with URLs
# (I'll create a script for this)
```

---

## 📋 Step 10: Cleanup EC2 (1 minute)

### On your Windows machine:

```powershell
# Terminate EC2 instance
$instanceId = "i-xxxxx"  # Your instance ID from Step 1
aws ec2 terminate-instances --instance-ids $instanceId --region eu-west-1

# Delete S3 bucket
$accountId = (aws sts get-caller-identity --query Account --output text)
aws s3 rb "s3://pdfmaster-temp-$accountId" --force --region eu-west-1

echo "Cleanup complete!"
```

---

## ✅ Done!

Your Lambda functions are now deployed!

### Test:
```powershell
npm run dev
```

Go to http://localhost:4321 and test the PDF conversion tools!

---

## 📊 Summary:

| Step | Time | Description |
|------|------|-------------|
| 1 | 5m | Launch EC2 |
| 2 | 2m | Connect |
| 3 | 3m | Install Docker |
| 4 | 2m | Upload code |
| 5 | 1m | Download on EC2 |
| 6 | 35m | Build images ☕ |
| 7 | 2m | Deploy functions |
| 8 | 1m | Create URLs |
| 9 | 1m | Download URLs |
| 10 | 1m | Cleanup |
| **Total** | **~45m** | |

**Cost: ~$0.05** (t2.medium × 45 minutes)

---

## 💡 Tip:

After Step 6 starts, you can close the terminal and come back after 35 minutes!

---

**Ready to start? Run Step 1!** 🚀









