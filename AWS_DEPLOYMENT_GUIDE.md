# 🚀 AWS Deployment Guide - PDFMasterTool

Complete guide to deploy 5 document conversion tools to AWS Lambda (Ireland region).

---

## ✅ **Prerequisites Checklist**

Before deploying, make sure you have:

- [x] AWS Account (credentials already added to `.env`)
- [x] AWS CLI installed
- [x] AWS SAM CLI installed
- [x] Node.js 20+ installed
- [x] Internet connection

---

## 📦 **What Will Be Deployed**

### **5 Lambda Functions:**
1. PDF to Word (`pdfmastertool-pdf-to-word`)
2. Word to PDF (`pdfmastertool-word-to-pdf`)
3. PDF to Excel (`pdfmastertool-pdf-to-excel`)
4. PDF to PowerPoint (`pdfmastertool-pdf-to-ppt`)
5. PowerPoint to PDF (`pdfmastertool-ppt-to-pdf`)

### **AWS Resources:**
- **Lambda Functions** (5) - Document conversion
- **S3 Bucket** - Temporary file storage (1-day lifecycle)
- **IAM Roles** - Permissions for Lambda → S3 access
- **Function URLs** - Public HTTP endpoints (no API Gateway needed!)

### **Cost Estimate:**
```
Free Tier (1st year):
- Lambda: 1M requests/month FREE
- S3: 5GB storage FREE  
- Data transfer: 100GB/month FREE

Expected cost: $0-10/month (well within free tier)
After free tier: $10-30/month
```

---

## 🔧 **Installation Steps**

### **Step 1: Install AWS CLI**

#### **Windows:**
```powershell
# Download and install from:
https://awscli.amazonaws.com/AWSCLIV2.msi

# Or via Chocolatey:
choco install awscli
```

#### **Verify:**
```bash
aws --version
# Should show: aws-cli/2.x.x
```

---

### **Step 2: Install AWS SAM CLI**

#### **Windows:**
```powershell
# Via Chocolatey (recommended):
choco install aws-sam-cli

# Or download MSI:
https://github.com/aws/aws-sam-cli/releases/latest
```

#### **Verify:**
```bash
sam --version
# Should show: SAM CLI, version 1.x.x
```

---

## 🚀 **Deployment Process**

### **Quick Deployment (Windows):**

```powershell
# Navigate to project root
cd D:\PDFMasterTool

# Run deployment
npm run deploy:aws

# Or manually:
cd aws
.\deploy.bat
```

### **Linux/Mac:**
```bash
cd ~/PDFMasterTool
npm run deploy:aws:bash

# Or manually:
cd aws
bash deploy.sh
```

---

## 📝 **Step-by-Step Deployment**

### **1. Install Lambda Dependencies:**
```bash
cd aws/lambda
npm install --production
cd ..
```

### **2. Deploy with SAM:**
```bash
sam deploy \
  --template-file template.yaml \
  --stack-name pdfmastertool \
  --region eu-west-1 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset
```

### **3. Get Function URLs:**
```bash
aws lambda list-function-url-configs --region eu-west-1
```

You'll see output like:
```json
{
  "FunctionUrlConfigs": [
    {
      "FunctionName": "pdfmastertool-pdf-to-word",
      "FunctionUrl": "https://abc123xyz.lambda-url.eu-west-1.on.aws/"
    },
    ...
  ]
}
```

### **4. Update `.env` File:**

Copy the Function URLs and update your `.env`:

```bash
# .env (update these lines)
PUBLIC_LAMBDA_PDF_TO_WORD=https://abc123xyz.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_WORD_TO_PDF=https://def456uvw.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://ghi789rst.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://jkl012mno.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://pqr345stu.lambda-url.eu-west-1.on.aws/
```

### **5. Restart Dev Server:**
```bash
npm run dev
```

### **6. Test Tools:**
Open http://localhost:9001 and test:
- `/tools/pdf-to-word`
- `/tools/word-to-pdf`
- `/tools/pdf-to-excel`
- `/tools/pdf-to-ppt`
- `/tools/powerpoint-to-pdf`

---

## 🔍 **Troubleshooting**

### **Problem 1: AWS CLI Not Found**
```
Error: 'aws' is not recognized
```
**Solution:**
1. Install AWS CLI from https://aws.amazon.com/cli/
2. Restart terminal after installation
3. Verify: `aws --version`

---

### **Problem 2: SAM CLI Not Found**
```
Error: 'sam' is not recognized
```
**Solution:**
```powershell
# Install via Chocolatey
choco install aws-sam-cli

# Or download from:
# https://github.com/aws/aws-sam-cli/releases/latest
```

---

### **Problem 3: Invalid Credentials**
```
Error: Unable to locate credentials
```
**Solution:**
1. Check `.env` file has correct keys
2. Re-run deployment script (it loads .env automatically)
3. Or manually configure:
```bash
aws configure set aws_access_key_id YOUR_ACCESS_KEY_HERE
aws configure set aws_secret_access_key YOUR_SECRET_KEY_HERE
aws configure set region eu-west-1
```

