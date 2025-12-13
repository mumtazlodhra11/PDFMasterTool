# 🚀 EC2 Deployment - Quick Start

## ✅ This Solution Bypasses Windows Docker Issues!

Instead of fighting with Docker Desktop on Windows, we'll use an EC2 Linux instance to build everything.

---

## 📋 Two Options:

### Option 1: Fully Automated (Recommended) ⭐

**Just run ONE command:**

```powershell
.\START_EC2_DEPLOYMENT.ps1
```

**What it does:**
1. Creates IAM role for EC2
2. Packages your code
3. Uploads to S3
4. Launches EC2 instance
5. EC2 automatically:
   - Installs Docker
   - Downloads code
   - Builds all 5 Docker images (35 min)
   - Pushes to ECR
   - Creates Lambda functions
   - Creates Function URLs
   - Uploads URLs to S3
6. Script waits and downloads URLs (or you can come back later)
7. Updates .env file
8. Terminates EC2
9. Cleans up

**Total time: ~45 minutes**
**Cost: ~$0.05**

---

### Option 2: Manual (Step-by-Step)

If you want more control, follow: `EC2_DEPLOYMENT_GUIDE.md`

---

## 🚀 Start Deployment:

```powershell
cd D:\PDFMasterTool
.\START_EC2_DEPLOYMENT.ps1
```

The script will ask: "Wait here and auto-check? (Y/N)"

- **Y** = Script waits 40 minutes and auto-completes everything
- **N** = Come back in 40 minutes and run: `.\GET_URLS_AND_CLEANUP.ps1`

---

## ✅ After Deployment:

```powershell
# Restart dev server
npm run dev

# Open browser
start http://localhost:4321
```

Test your PDF conversion tools!

---

## 📊 What Gets Deployed:

1. ✅ **pdfmaster-word-to-pdf** - Word → PDF
2. ✅ **pdfmaster-ppt-to-pdf** - PowerPoint → PDF
3. ✅ **pdfmaster-pdf-to-word** - PDF → Word
4. ✅ **pdfmaster-pdf-to-excel** - PDF → Excel
5. ✅ **pdfmaster-pdf-to-ppt** - PDF → PowerPoint

All with LibreOffice in Docker containers!

---

## 💡 Why EC2?

- ✅ No Docker Desktop issues
- ✅ Linux = Docker works perfectly
- ✅ Automated
- ✅ Cheap (~$0.05)
- ✅ Terminates automatically when done

---

## 🔧 Troubleshooting:

**If deployment fails:**

1. Check EC2 console for "PDFMaster-Build" instance
2. View logs: Monitor → Get system log
3. Check S3 bucket: `pdfmaster-temp-<your-account-id>`
4. Manually run: `.\GET_URLS_AND_CLEANUP.ps1`

---

**Ready? Let's go!** 🚀

```powershell
.\START_EC2_DEPLOYMENT.ps1
```









