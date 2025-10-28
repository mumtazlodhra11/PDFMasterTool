# ⚡ Quick Deployment Guide - Lambda Functions

**Time Required:** 30-45 minutes  
**Difficulty:** Medium  
**Prerequisites:** AWS Account, AWS CLI

---

## 🚀 **Fast Track Deployment**

### **Step 1: Prepare Lambda Packages** (5 mins)
```bash
cd aws/lambda

# Install dependencies (if not done)
npm install

# Packages are already created:
# ✅ word-to-pdf.zip
# ✅ ppt-to-pdf.zip
# ✅ pdf-to-word.zip
# ✅ pdf-to-excel.zip
# ✅ pdf-to-ppt.zip
```

### **Step 2: Deploy via AWS Console** (20 mins)

#### **For Each Lambda Function:**

1. **Open AWS Lambda Console**
   - https://console.aws.amazon.com/lambda/

2. **Create Function**
   - Click "Create function"
   - Choose "Author from scratch"
   - Function name: `pdfmaster-word-to-pdf`
   - Runtime: **Node.js 20.x**
   - Architecture: **x86_64**
   - Click "Create function"

3. **Upload Code**
   - In "Code" tab → "Upload from" → ".zip file"
   - Select: `word-to-pdf.zip`
   - Click "Save"

4. **Configure Settings**
   - Go to "Configuration" tab
   - **General configuration:**
     - Memory: **2048 MB**
     - Timeout: **2 min 0 sec**
     - Ephemeral storage: **512 MB**
   
   - **Environment variables:**
     ```
     AWS_REGION = eu-west-1
     NODE_OPTIONS = --max-old-space-size=2048
     ```

5. **Add LibreOffice Layer**
   - Configuration → Layers → Add layer
   - **Option A:** Use existing layer
     - ARN: `arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1`
   
   - **Option B:** Create custom layer (see full guide)

6. **Enable Function URL**
   - Configuration → Function URL → Create
   - Auth type: **NONE**
   - Configure CORS:
     - Allow origin: `*`
     - Allow methods: `POST, OPTIONS`
     - Allow headers: `Content-Type`
     - Max age: `86400`
   - Click "Save"
   - **Copy the Function URL** ⭐

7. **Test Function** (Optional)
   - Go to "Test" tab
   - Create test event:
   ```json
   {
     "body": "{\"fileContent\":\"SGVsbG8gV29ybGQ=\",\"fileName\":\"test.txt\"}"
   }
   ```
   - Click "Test"

8. **Repeat for All 5 Functions:**
   - `pdfmaster-word-to-pdf`
   - `pdfmaster-ppt-to-pdf`
   - `pdfmaster-pdf-to-word`
   - `pdfmaster-pdf-to-excel`
   - `pdfmaster-pdf-to-ppt`

### **Step 3: Configure Frontend** (5 mins)

Create `.env` file in project root:

```env
# AWS Lambda Function URLs (paste your URLs here)
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxxxxxxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxxxxxxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxxxxxxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxxxxxxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxxxxxxxxx.lambda-url.eu-west-1.on.aws/
```

### **Step 4: Test Locally** (5 mins)
```bash
# In project root
npm run dev

# Open browser
http://localhost:9001/tools/word-to-pdf

# Upload a test Word file
# Should convert successfully!
```

### **Step 5: Deploy Frontend** (5 mins)
```bash
# Build for production
npm run build

# Deploy to Vercel (or Netlify)
vercel --prod

# Or push to GitHub (auto-deploys if connected)
git add .
git commit -m "Add Lambda function URLs"
git push
```

---

## 📋 **Checklist**

Use this to track your deployment:

- [ ] AWS Lambda Console open
- [ ] Created 5 Lambda functions
- [ ] Uploaded .zip files for all 5 functions
- [ ] Configured memory (2048 MB) and timeout (120s)
- [ ] Added LibreOffice layer to all functions
- [ ] Enabled Function URLs with CORS
- [ ] Copied all 5 Function URLs
- [ ] Created .env file with URLs
- [ ] Tested locally - Word to PDF works
- [ ] Tested locally - PDF to Word works
- [ ] Built frontend for production
- [ ] Deployed to Vercel/Netlify
- [ ] Tested on production

---

## 🎯 **Function URLs Template**

Copy this and fill in your URLs:

```env
# Lambda Function URLs - REPLACE WITH YOUR URLS
PUBLIC_LAMBDA_WORD_TO_PDF=https://[your-url].lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://[your-url].lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://[your-url].lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://[your-url].lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://[your-url].lambda-url.eu-west-1.on.aws/
```

---

## ⚠️ **Common Issues**

### **Issue: "LibreOffice layer not found"**
Use this public layer ARN:
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
```

Or create your own:
1. Download: https://github.com/shelfio/libreoffice-lambda-base-layer/releases
2. Upload as Lambda Layer
3. Attach to your functions

### **Issue: "Function timeout"**
Increase timeout to 120 seconds in Configuration → General settings

### **Issue: "Out of memory"**
Increase memory to 2048 MB or 3008 MB in Configuration → General settings

### **Issue: "CORS error in browser"**
Make sure Function URL has CORS enabled:
- Configuration → Function URL → Edit
- Enable CORS with:
  - Allow origin: `*`
  - Allow methods: `POST, OPTIONS`
  - Allow headers: `Content-Type`

---

## 💡 **Pro Tips**

1. **Use Same Region:** Deploy all functions in same region (e.g., `eu-west-1`)
2. **Tag Functions:** Add tag `Project: PDFMasterTool` for easy filtering
3. **Enable CloudWatch Logs:** Helps with debugging
4. **Set Alarms:** Get notified of errors via CloudWatch Alarms
5. **Monitor Costs:** Check AWS Cost Explorer after 1 week

---

## 📊 **Expected Costs**

**Free Tier (First Year):**
- 1M requests/month FREE
- 400,000 GB-seconds compute/month FREE

**After Free Tier:**
- ~$0.20 per 1,000 conversions
- ~$2 per 10,000 conversions

**Example:**
- 5,000 conversions/month = **$1**
- 50,000 conversions/month = **$10**

---

## ✅ **Success Criteria**

You're done when:
- ✅ All 5 Lambda functions created
- ✅ All functions have Function URLs
- ✅ .env file configured
- ✅ Local test passes
- ✅ Production deployment successful
- ✅ All 5 tools work on production

---

## 🎉 **Done?**

**Congratulations!** 🚀

Your PDFMasterTool is now live with all 5 server-side conversion tools!

Test it:
- Word → PDF ✅
- PowerPoint → PDF ✅
- PDF → Word ✅
- PDF → Excel ✅
- PDF → PowerPoint ✅

**Share your success:** Tweet about it or share on LinkedIn! 📢






