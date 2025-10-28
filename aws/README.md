# 🚀 PDFMasterTool - Backend Deployment

Complete backend deployment package for PDFMasterTool Lambda functions.

---

## 📦 What's Inside

### 🛠️ Deployment Tools
- **ec2-deploy-lambda.sh** - Automated Linux deployment script
- **deploy-from-windows.ps1** - Windows → EC2 remote deployment
- **deploy-simple.bat** - Easy Windows deployment (double-click)
- **test-lambda-functions.sh** - Test all deployed functions

### 📚 Documentation
- **DEPLOYMENT_SUMMARY.md** - Complete overview (START HERE!)
- **QUICK_START.md** - Deploy in 5 minutes
- **EC2_DEPLOYMENT_GUIDE.md** - Detailed EC2 guide
- **DEPLOY_README.md** - All deployment options
- **QUICK_DEPLOY.md** - Manual console deployment

### 📦 Lambda Functions (Ready to Deploy)
- **lambda/word-to-pdf.zip** - Word → PDF conversion
- **lambda/ppt-to-pdf.zip** - PowerPoint → PDF conversion
- **lambda/pdf-to-word.zip** - PDF → Word conversion
- **lambda/pdf-to-excel.zip** - PDF → Excel conversion
- **lambda/pdf-to-ppt.zip** - PDF → PowerPoint conversion

---

## ⚡ Quick Start

### Linux/EC2 (Recommended)
```bash
ssh ec2-user@YOUR_EC2_IP
cd PDFMasterTool/aws
chmod +x ec2-deploy-lambda.sh
./ec2-deploy-lambda.sh
```

### Windows (Remote Deploy)
```powershell
cd D:\PDFMasterTool\aws
.\deploy-from-windows.ps1 -EC2_HOST "YOUR_EC2_IP"
```

### Windows (Easy Mode)
1. Double-click `deploy-simple.bat`
2. Enter EC2 IP
3. Wait for deployment
4. Done! ✅

---

## 📋 Prerequisites

- ✅ AWS Account
- ✅ AWS Access Keys configured
- ✅ EC2 instance running
- ✅ SSH access to EC2
- ✅ Lambda ZIP files (already included!)

---

## 📖 Documentation Guide

**New to deployment?** Read in this order:

1. **DEPLOYMENT_SUMMARY.md** - Overview of everything
2. **QUICK_START.md** - Get started in 5 minutes
3. **EC2_DEPLOYMENT_GUIDE.md** - Detailed instructions

**Want specific method?**
- EC2 deployment → **EC2_DEPLOYMENT_GUIDE.md**
- Manual console → **QUICK_DEPLOY.md**
- All options → **DEPLOY_README.md**

---

## 🎯 What Gets Deployed

### 5 Lambda Functions:
1. ✅ `pdfmastertool-word-to-pdf` - Word to PDF converter
2. ✅ `pdfmastertool-ppt-to-pdf` - PowerPoint to PDF converter
3. ✅ `pdfmastertool-pdf-to-word` - PDF to Word converter
4. ✅ `pdfmastertool-pdf-to-excel` - PDF to Excel converter
5. ✅ `pdfmastertool-pdf-to-ppt` - PDF to PowerPoint converter

### Configuration:
- **Runtime:** Node.js 20.x
- **Memory:** 2048 MB
- **Timeout:** 120 seconds
- **Auth:** Public (Function URLs)
- **CORS:** Enabled for all origins

### Generated Files:
- **.env** - Contains all Function URLs
- **IAM Role** - Execution role for Lambda functions

---

## 🔍 Verify Deployment

### Check AWS Console
```
AWS Console → Lambda → Functions
Should see 5 functions: pdfmastertool-*
```

### Test with Script
```bash
./test-lambda-functions.sh
```

### Test with Frontend
```bash
cd ..
npm run dev
# Visit: http://localhost:9001/tools/word-to-pdf
```

---

## 💰 Cost Estimate

**Free Tier:** 1M requests/month FREE (first 12 months)

**After Free Tier:**
| Requests/Month | Cost |
|----------------|------|
| 1,000 | $0.02 |
| 10,000 | $0.20 |
| 100,000 | $2.00 |
| 1,000,000 | $20.00 |

Plus EC2: ~$7.50/month (t3.micro) - can be stopped when not using

---

## 🆘 Troubleshooting

### Deployment fails?
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions
- Check CloudWatch Logs

### Can't SSH to EC2?
- Security group allows SSH (port 22)
- Key permissions: `chmod 400 key.pem`
- Try EC2 Instance Connect

