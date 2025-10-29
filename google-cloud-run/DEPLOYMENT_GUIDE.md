# Google Cloud Run Deployment Guide

## 🎯 Quick Start (5 Steps)

### Step 1: Install Google Cloud SDK

**Windows:**
```powershell
# Download and run installer
# https://cloud.google.com/sdk/docs/install

# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**Linux/Mac:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

---

### Step 2: Login to Google Cloud

```bash
# Login
gcloud auth login

# This will open browser for authentication
```

---

### Step 3: Create Google Cloud Project

**Option A: Via Console (Easy)**
1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: `pdfmastertool`
4. Click "Create"
5. Copy the Project ID (e.g., `pdfmastertool-123456`)

**Option B: Via CLI**
```bash
# Create project
gcloud projects create pdfmastertool-$(date +%s) --name="PDF Master Tool"

# List projects to get ID
gcloud projects list

# Set as active project
gcloud config set project YOUR_PROJECT_ID
```

---

### Step 4: Update Configuration

Edit `deploy.sh`:
```bash
PROJECT_ID="your-project-id-here"  # Change this!
SERVICE_NAME="pdf-converter"
REGION="europe-west1"  # Or: us-central1, asia-east1
```

---

### Step 5: Deploy!

```bash
cd google-cloud-run

# Make script executable (Linux/Mac)
chmod +x deploy.sh

# Deploy
./deploy.sh
```

**Or deploy manually:**
```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pdf-converter
gcloud run deploy pdf-converter \
  --image gcr.io/YOUR_PROJECT_ID/pdf-converter \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 2Gi
```

---

## 🎉 After Deployment

### Get Your API URL:
```bash
gcloud run services describe pdf-converter \
  --region europe-west1 \
  --format 'value(status.url)'
```

**Example output:**
```
https://pdf-converter-abc123-ew.a.run.app
```

---

## 🧪 Test Your API

### Test health endpoint:
```bash
curl https://YOUR-SERVICE-URL/health
```

### Test conversion:
```bash
curl -X POST https://YOUR-SERVICE-URL/convert/pdf-to-word \
  -F "file=@sample.pdf" \
  > output.json
```

---

## 🔧 Connect to Frontend

Add to your `.env` file:
```env
VITE_CLOUD_RUN_URL=https://pdf-converter-abc123-ew.a.run.app
```

Update frontend to use Cloud Run instead of Lambda:
```javascript
// src/utils/cloudRunClient.ts
const CLOUD_RUN_URL = import.meta.env.VITE_CLOUD_RUN_URL;

export async function convertPdfToWord(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${CLOUD_RUN_URL}/convert/pdf-to-word`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  // Decode base64 file
  const fileData = atob(data.file);
  const blob = new Blob([new Uint8Array([...fileData].map(c => c.charCodeAt(0)))]);
  
  return blob;
}
```

---

## 💰 Pricing

### Free Tier (Monthly):
- **2 million requests**
- **360,000 GB-seconds** of memory
- **180,000 vCPU-seconds** of compute
- **1 GB network egress** to North America

### After Free Tier:
- Requests: **$0.40** per million
- Memory: **$0.0000025** per GB-second
- CPU: **$0.00001** per vCPU-second

**Example Cost:**
- 10,000 conversions/month
- Avg 5 seconds each
- 2GB memory, 1 CPU
- **Cost: ~$2-3/month** (most stay in free tier!)

---

## 📊 Monitoring

### View logs:
```bash
gcloud run services logs read pdf-converter --region europe-west1
```

### View metrics:
```bash
# Open Cloud Console
gcloud run services describe pdf-converter --region europe-west1
```

Or visit: https://console.cloud.google.com/run

---

## 🔄 Update Deployment

After code changes:
```bash
# Rebuild and redeploy
./deploy.sh
```

Or:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pdf-converter
gcloud run deploy pdf-converter --image gcr.io/YOUR_PROJECT_ID/pdf-converter
```

---

## 🐛 Troubleshooting

### Error: "Project not found"
```bash
# List your projects
gcloud projects list

# Set correct project
gcloud config set project YOUR_PROJECT_ID
```

### Error: "APIs not enabled"
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### Error: "Permission denied"
```bash
# Make sure you're the owner of the project
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Build timeout:
```bash
# Increase timeout
gcloud builds submit --timeout=20m --tag gcr.io/YOUR_PROJECT_ID/pdf-converter
```

### Service not accessible:
```bash
# Make sure it's public
gcloud run services add-iam-policy-binding pdf-converter \
  --region europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

---

## ⚙️ Advanced Configuration

### Custom domain:
```bash
gcloud run domain-mappings create \
  --service pdf-converter \
  --domain api.pdfmastertool.com \
  --region europe-west1
```

### Environment variables:
```bash
gcloud run services update pdf-converter \
  --update-env-vars MAX_FILE_SIZE=10485760 \
  --region europe-west1
```

### Increase timeout:
```bash
gcloud run services update pdf-converter \
  --timeout 600 \
  --region europe-west1
```

### Scale configuration:
```bash
gcloud run services update pdf-converter \
  --min-instances 1 \
  --max-instances 20 \
  --region europe-west1
```

---

## 🎯 Regions

Choose closest to your users:

| Region | Location | Code |
|--------|----------|------|
| Belgium | Europe | `europe-west1` |
| London | Europe | `europe-west2` |
| Frankfurt | Europe | `europe-west3` |
| Iowa | US | `us-central1` |
| Oregon | US | `us-west1` |
| Tokyo | Asia | `asia-northeast1` |
| Mumbai | Asia | `asia-south1` |

---

## ✅ Success Checklist

- [ ] Google Cloud SDK installed
- [ ] Logged in (`gcloud auth login`)
- [ ] Project created
- [ ] Project ID updated in `deploy.sh`
- [ ] APIs enabled
- [ ] Docker image built
- [ ] Service deployed
- [ ] Service URL obtained
- [ ] API tested
- [ ] Frontend updated with URL

---

## 🆘 Need Help?

**Check Cloud Run status:**
```bash
gcloud run services describe pdf-converter --region europe-west1
```

**View recent logs:**
```bash
gcloud run services logs tail pdf-converter --region europe-west1
```

**Delete and retry:**
```bash
gcloud run services delete pdf-converter --region europe-west1
./deploy.sh
```

---

## 🎊 Next Steps

After successful deployment:

1. ✅ Update frontend with Cloud Run URL
2. ✅ Test all conversion endpoints
3. ✅ Monitor usage in Cloud Console
4. ✅ Set up alerts for errors
5. ✅ Consider custom domain
6. ✅ Enable Cloud Armor for DDoS protection

---

**You're all set! 🚀**


