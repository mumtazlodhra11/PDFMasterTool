# ⚡ Quick Start - Deploy in 5 Minutes

**Fastest way to get your backend live!**

---

## 🎯 For EC2 Users (Linux)

```bash
# 1. SSH to EC2
ssh ec2-user@YOUR_EC2_IP

# 2. Upload project (or clone from Git)
git clone YOUR_REPO_URL
cd PDFMasterTool/aws

# 3. Configure AWS (one-time)
aws configure
# Enter your AWS credentials

# 4. Deploy! 🚀
chmod +x ec2-deploy-lambda.sh
./ec2-deploy-lambda.sh

# 5. Done! ✅
# Copy the .env file to your local machine
```

**Time:** 5 minutes  
**Result:** All 5 Lambda functions deployed with URLs

---

## 🪟 For Windows Users

```powershell
# 1. Open PowerShell in project directory
cd D:\PDFMasterTool\aws

# 2. Deploy via EC2
.\deploy-from-windows.ps1 -EC2_HOST "YOUR_EC2_IP"

# 3. Done! ✅
# .env file will be automatically downloaded
```

**Time:** 5 minutes  
**Result:** All 5 Lambda functions deployed, .env downloaded locally

---

## 📝 What You Need

### Before Running:
- [ ] AWS Account
- [ ] EC2 instance running
- [ ] AWS credentials (Access Key + Secret Key)
- [ ] SSH access to EC2

### Get AWS Credentials:
1. Go to AWS Console → IAM
2. Click your user
3. Security credentials → Create access key
4. Choose "CLI" and create
5. Save Access Key ID and Secret Access Key

### Setup EC2:
1. Launch EC2 instance (t3.micro is enough)
2. Security group: Allow SSH (port 22) from your IP
3. Download SSH key (.pem file)
4. Get EC2 Public IP from console

---

## 🚀 Commands Summary

### Linux/EC2:
```bash
./ec2-deploy-lambda.sh
```

### Windows (via EC2):
```powershell
.\deploy-from-windows.ps1 -EC2_HOST "1.2.3.4"
```

### Windows (with SSH key):
```powershell
.\deploy-from-windows.ps1 -EC2_HOST "1.2.3.4" -SSH_KEY "C:\keys\my-key.pem"
```

---

## ✅ Verification

After deployment, check if it worked:

```bash
# Test one function
curl -X POST "YOUR_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"fileContent":"SGVsbG8=","fileName":"test.txt"}'

# Should return: {"success": true, ...}
```

Or run the test script:
```bash
./test-lambda-functions.sh
```

---

## 📋 Expected Output

```
🚀 PDFMasterTool - Lambda Deployment Script
============================================

✅ AWS Account: 123456789012

📦 Deploying: pdfmastertool-word-to-pdf
   ✅ Function URL: https://abc.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-ppt-to-pdf
   ✅ Function URL: https://def.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-word
   ✅ Function URL: https://ghi.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-excel
   ✅ Function URL: https://jkl.lambda-url.us-east-1.on.aws/

📦 Deploying: pdfmastertool-pdf-to-ppt
   ✅ Function URL: https://mno.lambda-url.us-east-1.on.aws/

✅ Deployment Complete! 🎉
```

---

## 🆘 Quick Fixes

### "AWS CLI not found"
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### "Unable to locate credentials"
```bash
aws configure
# Enter your credentials
```

### "Permission denied"
```bash
chmod +x ec2-deploy-lambda.sh
```

### "Cannot connect to EC2"
```bash
# Check security group allows SSH from your IP
# Check key permissions: chmod 400 key.pem
```

---

## 🎉 Success!

Your .env file should look like:

```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxx.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxx.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxx.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxx.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxx.lambda-url.us-east-1.on.aws/
```

---

## 🔥 Next Steps

```bash
# 1. Test locally
npm run dev
# Visit: http://localhost:9001/tools/word-to-pdf

# 2. Build for production
npm run build

# 3. Deploy frontend
vercel --prod
# or
npm run deploy

# 4. Test on production
# Upload a Word file and convert to PDF!
```

---

**That's it! Backend deployed in 5 minutes! 🚀**

For detailed instructions, see:
- `EC2_DEPLOYMENT_GUIDE.md` - Full EC2 guide
- `DEPLOY_README.md` - All deployment options
- `QUICK_DEPLOY.md` - Manual console deployment