### Functions don't work?
- Check .env file exists
- Verify Function URLs in .env
- Test with curl first
- Check CORS settings

**More help:** See `EC2_DEPLOYMENT_GUIDE.md` → Troubleshooting section

---

## 🎉 After Deployment

### 1. Get .env file
Contains all Function URLs - copy to project root

### 2. Test locally
```bash
npm run dev
```

### 3. Deploy frontend
```bash
npm run build
vercel --prod
```

### 4. Monitor
- CloudWatch Logs
- CloudWatch Metrics
- Cost Explorer

---

## 🔥 Quick Commands

```bash
# Deploy
./ec2-deploy-lambda.sh

# Test
./test-lambda-functions.sh

# View logs
aws logs tail /aws/lambda/pdfmastertool-word-to-pdf --follow

# Update function
aws lambda update-function-code \
  --function-name pdfmastertool-word-to-pdf \
  --zip-file fileb://lambda/word-to-pdf.zip

# List all functions
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `pdfmastertool`)].FunctionName'

# Get Function URLs
for f in word-to-pdf ppt-to-pdf pdf-to-word pdf-to-excel pdf-to-ppt; do
  echo "$f:"
  aws lambda get-function-url-config \
    --function-name "pdfmastertool-$f" \
    --query 'FunctionUrl' \
    --output text
done
```

---

## 📁 Directory Structure

```
aws/
├── README.md                      ← You are here
├── DEPLOYMENT_SUMMARY.md          ← Complete overview
├── QUICK_START.md                 ← 5-minute guide
├── EC2_DEPLOYMENT_GUIDE.md        ← Detailed EC2 guide
├── DEPLOY_README.md               ← All options
├── QUICK_DEPLOY.md                ← Manual deployment
│
├── ec2-deploy-lambda.sh           ← Main script (Linux)
├── deploy-from-windows.ps1        ← Windows script
├── deploy-simple.bat              ← Easy Windows
├── test-lambda-functions.sh       ← Test script
│
├── lambda/
│   ├── word-to-pdf.zip            ← Ready to deploy
│   ├── ppt-to-pdf.zip             ← Ready to deploy
│   ├── pdf-to-word.zip            ← Ready to deploy
│   ├── pdf-to-excel.zip           ← Ready to deploy
│   └── pdf-to-ppt.zip             ← Ready to deploy
│
└── template.yaml                  ← SAM template (optional)
```

---

## ✅ Deployment Checklist

Before deployment:
- [ ] AWS Account created
- [ ] AWS credentials obtained
- [ ] EC2 instance launched
- [ ] Security group configured
- [ ] SSH access verified
- [ ] Project files on EC2

During deployment:
- [ ] Run deployment script
- [ ] Note any errors
- [ ] Verify 5 functions created
- [ ] Get Function URLs

After deployment:
- [ ] Copy .env to project root
- [ ] Test each function
- [ ] Update frontend
- [ ] Deploy to production
- [ ] Set up monitoring

---

## 🌟 Features

✅ **Automated deployment** - One command deploys everything  
✅ **Cross-platform** - Works on Linux, Windows, Mac  
✅ **Error handling** - Checks and validates everything  
✅ **Idempotent** - Safe to run multiple times  
✅ **CORS enabled** - Works with any frontend  
✅ **Public URLs** - No authentication needed  
✅ **Monitoring ready** - CloudWatch logs enabled  
✅ **Cost optimized** - Minimal configuration  

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All 5 Lambda functions exist
- ✅ All functions have Function URLs
- ✅ .env file generated with URLs
- ✅ Test script passes
- ✅ Frontend can call functions
- ✅ File conversions work end-to-end

---

## 📞 Support

**Issues?**
1. Check CloudWatch Logs
2. Read troubleshooting section
3. Verify AWS permissions
4. Test with curl first

**Documentation:**
- Complete guide: `DEPLOYMENT_SUMMARY.md`
- Quick start: `QUICK_START.md`
- EC2 details: `EC2_DEPLOYMENT_GUIDE.md`

---

## 🚀 Ready to Deploy?

Pick your method:

### 🐧 Linux/EC2:
```bash
./ec2-deploy-lambda.sh
```

### 🪟 Windows:
```powershell
.\deploy-from-windows.ps1 -EC2_HOST "YOUR_EC2_IP"
```

### 🖱️ Windows (Easy):
Double-click `deploy-simple.bat`

---

**Time:** 5-10 minutes  
**Difficulty:** Easy ⭐  
**Cost:** FREE (using free tier)  

**Let's go! Chalo deploy karte hain! 🚀**

For detailed instructions, start with **DEPLOYMENT_SUMMARY.md**

