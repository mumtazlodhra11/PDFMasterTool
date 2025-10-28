# 🚀 Upload Project via Git (No SSH Key Needed!)

**Best Method:** When SCP doesn't work

---

## 📋 **Step-by-Step:**

### **STEP 1: Create GitHub Repository**

```
1. Go to: https://github.com/new
2. Repository name: PDFMasterTool
3. Privacy: Private (recommended) or Public
4. DO NOT initialize with README
5. Click: "Create repository"
```

---

### **STEP 2: Push Code from Windows**

```powershell
# Open PowerShell in project directory
cd D:\PDFMasterTool

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/PDFMasterTool.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Enter GitHub credentials when prompted**

---

### **STEP 3: Clone on EC2**

```bash
# On EC2 terminal (already connected via AWS Console)
cd ~

# Clone repository
git clone https://github.com/YOUR_USERNAME/PDFMasterTool.git

# Verify
cd PDFMasterTool
ls -la

# Should see: aws/, src/, package.json, etc. ✅
```

---

### **STEP 4: Deploy Lambda!**

```bash
# Navigate to aws folder
cd ~/PDFMasterTool/aws

# Make executable
chmod +x ec2-deploy-lambda.sh

# Check region
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
echo "Region: $REGION"

# Deploy!
AWS_REGION=$REGION ./ec2-deploy-lambda.sh
```

---

## ✅ **Done!**

No SSH key needed! ✅
Code on GitHub! ✅
Easy to update in future! ✅

---

## 🔄 **Future Updates:**

When you need to deploy updates:

```powershell
# On Windows
cd D:\PDFMasterTool
git add .
git commit -m "Updated Lambda functions"
git push
```

```bash
# On EC2
cd ~/PDFMasterTool
git pull
cd aws
./ec2-deploy-lambda.sh
```

---

## 🆘 **Troubleshooting:**

### **Issue: Git not installed on Windows**
```powershell
winget install Git.Git
```

### **Issue: Git not installed on EC2**
```bash
sudo apt update
sudo apt install git -y
```

### **Issue: GitHub authentication**
Use Personal Access Token:
```
GitHub → Settings → Developer settings
→ Personal access tokens → Tokens (classic)
→ Generate new token → Select "repo" scope
→ Use token as password when pushing
```

### **Issue: Private repo, can't clone**
```bash
# Use HTTPS with token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/PDFMasterTool.git
```

---

**This is the cleanest method!** 🎯

