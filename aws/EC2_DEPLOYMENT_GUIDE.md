# 🚀 EC2 Backend Deployment Guide

Complete guide to deploy Lambda functions from EC2 instance.

---

## 📋 Prerequisites

### On Your Local Machine (Windows):
- AWS Account with Admin access
- EC2 instance running (Ubuntu/Amazon Linux)
- SSH access to EC2
- Project files ready

### On EC2 Instance:
- Node.js 20.x installed
- AWS CLI configured
- Git installed

---

## 🎯 Quick Start (Copy-Paste Method)

### Step 1: Upload Files to EC2

From your **local Windows machine**:

```powershell
# Navigate to project directory
cd D:\PDFMasterTool

# Option A: Using SCP (if you have it)
scp -r aws/lambda/*.zip ec2-user@YOUR_EC2_IP:/home/ec2-user/lambda/
scp aws/ec2-deploy-lambda.sh ec2-user@YOUR_EC2_IP:/home/ec2-user/

# Option B: Using Git (recommended)
# On your EC2, just clone the repo
ssh ec2-user@YOUR_EC2_IP
git clone https://github.com/YOUR_REPO/PDFMasterTool.git
cd PDFMasterTool/aws
```

---

## 🚀 Automated Deployment (Recommended)

### On EC2 Instance:

```bash
# 1. Connect to EC2
ssh ec2-user@YOUR_EC2_IP

# 2. Navigate to project
cd PDFMasterTool/aws

# 3. Make script executable
chmod +x ec2-deploy-lambda.sh

# 4. Configure AWS CLI (if not done)
aws configure
# Enter:
#   AWS Access Key ID: YOUR_ACCESS_KEY
#   AWS Secret Access Key: YOUR_SECRET_KEY
#   Default region: us-east-1
#   Default output format: json

# 5. Run deployment script
./ec2-deploy-lambda.sh

# 6. Done! 🎉
```

The script will:
- ✅ Check/install AWS CLI
- ✅ Verify credentials
- ✅ Create IAM role
- ✅ Deploy all 5 Lambda functions
- ✅ Enable Function URLs with CORS
- ✅ Generate .env file
- ✅ Display all Function URLs

---

## 📝 Manual Deployment (Step by Step)

If automated script fails, use manual method:

### 1. Setup AWS CLI on EC2

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure
aws configure
```

### 2. Create IAM Role

```bash
# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create role
aws iam create-role \
  --role-name PDFMasterTool-Lambda-Role \
  --assume-role-policy-document file://trust-policy.json

# Attach policy
aws iam attach-role-policy \
  --role-name PDFMasterTool-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get Role ARN (save this!)
aws iam get-role --role-name PDFMasterTool-Lambda-Role --query 'Role.Arn' --output text
```

### 3. Deploy Each Lambda Function

```bash
cd lambda

# Get your Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/PDFMasterTool-Lambda-Role"

# Deploy Word to PDF
aws lambda create-function \
  --function-name pdfmastertool-word-to-pdf \
  --runtime nodejs20.x \
  --role "$ROLE_ARN" \
  --handler word-to-pdf.handler \
  --zip-file fileb://word-to-pdf.zip \
  --timeout 120 \
  --memory-size 2048 \
  --region us-east-1

# Enable Function URL
aws lambda create-function-url-config \
  --function-name pdfmastertool-word-to-pdf \
  --auth-type NONE \
  --cors "AllowOrigins=*,AllowMethods=POST,AllowHeaders=*" \
  --region us-east-1

# Get Function URL
aws lambda get-function-url-config \
  --function-name pdfmastertool-word-to-pdf \
  --region us-east-1

# Repeat for other 4 functions:
# - ppt-to-pdf.zip
# - pdf-to-word.zip
# - pdf-to-excel.zip
# - pdf-to-ppt.zip
```

### 4. Get All Function URLs

```bash
# List all function URLs
for func in word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt; do
  echo "=== pdfmastertool-${func} ==="
  aws lambda get-function-url-config \
    --function-name "pdfmastertool-${func}" \
    --query 'FunctionUrl' \
    --output text \
    --region us-east-1
  echo ""
