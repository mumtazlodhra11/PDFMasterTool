# ⚡ Quick Start - AWS Deployment

**Your credentials are already configured! Just follow these 5 steps:**

---

## 🎯 **5-Step Deployment** (10 minutes)

### **Step 1: Install AWS CLI**
```powershell
choco install awscli
```
**Or download:** https://awscli.amazonaws.com/AWSCLIV2.msi

---

### **Step 2: Install SAM CLI**
```powershell
choco install aws-sam-cli
```
**Or download:** https://github.com/aws/aws-sam-cli/releases/latest

---

### **Step 3: Deploy to AWS**
```powershell
cd aws
.\deploy.bat
```
**Wait 5-10 minutes...**

---

### **Step 4: Copy Lambda URLs**

After deployment, you'll see output like:
```
Lambda Function URLs:
pdfmastertool-pdf-to-word    https://abc123.lambda-url.eu-west-1.on.aws/
pdfmastertool-word-to-pdf    https://def456.lambda-url.eu-west-1.on.aws/
...
```

**Copy these URLs** and update `.env` file:
```bash
PUBLIC_LAMBDA_PDF_TO_WORD=https://abc123.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_WORD_TO_PDF=https://def456.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://ghi789.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://jkl012.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://mno345.lambda-url.eu-west-1.on.aws/
```

---

### **Step 5: Restart & Test**
```powershell
npm run dev
```

**Test at:** http://localhost:9001
- PDF to Word: `/tools/pdf-to-word`
- Word to PDF: `/tools/word-to-pdf`
- PDF to Excel: `/tools/pdf-to-excel`
- PDF to PPT: `/tools/pdf-to-ppt`
- PPT to PDF: `/tools/powerpoint-to-pdf`

---

## ✅ **That's It!**

**Your credentials:**
- ✅ Access Key: `AKIAXUIIS3Z5WZLR6KND`
- ✅ Region: `eu-west-1` (Ireland)
- ✅ Already in `.env` file

**Cost:** $0-10/month (Free tier!)

**Tools Ready:** 25/30
- 20 Client-side (FREE)
- 5 Server-side (AWS)

---

## 🆘 **Help?**

Read full guide: **`AWS_DEPLOYMENT_GUIDE.md`**

**Common Issues:**
- AWS CLI not found? → Install from link above
- SAM CLI not found? → Install from link above
- Deployment timeout? → Check AWS Console CloudFormation
- Wrong Lambda URLs? → Recheck .env file format

---

**🎉 Enjoy your fully functional PDF platform!**













