# Quick Start - Deploy in 10 Minutes

## ⚡ Super Fast Setup

### 1️⃣ Install Google Cloud SDK (5 minutes)

**Windows:**
```powershell
# Download installer
Start-Process "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Mac:**
```bash
brew install --cask google-cloud-sdk
```

---

### 2️⃣ Login (1 minute)

```bash
gcloud auth login
# Browser opens, select your Google account
```

---

### 3️⃣ Create Project (2 minutes)

**Via Browser (Easiest):**
1. Go to https://console.cloud.google.com/
2. Click "Select Project" → "New Project"
3. Name: `pdfmastertool`
4. Click "Create"
5. **Copy the Project ID** (shown below project name)

**Example Project ID:** `pdfmastertool-437816`

---

### 4️⃣ Update Config (30 seconds)

Edit `google-cloud-run/deploy.ps1` or `deploy.sh`:

```powershell
$PROJECT_ID = "pdfmastertool-437816"  # Your project ID here!
```

---

### 5️⃣ Deploy! (5-10 minutes)

**Windows:**
```powershell
cd D:\PDFMasterTool\google-cloud-run
.\deploy.ps1
```

**Linux/Mac:**
```bash
cd google-cloud-run
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Done!

You'll get:
```
🎉 Your API is live at:
  https://pdf-converter-abc123-ew.a.run.app

📋 Test endpoints:
  https://pdf-converter-abc123-ew.a.run.app/health
  https://pdf-converter-abc123-ew.a.run.app/convert/pdf-to-word
```

---

## 🧪 Test It

```bash
# Test health check
curl https://YOUR-URL/health

# Test PDF to Word conversion
curl -X POST https://YOUR-URL/convert/pdf-to-word \
  -F "file=@test.pdf" \
  > result.json
```

---

## 🔗 Connect Frontend

Add to `.env`:
```env
VITE_CLOUD_RUN_URL=https://pdf-converter-abc123-ew.a.run.app
```

---

## 💰 Cost

**Free Tier (Monthly):**
- 2 million requests FREE
- 360,000 GB-seconds FREE
- Most users stay in free tier!

**After Free Tier:**
- ~$2-3/month for typical usage

---

## 🆘 Troubleshooting

### "gcloud not found"
```powershell
# Restart PowerShell after installing SDK
# Or add to PATH manually
```

### "Project not found"
```bash
# List your projects
gcloud projects list

# Make sure you're using the correct Project ID
```

### "Permission denied"
```bash
# Make sure you're the project owner
# Or add yourself: IAM & Admin → Add Member → Owner
```

---

## 📞 Need Help?

Read full guide: `DEPLOYMENT_GUIDE.md`

Or check logs:
```bash
gcloud run services logs tail pdf-converter --region europe-west1
```

---

**That's it! 🚀 Your backend is live!**


