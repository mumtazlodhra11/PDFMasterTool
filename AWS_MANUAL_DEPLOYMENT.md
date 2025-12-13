# 📖 Manual AWS Deployment Guide

Since SAM CLI is not installed, here's how to deploy via AWS Console (easier and faster!)

---

## 🎯 **5-Minute Manual Deployment**

### **Step 1: Package Lambda Functions**

Run this first:
```powershell
cd aws/lambda
npm install --production
```

Create zip files:
```powershell
# Create deployment packages
Compress-Archive -Path pdf-to-word.js,node_modules,package.json -DestinationPath pdf-to-word.zip -Force
Compress-Archive -Path word-to-pdf.js,node_modules,package.json -DestinationPath word-to-pdf.zip -Force
Compress-Archive -Path pdf-to-excel.js,node_modules,package.json -DestinationPath pdf-to-excel.zip -Force
Compress-Archive -Path pdf-to-ppt.js,node_modules,package.json -DestinationPath pdf-to-ppt.zip -Force
Compress-Archive -Path ppt-to-pdf.js,node_modules,package.json -DestinationPath ppt-to-pdf.zip -Force
```

---

### **Step 2: Create S3 Bucket**

1. Go to: https://s3.console.aws.amazon.com/s3/buckets?region=eu-west-1
2. Click **"Create bucket"**
3. Bucket name: `pdfmastertool-temp-files`
4. Region: **EU (Ireland) eu-west-1**
5. Keep all defaults
6. Click **"Create bucket"**

#### **Add Lifecycle Rule:**
1. Click on your bucket
2. Go to **"Management"** tab
3. Click **"Create lifecycle rule"**
4. Name: `auto-delete`
5. Check **"Expire current versions of objects"**
6. Days: **1**
7. Click **"Create rule"**

---

### **Step 3: Create Lambda Functions**

#### **Function 1: PDF to Word**

1. Go to: https://console.aws.amazon.com/lambda/home?region=eu-west-1#/functions
2. Click **"Create function"**
3. Choose **"Author from scratch"**
4. Function name: `pdfmastertool-pdf-to-word`
5. Runtime: **Node.js 20.x**
6. Architecture: **x86_64**
7. Click **"Create function"**

#### **Upload Code:**
1. In **"Code"** tab, click **"Upload from"** → **".zip file"**
2. Upload `aws/lambda/pdf-to-word.zip`
3. Click **"Save"**

#### **Configure:**
1. Go to **"Configuration"** → **"General configuration"**
2. Click **"Edit"**
3. Timeout: **120 seconds**
4. Memory: **2048 MB**
5. Click **"Save"**

#### **Add Environment Variables:**
1. Go to **"Configuration"** → **"Environment variables"**
2. Click **"Edit"** → **"Add environment variable"**
3. Add:
   - Key: `S3_BUCKET`, Value: `pdfmastertool-temp-files`
   - Key: `AWS_REGION`, Value: `eu-west-1`
4. Click **"Save"**

#### **Add S3 Permissions:**
1. Go to **"Configuration"** → **"Permissions"**
2. Click on the **Role name** (opens IAM)
3. Click **"Add permissions"** → **"Attach policies"**
4. Search and add: **AmazonS3FullAccess**
5. Click **"Attach policies"**

#### **Enable Function URL:**
1. Go to **"Configuration"** → **"Function URL"**
2. Click **"Create function URL"**
3. Auth type: **NONE**
4. Configure CORS:
   - Allow origins: `*`
   - Allow methods: `POST, OPTIONS`
   - Allow headers: `*`
5. Click **"Save"**

#### **Copy Function URL:**
The URL will look like: `https://abc123.lambda-url.eu-west-1.on.aws/`

**Save this URL!** You'll need it for `.env`

---

#### **Repeat for Other 4 Functions:**

**Function 2: Word to PDF**
- Name: `pdfmastertool-word-to-pdf`
- Upload: `word-to-pdf.zip`
- Same configuration as above

**Function 3: PDF to Excel**
- Name: `pdfmastertool-pdf-to-excel`
- Upload: `pdf-to-excel.zip`
- Same configuration as above

**Function 4: PDF to PowerPoint**
- Name: `pdfmastertool-pdf-to-ppt`
- Upload: `pdf-to-ppt.zip`
- Same configuration as above

**Function 5: PowerPoint to PDF**
- Name: `pdfmastertool-ppt-to-pdf`
- Upload: `ppt-to-pdf.zip`
- Same configuration as above

---

### **Step 4: Update .env File**

Copy all 5 Function URLs and update `.env`:

```bash
PUBLIC_LAMBDA_PDF_TO_WORD=https://abc123.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_WORD_TO_PDF=https://def456.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://ghi789.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://jkl012.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://mno345.lambda-url.eu-west-1.on.aws/
```

Also update S3 bucket:
```bash
AWS_S3_BUCKET=pdfmastertool-temp-files
PUBLIC_AWS_S3_BUCKET=pdfmastertool-temp-files
```

---

### **Step 5: Test!**

```powershell
npm run dev
```

Open: http://localhost:9001

Test tools:
- `/tools/pdf-to-word`
- `/tools/word-to-pdf`
- `/tools/pdf-to-excel`
- `/tools/pdf-to-ppt`
- `/tools/powerpoint-to-pdf`

---

## ⏱️ **Time Estimate:**

- Step 1 (Package): 5 minutes
- Step 2 (S3): 2 minutes
- Step 3 (Lambda): 15 minutes (3 min × 5 functions)
- Step 4 (.env): 1 minute
- Step 5 (Test): 2 minutes

**Total: ~25 minutes**

---

## 🆘 **Troubleshooting:**

### **Problem: "Access Denied" in Lambda**
**Solution:** Make sure you attached **AmazonS3FullAccess** policy to Lambda role

### **Problem: "Module not found"**
**Solution:** Make sure you included `node_modules` in the zip file

### **Problem: "Timeout"**
**Solution:** Increase timeout to 120 seconds in Lambda configuration

### **Problem: "No such bucket"**
**Solution:** Check S3_BUCKET environment variable matches your bucket name

---

## 💡 **Pro Tips:**

1. **Test each function individually** in Lambda console before integrating
2. **Check CloudWatch Logs** for debugging: https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups
3. **Monitor costs** in Billing dashboard
4. **Set budget alerts** for $10/month

---

## ✅ **Success Checklist:**

- [ ] S3 bucket created with lifecycle rule
- [ ] 5 Lambda functions created
- [ ] All functions have 2048 MB memory
- [ ] All functions have 120s timeout
- [ ] All functions have S3 permissions
- [ ] All functions have Function URLs enabled
- [ ] All URLs copied to `.env`
- [ ] Dev server restarted
- [ ] All 5 tools tested and working

---

**🎉 Done! Your PDF platform is fully functional!**

**Cost:** $0-10/month (free tier)  
**Revenue:** $2000-5000/month potential 📈















