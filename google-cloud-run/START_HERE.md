# 🚀 START HERE - Deploy in 3 Commands

## ⚡ Super Quick Deploy

### 1️⃣ Install gcloud (First time only)
```powershell
# Download and install:
https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

# Restart PowerShell after install
```

---

### 2️⃣ Create Project & Get ID
```powershell
# Open browser:
https://console.cloud.google.com/

# Click: "New Project"
# Name: pdfmastertool
# COPY THE PROJECT ID (shows below name)
# Example: pdfmastertool-437816
```

---

### 3️⃣ Deploy!
```powershell
# Login (browser opens)
gcloud auth login

# Set your project ID
$PROJECT_ID = "pdfmastertool-437816"  # ← Your actual ID here!

# Go to folder
cd D:\PDFMasterTool\google-cloud-run

# Edit deploy.ps1 (line 8) with your PROJECT_ID
# Or run directly:
gcloud config set project $PROJECT_ID
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
gcloud builds submit --tag gcr.io/$PROJECT_ID/pdf-converter
gcloud run deploy pdf-converter `
  --image gcr.io/$PROJECT_ID/pdf-converter `
  --platform managed `
  --region europe-west1 `
  --allow-unauthenticated `
  --memory 2Gi
```

---

## ✅ Done!

You'll get:
```
Service URL: https://pdf-converter-abc123-ew.a.run.app
```

---

## 🧪 Test It

```powershell
# Get your URL
$URL = gcloud run services describe pdf-converter --region europe-west1 --format 'value(status.url)'

# Test
curl "$URL/health"
```

---

## 🎉 Success!

Now:
1. ✅ Your API is live
2. ✅ LibreOffice working
3. ✅ All 5 conversions ready
4. ✅ 2M requests/month FREE

---

**Need help? Read:** `QUICK_START.md` or `DEPLOYMENT_GUIDE.md`


