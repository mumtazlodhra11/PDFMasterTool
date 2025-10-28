# 🚀 Deploy Without PEM Key - AWS Console Method

**Best for:** When you don't have SSH key file

**Time:** 5 minutes  
**Difficulty:** ⭐ Very Easy

---

## 🎯 **No PEM Key? No Problem!**

Use **EC2 Instance Connect** - directly from browser!

---

## 📋 **Step-by-Step Guide:**

### **STEP 1: Open AWS Console**

```
1. Go to: https://console.aws.amazon.com/ec2
2. Login with your AWS credentials
3. Make sure you're in correct region
   (Check top-right corner: should match your EC2 region)
```

---

### **STEP 2: Find Your Instance**

```
1. Left sidebar: Click "Instances"
2. Look for: Public IP = 34.241.164.163
3. Select the instance (checkbox)
```

---

### **STEP 3: Connect via Browser**

```
1. Click "Connect" button (top-right, orange)
2. Select "EC2 Instance Connect" tab
3. User name: ec2-user (already filled)
4. Click "Connect" button
```

**✅ Browser terminal will open!**

---

### **STEP 4: Check Project Exists**

```bash
# Paste this in browser terminal
ls -la ~/

# Should see "PDFMasterTool" folder
# If yes, continue
# If no, we need to upload project first
```

---

### **STEP 5: Check AWS CLI Configuration**

```bash
# Check if AWS is configured
aws sts get-caller-identity

# If error, configure AWS:
aws configure
# Enter:
#   AWS Access Key ID: [your key]
#   AWS Secret Access Key: [your secret]
#   Default region: [your region]
#   Default output format: json
```

---

### **STEP 6: Deploy Lambda Functions!**

```bash
# Navigate to project
cd ~/PDFMasterTool/aws

# Check files
ls -la

# Make script executable
chmod +x ec2-deploy-lambda.sh

# Check EC2 region
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
echo "EC2 Region: $REGION"

# Deploy Lambda!
AWS_REGION=$REGION ./ec2-deploy-lambda.sh
```

**This will take 5-10 minutes...**

---

### **STEP 7: View Results**

```bash
# After deployment completes
cat ~/PDFMasterTool/.env

# Copy all these URLs!
```

**Should show:**
```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxx.lambda-url.region.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxx.lambda-url.region.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxx.lambda-url.region.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxx.lambda-url.region.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxx.lambda-url.region.on.aws/
```

---

### **STEP 8: Copy .env to Windows**

**Two methods:**

#### **Method A: Manual Copy (Easiest)**

1. **Select all text** from cat command output
2. **Copy** (Ctrl+C)
3. **On Windows:** Open Notepad
4. **Paste** the content
5. **Save as:** `D:\PDFMasterTool\.env`

#### **Method B: Download via AWS CLI**

```bash
# In EC2 browser terminal, create temporary public link
aws s3 cp ~/PDFMasterTool/.env s3://temp-bucket/.env
aws s3 presign s3://temp-bucket/.env --expires-in 600

# Copy the URL and download on Windows
```

---

## ✅ **Verification:**

### **Check AWS Console:**

```
AWS Console → Lambda → Functions

Should see 5 functions:
- pdfmastertool-word-to-pdf ✅
- pdfmastertool-ppt-to-pdf ✅
- pdfmastertool-pdf-to-word ✅
- pdfmastertool-pdf-to-excel ✅
- pdfmastertool-pdf-to-ppt ✅
```

### **Test Locally:**

```powershell
# Windows
cd D:\PDFMasterTool

# Check .env
type .env

# Start dev server
npm run dev

# Browser
http://localhost:9001/tools/word-to-pdf
```

---

## 🎉 **Done!**

You've deployed Lambda functions **without PEM key!** ✅

---

## 🆘 **Troubleshooting:**

### **Can't connect via EC2 Instance Connect?**

**Fix 1: Check Security Group**
```
EC2 → Instances → Select instance → Security tab
→ Security groups → Edit inbound rules
→ Add rule: SSH (port 22) from 0.0.0.0/0
```

**Fix 2: Enable EC2 Instance Connect**
```
May not be available in all regions
Use Systems Manager Session Manager instead
```

### **AWS CLI not configured?**

```bash
# Get credentials from:
# AWS Console → IAM → Users → Your user
# → Security credentials → Access keys → Create

aws configure
```

### **Project not on EC2?**

**Upload via AWS Console:**
```
1. EC2 browser terminal
2. git clone YOUR_GITHUB_REPO PDFMasterTool
```

**Or manually upload files**

---

## 💡 **Pro Tip:**

Once deployed, you can **stop EC2** to save money!

```
EC2 → Instances → Select → Instance state → Stop
```

Lambda functions will keep working! ✅

---

## 📞 **Need Help?**

If any step fails, note the error and check:
1. AWS credentials configured
2. Correct region selected
3. IAM permissions sufficient
4. Lambda ZIP files exist

---

**Total Time:** 10 minutes  
**Cost:** FREE (using free tier)  
**Difficulty:** ⭐ Easy

**No PEM key needed! 🎉**

