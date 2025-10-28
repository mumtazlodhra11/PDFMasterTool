# 🚀 DEPLOY NOW - Easiest Method!

**Time:** 5 minutes  
**Difficulty:** Copy-Paste only! ⭐

---

## ✅ **What You Need:**

Before starting, have these ready:

```
1. EC2 IP Address: ________________
2. SSH Key file: ________________
3. AWS Access Key ID: ________________
4. AWS Secret Access Key: ________________
```

---

## 🔥 **STEP-BY-STEP (Copy-Paste Commands)**

### **STEP 1: Connect to EC2** (Windows PowerShell)

```powershell
# Replace YOUR_KEY.pem and YOUR_EC2_IP with actual values
ssh -i "YOUR_KEY.pem" ec2-user@YOUR_EC2_IP
```

**Example:**
```powershell
ssh -i "my-key.pem" ec2-user@54.123.45.67
```

✅ **You're connected when you see EC2 command prompt**

---

### **STEP 2: Upload Project Files**

#### **Option A: Via Git (If repo is on GitHub)**

```bash
# On EC2 terminal, paste this:
cd ~
git clone https://github.com/YOUR_USERNAME/PDFMasterTool.git
cd PDFMasterTool
```

#### **Option B: Via SCP (From Windows)**

```powershell
# Open NEW Windows PowerShell window
# Navigate to project
cd D:\

# Upload to EC2
scp -i "YOUR_KEY.pem" -r PDFMasterTool ec2-user@YOUR_EC2_IP:~/
```

**After upload, on EC2:**
```bash
cd ~/PDFMasterTool
```

---

### **STEP 3: Configure AWS (First Time Only)**

```bash
# On EC2, paste this:
aws configure
```

**When prompted, enter:**
```
AWS Access Key ID [None]: YOUR_ACCESS_KEY_HERE
AWS Secret Access Key [None]: YOUR_SECRET_KEY_HERE
Default region name [None]: us-east-1
Default output format [None]: json
```

**Verify it worked:**
```bash
aws sts get-caller-identity
```

✅ **Should show your AWS account ID**

---

### **STEP 4: Deploy Lambda Functions! 🚀**

```bash
# Copy and paste this entire block:
cd ~/PDFMasterTool/aws && \
chmod +x ec2-deploy-lambda.sh && \
./ec2-deploy-lambda.sh
```

**This will:**
- ✅ Create IAM role
- ✅ Deploy 5 Lambda functions
- ✅ Enable Function URLs
- ✅ Generate .env file
- ✅ Test all functions

**Takes 5-10 minutes to complete!**

---

### **STEP 5: View Results**

```bash
# View .env file with Lambda URLs
cat ~/PDFMasterTool/.env
```

**Copy the output** - you'll need it on Windows!

**Should look like:**
```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://abc123.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://def456.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://ghi789.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://jkl012.lambda-url.us-east-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://mno345.lambda-url.us-east-1.on.aws/
```

---

### **STEP 6: Download .env to Windows**

#### **Option A: Copy-Paste (Easiest)**

1. **On EC2:** Copy the .env content (from Step 5)
2. **On Windows:** Open `D:\PDFMasterTool\.env` in Notepad
3. **Paste** the content
4. **Save** the file

#### **Option B: SCP Download**

```powershell
# From Windows PowerShell
scp -i "YOUR_KEY.pem" ec2-user@YOUR_EC2_IP:~/PDFMasterTool/.env D:\PDFMasterTool\
```

---

### **STEP 7: Test Locally (Windows)**

```powershell
# On Windows
cd D:\PDFMasterTool

# Verify .env exists
type .env

# Start dev server
npm run dev
```

**Open browser:**
```
http://localhost:9001/tools/word-to-pdf
```

**Upload a Word file and test conversion!** ✅

---

### **STEP 8: Verify in AWS Console**

1. Open: https://console.aws.amazon.com/lambda
2. Look for 5 functions:
   - pdfmastertool-word-to-pdf ✅
   - pdfmastertool-ppt-to-pdf ✅
   - pdfmastertool-pdf-to-word ✅
   - pdfmastertool-pdf-to-excel ✅
   - pdfmastertool-pdf-to-ppt ✅

---

### **STEP 9: Stop EC2 (Save Money!)** 💰

```bash
# Exit EC2
exit
```

**Then from AWS Console:**
```
EC2 → Instances → Select your instance
→ Instance state → Stop instance
```

**Or from Windows:**
```powershell
aws ec2 stop-instances --instance-ids i-YOUR_INSTANCE_ID
```

✅ **EC2 stopped, Lambda still working!**

---

## 📋 **Complete Command Cheat Sheet**

```bash
# 1. Connect
ssh -i "key.pem" ec2-user@IP

# 2. Clone/Upload project
cd ~
git clone REPO_URL PDFMasterTool
# OR upload via scp

# 3. Configure AWS
aws configure

# 4. Deploy
cd ~/PDFMasterTool/aws
chmod +x ec2-deploy-lambda.sh
./ec2-deploy-lambda.sh

# 5. View results
cat ~/PDFMasterTool/.env

# 6. Exit
exit
```

---

## 🆘 **Common Issues & Fixes**

### **Issue: "AWS CLI not found"**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

### **Issue: "Permission denied"**
```bash
chmod +x ec2-deploy-lambda.sh
```

### **Issue: "Unable to locate credentials"**
```bash
aws configure
# Enter your keys again
```

### **Issue: "Connection refused"**
- Check EC2 security group allows SSH (port 22)
- Verify SSH key permissions
- Try from AWS Console: EC2 Instance Connect

---

## ✅ **Success Checklist**

After deployment:
- [ ] 5 Lambda functions visible in AWS Console
- [ ] .env file has 5 URLs
- [ ] All URLs start with `https://`
- [ ] Test script passed (optional)
- [ ] .env copied to Windows
- [ ] `npm run dev` works
- [ ] File upload and conversion works
- [ ] EC2 stopped (to save money)

---

## 🎉 **You're Done!**

**What's Working:**
- ✅ Backend deployed to Lambda
- ✅ 5 conversion tools live
- ✅ Frontend can call Lambda
- ✅ Local testing works
- ✅ Ready for production!

**Next Steps:**
1. Test all 5 tools locally
2. Build for production: `npm run build`
3. Deploy frontend: `vercel --prod`
4. Share with users! 🚀

---

## 💡 **Pro Tips**

1. **Save .env securely** - don't commit to Git
2. **Keep EC2 stopped** - only start when deploying updates
3. **Monitor CloudWatch** - check Lambda logs
4. **Set cost alerts** - AWS Budget alerts
5. **Free tier** - First 1M requests free!

---

## 📞 **Need Help During Deployment?**

**If deployment fails:**
1. Check error message
2. Verify AWS credentials: `aws sts get-caller-identity`
3. Check CloudWatch Logs
4. Re-run script (safe to run multiple times)

**If frontend can't call Lambda:**
1. Verify .env in project root
2. Check URLs start with `https://`
3. Restart dev server
4. Check browser console for errors

---

## 🔥 **Quick Deployment (All Commands)**

```bash
# Connect
ssh -i "key.pem" ec2-user@YOUR_IP

# Deploy (one command!)
cd ~/PDFMasterTool/aws && chmod +x ec2-deploy-lambda.sh && ./ec2-deploy-lambda.sh

# View results
cat ~/PDFMasterTool/.env

# Done! Exit and stop EC2
exit
```

---

**Total Time:** 5-10 minutes  
**Difficulty:** ⭐ Easy (copy-paste)  
**Cost:** FREE (with AWS free tier)

**Chalo deploy karte hain! 🚀**
