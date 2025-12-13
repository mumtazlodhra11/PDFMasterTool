# ⚡ Setup Lambda Functions - Super Quick Guide

**Current Issue:** Word to PDF (and 4 other tools) showing "Failed to fetch"  
**Reason:** Lambda functions not deployed yet  
**Time to Fix:** 30-45 minutes OR use alternative

---

## 🎯 **You Have 2 Options:**

### **Option 1: Deploy Lambda Functions ⭐ (Recommended)**
**Time:** 30-45 minutes  
**Cost:** FREE (AWS Free Tier)  
**Benefits:** Full control, better privacy

### **Option 2: Use CloudConvert API 🚀 (Fastest)**
**Time:** 5 minutes  
**Cost:** FREE (25 conversions/day)  
**Benefits:** No AWS setup needed

---

## 🚀 **OPTION 1: Deploy Lambda Functions**

### **Step 1: Go to AWS Lambda Console**
1. Open: https://console.aws.amazon.com/lambda/
2. Sign in to your AWS account
3. Select region: `eu-west-1` (or your preferred region)

### **Step 2: Create First Function (Word to PDF)**

#### **2.1 Create Function**
- Click "Create function"
- Function name: `pdfmaster-word-to-pdf`
- Runtime: **Node.js 20.x**
- Architecture: **x86_64**
- Click "Create function"

#### **2.2 Upload Code**
- In your project: `D:\PDFMasterTool\aws\lambda\word-to-pdf.zip`
- In AWS Console: Code → Upload from → .zip file
- Select `word-to-pdf.zip`
- Click "Save"

#### **2.3 Configure Settings**
- Configuration → General configuration → Edit
- Memory: **2048 MB**
- Timeout: **2 min**
- Click "Save"

#### **2.4 Add LibreOffice Layer**
- Configuration → Layers → Add layer
- Choose: **Specify an ARN**
- ARN: `arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1`
- Click "Add"

#### **2.5 Enable Function URL**
- Configuration → Function URL → Create function URL
- Auth type: **NONE**
- Configure CORS:
  - Allow origin: `*`
  - Allow methods: `POST, OPTIONS`
  - Allow headers: `Content-Type`
- Click "Save"
- **📋 COPY THE FUNCTION URL** (looks like: `https://xxx.lambda-url.eu-west-1.on.aws/`)

### **Step 3: Repeat for Other 4 Functions**

Create these same way:
1. ✅ `pdfmaster-word-to-pdf` (done above)
2. ⏭️ `pdfmaster-ppt-to-pdf` (use `ppt-to-pdf.zip`)
3. ⏭️ `pdfmaster-pdf-to-word` (use `pdf-to-word.zip`)
4. ⏭️ `pdfmaster-pdf-to-excel` (use `pdf-to-excel.zip`)
5. ⏭️ `pdfmaster-pdf-to-ppt` (use `pdf-to-ppt.zip`)

**Same settings for all:**
- Memory: 2048 MB
- Timeout: 2 min
- LibreOffice Layer (same ARN)
- Function URL enabled with CORS

### **Step 4: Update .env File**

Open `D:\PDFMasterTool\.env` and paste your URLs:

```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxxxx.lambda-url.eu-west-1.on.aws/
```

### **Step 5: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### **Step 6: Test**
```
http://localhost:9001/tools/word-to-pdf
```
Upload a .docx file → Should work! ✅

---

## 🚀 **OPTION 2: Use CloudConvert API (Quick Alternative)**

### **Step 1: Sign Up**
1. Go to: https://cloudconvert.com/
2. Sign up (free account)
3. Go to Dashboard → API → Create API Key
4. Copy your API key

### **Step 2: Update .env**

Add this line to `.env`:
```env
CLOUDCONVERT_API_KEY=your_api_key_here
```

### **Step 3: Update Code**

The code already supports CloudConvert as fallback!  
Just having the API key will make it work.

### **Limits:**
- Free: 25 conversions/day
- Paid: $9/month for 1000 conversions

---

## 📊 **Comparison**

| Feature | AWS Lambda | CloudConvert |
|---------|-----------|--------------|
| **Setup Time** | 30-45 min | 5 min |
| **Free Tier** | 1M requests/month | 25/day |
| **Cost After** | ~$0.20/1000 | $9/1000 |
| **Privacy** | Files never stored | Files processed on their servers |
| **Control** | Full control | Limited control |

---

## ✅ **Current Status**

Check what's working now:

```bash
# These 18 tools work WITHOUT Lambda:
✅ Merge PDF
✅ Split PDF
✅ Compress PDF
✅ Rotate PDF
✅ Image to PDF
✅ PDF to JPG
✅ Remove Pages
✅ Reorder Pages
✅ Add Page Numbers
✅ Watermark
✅ Unlock PDF
✅ HTML to PDF
✅ Annotate
✅ eSign
✅ Fill Forms
✅ Edit PDF
✅ Header/Footer
✅ AI OCR

# These 5 need Lambda OR CloudConvert:
❌ Word to PDF
❌ PowerPoint to PDF
❌ PDF to Word
❌ PDF to Excel
❌ PDF to PowerPoint
```

---

## 🆘 **Quick Help**

### **Error: "Failed to fetch"**
✅ **Fixed!** Now shows better error message:
- Tells you Lambda not deployed
- Shows which guide to follow
- Suggests trying other tools

### **Can't access AWS?**
Use Option 2 (CloudConvert)

### **Want to test locally first?**
Try the 18 working client-side tools:
```
http://localhost:9001/tools/merge-pdf
http://localhost:9001/tools/compress-pdf
```

---

## 🎯 **What I Did Just Now**

✅ Created `.env` file with empty Lambda URLs  
✅ Created `.env.example` for reference  
✅ Improved error message in code  
✅ Created this quick guide

**Next:** Choose Option 1 or 2 above and follow steps!

---

## 📞 **Need More Help?**

- **Full Lambda Guide:** `aws/LAMBDA_FIXES_COMPLETE.md`
- **Quick Deploy:** `aws/QUICK_DEPLOY.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

**Recommendation:** Start with **Option 2 (CloudConvert)** for immediate testing,  
then later deploy **Option 1 (Lambda)** for production use.

**Current time:** 2:33 AM  
**Your server:** Running on http://localhost:9001 ✅










