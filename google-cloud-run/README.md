# PDF Master Tool - Google Cloud Run Backend

## 🎯 What This Is

Complete backend for PDF Master Tool with LibreOffice conversions:
- ✅ PDF to Word (DOCX)
- ✅ PDF to Excel (XLSX)
- ✅ PDF to PPT (PPTX)
- ✅ Word to PDF
- ✅ PPT to PDF

**Deployed on Google Cloud Run - 100% FREE (within limits)!**

---

## 🚀 Quick Start

### 1. Install Google Cloud SDK
```bash
# Windows
https://cloud.google.com/sdk/docs/install

# Linux/Mac
curl https://sdk.cloud.google.com | bash
```

### 2. Login
```bash
gcloud auth login
```

### 3. Create Project
- Go to https://console.cloud.google.com/
- Create new project: `pdfmastertool`
- Copy the Project ID

### 4. Update Config
Edit `deploy.ps1` or `deploy.sh`:
```powershell
$PROJECT_ID = "your-project-id-here"
```

### 5. Deploy
```powershell
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

---

## 📁 Files

```
google-cloud-run/
├── app.py              # FastAPI application
├── Dockerfile          # Container definition
├── requirements.txt    # Python dependencies
├── deploy.sh          # Deployment script (Linux/Mac)
├── deploy.ps1         # Deployment script (Windows)
├── DEPLOYMENT_GUIDE.md # Detailed guide
├── QUICK_START.md     # Fast setup
└── README.md          # This file
```

---

## 🔧 How It Works

### Architecture:
```
User → Frontend → Cloud Run API → LibreOffice → Converted File
```

### Technology Stack:
- **Runtime:** Python 3.11
- **Framework:** FastAPI + Uvicorn
- **Converter:** LibreOffice (headless)
- **Platform:** Google Cloud Run
- **Container:** Docker

---

## 📊 API Endpoints

### Health Check:
```bash
GET /health
GET /
```

### Conversions:
```bash
POST /convert/pdf-to-word
POST /convert/pdf-to-excel
POST /convert/pdf-to-ppt
POST /convert/word-to-pdf
POST /convert/ppt-to-pdf
```

---

## 🧪 Testing

### Test Health:
```bash
curl https://YOUR-SERVICE-URL/health
```

### Test Conversion:
```bash
curl -X POST https://YOUR-SERVICE-URL/convert/pdf-to-word \
  -F "file=@sample.pdf" \
  -o output.json

# Extract base64 file from response
cat output.json | jq -r '.file' | base64 -d > output.docx
```

---

## 💰 Pricing

### Free Tier (Monthly):
- **2,000,000 requests**
- **360,000 GB-seconds**
- **180,000 vCPU-seconds**
- **1 GB network egress**

### Estimated Usage:
- Average conversion: 5 seconds
- Memory: 2 GB
- CPU: 1 vCPU

**10,000 conversions/month ≈ $2-3** (most stay free!)

---

## 🔒 Security

- ✅ HTTPS by default
- ✅ CORS enabled for frontend
- ✅ File size limits
- ✅ Timeout protection (60s)
- ✅ Temporary file cleanup

---

## 📈 Monitoring

### View Logs:
```bash
gcloud run services logs tail pdf-converter --region europe-west1
```

### View Metrics:
- Visit https://console.cloud.google.com/run
- Select your service
- View graphs for requests, latency, errors

---

## 🔄 Updates

After code changes:
```bash
# Rebuild and redeploy
./deploy.sh
```

Or manually:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/pdf-converter
gcloud run deploy pdf-converter --image gcr.io/PROJECT_ID/pdf-converter
```

---

## ⚙️ Configuration

### Environment Variables:
```bash
gcloud run services update pdf-converter \
  --update-env-vars KEY=VALUE \
  --region europe-west1
```

### Increase Memory:
```bash
gcloud run services update pdf-converter \
  --memory 4Gi \
  --region europe-west1
```

### Custom Domain:
```bash
gcloud run domain-mappings create \
  --service pdf-converter \
  --domain api.yourdomain.com
```

---

## 🐛 Troubleshooting

### Docker Build Fails:
```bash
# Increase timeout
gcloud builds submit --timeout=20m
```

### Service Not Responding:
```bash
# Check logs
gcloud run services logs tail pdf-converter

# Check status
gcloud run services describe pdf-converter
```

### LibreOffice Error:
- Check logs for detailed error
- Verify file format is supported
- Check file size (max 10MB recommended)

---

## 🎯 Advantages Over AWS Lambda

| Feature | Cloud Run | AWS Lambda |
|---------|-----------|------------|
| **Setup** | ✅ Simple | ❌ Complex |
| **Docker** | ✅ Standard | ❌ Custom RIC |
| **Free Tier** | 2M requests | 1M requests |
| **Timeout** | Up to 60 min | Max 15 min |
| **Logs** | ✅ Built-in | Need CloudWatch |
| **Deployment** | 1 command | Multiple steps |

---

## 📚 Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LibreOffice Headless](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html)

---

## ✅ Success Checklist

- [ ] Google Cloud SDK installed
- [ ] Logged in to Google Cloud
- [ ] Project created
- [ ] Project ID updated in scripts
- [ ] Deployment successful
- [ ] API URL obtained
- [ ] Health endpoint tested
- [ ] Conversion tested
- [ ] Frontend updated with URL

---

## 🎊 Next Steps

1. ✅ Deploy backend (this!)
2. ✅ Update frontend with Cloud Run URL
3. ✅ Test all conversions
4. ✅ Monitor usage
5. ✅ Add custom domain (optional)
6. ✅ Set up alerts (optional)

---

**Happy converting! 🚀**