---

### **Problem 4: LibreOffice Layer Not Found**
```
Error: Layer ARN not found
```
**Solution:**
The template uses a public LibreOffice layer. If it's unavailable:
1. Create your own layer (see: https://github.com/shelfio/libreoffice-lambda-layer)
2. Update `aws/template.yaml` with your layer ARN

---

### **Problem 5: Stack Already Exists**
```
Error: Stack already exists
```
**Solution:**
Update existing stack:
```bash
sam deploy \
  --template-file template.yaml \
  --stack-name pdfmastertool \
  --region eu-west-1 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

---

### **Problem 6: Deployment Timeout**
```
Error: Timeout waiting for stack
```
**Solution:**
Check AWS Console (https://console.aws.amazon.com):
1. Go to CloudFormation
2. Check stack events for errors
3. Common causes:
   - Large Lambda package size
   - Network issues
   - IAM permission problems

---

## 📊 **Verify Deployment**

### **Check Lambda Functions:**
```bash
aws lambda list-functions --region eu-west-1 | grep pdfmastertool
```

Should show 5 functions.

### **Check S3 Bucket:**
```bash
aws s3 ls | grep pdfmastertool
```

Should show 1 bucket.

### **Test Function Directly:**
```bash
# Upload a test file
echo "test" > test.pdf
aws s3 cp test.pdf s3://pdfmastertool-temp-ACCOUNTID/uploads/test.pdf

# Invoke function
aws lambda invoke \
  --function-name pdfmastertool-pdf-to-word \
  --payload '{"fileKey":"uploads/test.pdf","fileName":"test.pdf"}' \
  --region eu-west-1 \
  response.json

cat response.json
```

---

## 🎯 **Post-Deployment**

### **Update Tool Pages:**

All 5 server-side tools will now work automatically:
- ✅ PDF to Word
- ✅ Word to PDF
- ✅ PDF to Excel
- ✅ PDF to PowerPoint
- ✅ PowerPoint to PDF

No code changes needed - `ToolTemplate.tsx` already configured!

---

## 💰 **Cost Monitoring**

### **View Current Usage:**
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=pdfmastertool-pdf-to-word \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-12-31T23:59:59Z \
  --period 2592000 \
  --statistics Sum

# S3 storage
aws s3 ls s3://pdfmastertool-temp-* --summarize --recursive
```

### **Set Billing Alerts:**
1. Go to AWS Console → Billing
2. Set alert for > $10/month
3. Get email notifications

---

## 🔄 **Update Deployment**

When you make changes to Lambda functions:

```bash
cd aws

# Option 1: Full redeploy
npm run deploy:aws

# Option 2: Update single function
aws lambda update-function-code \
  --function-name pdfmastertool-pdf-to-word \
  --zip-file fileb://lambda.zip \
  --region eu-west-1
```

---

## 🗑️ **Cleanup / Delete Stack**

To remove all AWS resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name pdfmastertool \
  --region eu-west-1

# Empty and delete S3 bucket (if needed)
aws s3 rm s3://pdfmastertool-temp-ACCOUNTID --recursive
aws s3 rb s3://pdfmastertool-temp-ACCOUNTID
```

---

## 📋 **Checklist - After Deployment**

- [ ] All 5 Lambda functions created
- [ ] S3 bucket created with lifecycle policy
- [ ] Function URLs copied to `.env`
- [ ] Dev server restarted
- [ ] Tested PDF to Word conversion
- [ ] Tested Word to PDF conversion
- [ ] Tested PDF to Excel conversion
- [ ] Tested PDF to PowerPoint conversion
- [ ] Tested PowerPoint to PDF conversion
- [ ] All tools working correctly
- [ ] Billing alert configured

---

## 🆘 **Support**

### **AWS Documentation:**
- Lambda: https://docs.aws.amazon.com/lambda/
- SAM: https://docs.aws.amazon.com/serverless-application-model/
- S3: https://docs.aws.amazon.com/s3/

### **Common Commands:**
```bash
# View Lambda logs
aws logs tail /aws/lambda/pdfmastertool-pdf-to-word --follow

# List all resources
aws cloudformation describe-stack-resources \
  --stack-name pdfmastertool \
  --region eu-west-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name pdfmastertool \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs'
```

---

## ✅ **Success Indicators**

You know deployment succeeded when:
1. ✅ SAM deploy completes without errors
2. ✅ 5 Function URLs are generated
3. ✅ S3 bucket is created
4. ✅ All tool pages load without errors
5. ✅ File conversions work end-to-end
6. ✅ Files auto-delete from S3 after 1 day

---

**🎉 Deployment Complete! Enjoy your fully functional PDF conversion platform!**

**Total setup time:** 10-15 minutes  
**Monthly cost:** $0-10 (free tier)  
**Tools ready:** 25/30 (20 client-side + 5 server-side)