done
```

---

## 📥 Download .env File to Local Machine

After deployment on EC2, download the generated .env file:

```bash
# On your Windows machine
scp ec2-user@YOUR_EC2_IP:/home/ec2-user/PDFMasterTool/.env D:\PDFMasterTool\
```

Or copy-paste the content manually.

---

## 🧪 Test Lambda Functions

### Test from EC2:

```bash
# Test Word to PDF
FUNCTION_URL=$(aws lambda get-function-url-config \
  --function-name pdfmastertool-word-to-pdf \
  --query 'FunctionUrl' \
  --output text)

curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"fileContent":"SGVsbG8gV29ybGQ=","fileName":"test.txt"}'
```

### Test from Local Machine:

```powershell
# PowerShell
$url = "https://xxxx.lambda-url.us-east-1.on.aws/"
Invoke-RestMethod -Uri $url -Method POST -Body '{"fileContent":"SGVsbG8=","fileName":"test.txt"}' -ContentType "application/json"
```

---

## 🔧 Troubleshooting

### Issue: "AWS CLI not found"
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Issue: "Credentials not configured"
```bash
aws configure
# Or use environment variables:
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1
```

### Issue: "Role creation failed"
```bash
# Check if role already exists
aws iam get-role --role-name PDFMasterTool-Lambda-Role

# If exists, just use it
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/PDFMasterTool-Lambda-Role"
```

### Issue: "Function already exists"
```bash
# Update existing function
aws lambda update-function-code \
  --function-name pdfmastertool-word-to-pdf \
  --zip-file fileb://word-to-pdf.zip
```

### Issue: "Permission denied on Function URL"
```bash
# Add permission
aws lambda add-permission \
  --function-name pdfmastertool-word-to-pdf \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE
```

---

## 🎯 Expected Output

After successful deployment:

```
🚀 PDFMasterTool - Lambda Deployment Script
============================================

✅ AWS Account: 123456789012

📦 Deploying: pdfmastertool-word-to-pdf
   ✅ Function URL: https://abc123.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-ppt-to-pdf
   ✅ Function URL: https://def456.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-word
   ✅ Function URL: https://ghi789.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-excel
   ✅ Function URL: https://jkl012.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-ppt
   ✅ Function URL: https://mno345.lambda-url.us-east-1.on.aws/

✅ .env file created
```

---

## 📊 Cost Estimation

**EC2 Instance (t3.micro):**
- $7.50/month (~$0.01/hour)
- Can be stopped when not deploying

**Lambda Functions:**
- First 1M requests/month: FREE
- First 400,000 GB-seconds: FREE
- After that: ~$0.20 per 1,000 requests

**Total Cost:**
- Development: <$10/month
- Production (10K requests/month): <$15/month

---

## ✅ Checklist

- [ ] EC2 instance running
- [ ] SSH access to EC2
- [ ] AWS CLI configured on EC2
- [ ] Lambda ZIP files on EC2
- [ ] IAM role created
- [ ] All 5 functions deployed
- [ ] Function URLs obtained
- [ ] .env file created
- [ ] Functions tested
- [ ] .env copied to local machine
- [ ] Frontend updated with URLs
- [ ] End-to-end test passed

---

## 🚢 After Deployment

### Update Frontend

```bash
# On local machine
cd D:\PDFMasterTool

# Make sure .env has the Function URLs
cat .env

# Test locally
npm run dev

# Build for production
npm run build

# Deploy frontend (Vercel/Netlify)
vercel --prod
```

---

## 💡 Pro Tips

1. **Keep EC2 Running**: If deploying frequently
2. **Use Elastic IP**: For consistent EC2 IP address
3. **Enable CloudWatch**: For monitoring Lambda logs
4. **Set Alarms**: Get notified of errors
5. **Tag Resources**: Add tag `Project: PDFMasterTool`
6. **Backup .env**: Keep Function URLs safe
7. **Use Secrets Manager**: For production credentials

---

## 🎉 Success!

Your Lambda functions are now deployed and ready to use!

**Test Tools:**
- Word to PDF: http://localhost:9001/tools/word-to-pdf
- PPT to PDF: http://localhost:9001/tools/powerpoint-to-pdf
- PDF to Word: http://localhost:9001/tools/pdf-to-word
- PDF to Excel: http://localhost:9001/tools/pdf-to-excel
- PDF to PPT: http://localhost:9001/tools/pdf-to-ppt

**Chalo production mein deploy karte hain! 🚀**

