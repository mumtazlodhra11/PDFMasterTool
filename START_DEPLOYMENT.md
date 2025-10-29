# 🚀 AWS Lambda Deployment - Let's Go!

**Time:** 45 minutes  
**Cost:** FREE (AWS Free Tier)  
**Status:** Your code is ready!

---

## ✅ Pre-Deployment Checklist

- [x] Lambda functions fixed ✅
- [x] Local tests passed ✅
- [x] Documentation complete ✅
- [x] ZIP files ready ✅
- [ ] AWS account ready
- [ ] Deploy to AWS
- [ ] Configure .env
- [ ] Test live

---

## 📋 **Step 1: AWS Account Setup (5 min)**

### **1.1 Create AWS Account (if needed)**

If you don't have an AWS account:
1. Go to: https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Fill in your details
4. Add credit card (won't be charged if within free tier)
5. Verify phone number
6. Choose "Basic Support - Free"

### **1.2 Sign In to AWS Console**

1. Go to: https://console.aws.amazon.com/
2. Sign in with your AWS account
3. Select region: **EU (Ireland) eu-west-1** (or your preferred region)

**✅ Checkpoint:** You're now logged into AWS Console

---

## 📦 **Step 2: Deploy First Lambda Function (10 min)**

Let's deploy **word-to-pdf** first, then repeat for others.

### **2.1 Go to Lambda Console**

1. In AWS Console search bar, type: **Lambda**
2. Click "Lambda" service
3. Click "Create function" button

### **2.2 Create Function**

**Basic Information:**
- ✅ Choose "Author from scratch"
- Function name: `pdfmaster-word-to-pdf`
- Runtime: **Node.js 20.x**
- Architecture: **x86_64**

**Permissions:**
- ✅ Leave as default (creates new role)

Click **"Create function"**

**✅ Checkpoint:** Function created successfully

### **2.3 Upload Code**

1. In the "Code" tab, click "Upload from"
2. Select ".zip file"
3. Click "Upload"
4. Navigate to: `D:\PDFMasterTool\aws\lambda\word-to-pdf.zip`
5. Select the file
6. Click "Save"
7. Wait for upload to complete (shows green success message)

**✅ Checkpoint:** Code uploaded successfully

### **2.4 Configure Function**

**Configuration → General configuration → Edit:**
- Memory: **2048 MB**
- Timeout: **2 min 0 sec**
- Ephemeral storage: **512 MB** (default)

Click **"Save"**

**✅ Checkpoint:** Configuration saved

### **2.5 Add LibreOffice Layer**

**Configuration → Layers → Add a layer:**

Choose: **"Specify an ARN"**

Copy and paste this ARN:
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
```

**Note:** If you're using a different region, replace `eu-west-1` with your region.

Can't find the layer? Alternative:
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6:1
```

Click **"Add"**

**✅ Checkpoint:** LibreOffice layer added

### **2.6 Enable Function URL**

**Configuration → Function URL → Create function URL:**

- Auth type: **NONE** ⚠️ (for public access)
- Configure cross-origin resource sharing (CORS): **✅ Check this box**

**CORS Configuration:**
- Allow origin: `*`
- Allow methods: `POST, OPTIONS`
- Allow headers: `Content-Type`
- Max age: `86400`

Click **"Save"**

**🎉 IMPORTANT:** Copy your Function URL!

It will look like:
```
https://xxxxxxxxxxxxx.lambda-url.eu-west-1.on.aws/
```

**Save this URL!** You'll need it in .env file.

**✅ Checkpoint:** Function URL created

### **2.7 Test Function (Optional)**

**Test → Configure test event:**

Event name: `test-word-to-pdf`

Event JSON:
```json
{
  "body": "{\"fileContent\":\"SGVsbG8gV29ybGQ=\",\"fileName\":\"test.txt\"}"
}
```

Click **"Save"**

Click **"Test"**

Expected result:
- ❌ May fail (sample data too simple)
- ✅ OR shows success with converted file

**Don't worry if test fails** - it will work with real files from frontend!

---

## 🔁 **Step 3: Deploy Remaining 4 Functions (20 min)**

Repeat Step 2 for each remaining function:

### **Function 2: ppt-to-pdf**

Follow exact same steps as above, but use:
- Function name: `pdfmaster-ppt-to-pdf`
- ZIP file: `ppt-to-pdf.zip`
- Same memory, timeout, layer settings
- Create Function URL
- **Copy Function URL**

### **Function 3: pdf-to-word**

- Function name: `pdfmaster-pdf-to-word`
- ZIP file: `pdf-to-word.zip`
- Same settings
- **Copy Function URL**

### **Function 4: pdf-to-excel**

- Function name: `pdfmaster-pdf-to-excel`
- ZIP file: `pdf-to-excel.zip`
- Same settings
- **Copy Function URL**

### **Function 5: pdf-to-ppt**

- Function name: `pdfmaster-pdf-to-ppt`
- ZIP file: `pdf-to-ppt.zip`
- Same settings
- **Copy Function URL**

**✅ Checkpoint:** All 5 functions created!

---

## 📝 **Step 4: Update .env File (2 min)**

Open `D:\PDFMasterTool\.env` and add your URLs:

```env
# AWS Lambda Function URLs
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxxxx.lambda-url.eu-west-1.on.aws/
```

**Make sure:**
- ✅ No quotes around URLs
- ✅ No trailing slashes
- ✅ All 5 URLs filled in

**Save the file!**

**✅ Checkpoint:** .env configured

---

## 🧪 **Step 5: Test Locally (3 min)**

### **5.1 Restart Dev Server**

Stop current server (Ctrl+C if running)

```bash
npm run dev
```

Server should restart and load .env variables.

### **5.2 Test Word to PDF**

1. Open browser: `http://localhost:9001/tools/word-to-pdf`
2. Upload a Word document (.docx file)
3. Click "Process Files"
4. Wait 5-10 seconds (first request = cold start)
5. Download should start!

**Expected:**
- ✅ Upload works
- ✅ Processing shows (may take 5-10s first time)
- ✅ Download starts
- ✅ Open downloaded PDF - should work!

**If it works: 🎉 SUCCESS!**

### **5.3 Test Other Tools**

Try these tools:
- PowerPoint to PDF: `http://localhost:9001/tools/powerpoint-to-pdf`
- PDF to Word: `http://localhost:9001/tools/pdf-to-word`
- PDF to Excel: `http://localhost:9001/tools/pdf-to-excel`
- PDF to PowerPoint: `http://localhost:9001/tools/pdf-to-ppt`

**✅ Checkpoint:** All tools working locally!

---

## 🌐 **Step 6: Deploy to Production (5 min)**

### **6.1 Build for Production**

```bash
npm run build
```

Wait for build to complete (1-2 minutes).

### **6.2 Deploy to Vercel**

**Install Vercel CLI (if not installed):**
```bash
npm install -g vercel
```

**Login:**
```bash
vercel login
```

**Deploy:**
```bash
vercel --prod
```

Follow prompts:
- Project name: `pdfmastertool`
- Accept defaults

**Or Deploy to Netlify:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**✅ Checkpoint:** Deployed to production!

---

## 🎉 **DONE! All Tools Live!**

### **Test Your Live Site:**

Visit your production URL and test:
- ✅ Word to PDF
- ✅ PowerPoint to PDF
- ✅ PDF to Word
- ✅ PDF to Excel
- ✅ PDF to PowerPoint

**All 23 tools should be working!** 🚀

---

## 📊 **Cost Monitoring**

### **Check AWS Lambda Costs:**

1. AWS Console → CloudWatch → Dashboard
2. Lambda → Metrics
3. Check invocation count

**Expected:**
- First 1M requests: FREE
- After: ~$0.20 per 1,000 requests

---

## 🆘 **Troubleshooting**

### **Problem: "Missing LibreOffice layer"**

**Solution:**
1. Go to Function → Configuration → Layers
2. Remove existing layer
3. Add layer with ARN:
   ```
   arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
   ```

### **Problem: "Timeout after 3 seconds"**

**Solution:**
1. Configuration → General configuration → Edit
2. Change timeout to: **2 min 0 sec**
3. Save

### **Problem: "CORS error in browser"**

**Solution:**
1. Configuration → Function URL → Edit
2. Enable CORS
3. Allow origin: `*`
4. Allow methods: `POST, OPTIONS`
5. Allow headers: `Content-Type`
6. Save

### **Problem: "Internal server error"**

**Solution:**
1. Go to Monitor → Logs
2. Click "View logs in CloudWatch"
3. Check recent log streams
4. Look for error messages
5. Share error with me for help!

---

## 📋 **Deployment Checklist**

Use this to track your progress:

- [ ] Step 1: AWS account created/logged in
- [ ] Step 2.1: word-to-pdf function created
- [ ] Step 2.2: word-to-pdf code uploaded
- [ ] Step 2.3: word-to-pdf configured (2GB, 2min)
- [ ] Step 2.4: word-to-pdf LibreOffice layer added
- [ ] Step 2.5: word-to-pdf Function URL created
- [ ] Step 3.1: ppt-to-pdf deployed
- [ ] Step 3.2: pdf-to-word deployed
- [ ] Step 3.3: pdf-to-excel deployed
- [ ] Step 3.4: pdf-to-ppt deployed
- [ ] Step 4: .env file updated
- [ ] Step 5: Local testing passed
- [ ] Step 6: Production deployment done
- [ ] Final: All tools tested and working!

---

## 🎯 **Quick Reference**

**Function Settings (same for all 5):**
- Memory: 2048 MB
- Timeout: 2 min
- Runtime: Node.js 20.x
- Architecture: x86_64
- Layer ARN: `arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1`

**ZIP Files Location:**
- `D:\PDFMasterTool\aws\lambda\*.zip`

**.env File Location:**
- `D:\PDFMasterTool\.env`

---

## 📞 **Need Help?**

If you get stuck:
1. Check CloudWatch Logs (Monitor → Logs)
2. Verify all settings match this guide
3. Check .env file has all 5 URLs
4. Restart dev server after .env changes

---

**Let's Deploy! 🚀**

Start with Step 1 and work your way through.  
Take your time, follow each step carefully.  
You've got this! 💪








