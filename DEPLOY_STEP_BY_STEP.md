# 🚀 Deploy Lambda - Step by Step Guide

**Follow this exactly - Takes 20 minutes**

---

## ✅ STEP 1: Update .env File

Open: `D:\PDFMasterTool\.env`

Add these 3 lines at the TOP:
```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAR75YKPGIWNM7CCRZ
AWS_SECRET_ACCESS_KEY=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
```

Save the file.

---

## 🚀 STEP 2: Deploy First Function (word-to-pdf)

### **2.1 Open AWS Lambda Console**

Click this link:
```
https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions
```

Login if needed.

### **2.2 Create Function**

1. Click orange **"Create function"** button (top right)
2. Keep **"Author from scratch"** selected
3. Fill in:
   - **Function name:** `pdfmaster-word-to-pdf`
   - **Runtime:** Select **"Node.js 20.x"** from dropdown
   - **Architecture:** Keep **"x86_64"** selected
4. Click orange **"Create function"** button at bottom

Wait 5 seconds for function to create.

### **2.3 Upload Code**

1. You'll see "Code" tab (already selected)
2. Scroll down to "Code source" section
3. Click **"Upload from"** dropdown button
4. Select **".zip file"**
5. Click **"Upload"** button
6. Navigate to: `D:\PDFMasterTool\aws\lambda\word-to-pdf.zip`
7. Select the file, click **"Open"**
8. Click orange **"Save"** button (top right)
9. Wait for upload to complete (green success message)

### **2.4 Configure Memory & Timeout**

1. Click **"Configuration"** tab (top)
2. Click **"General configuration"** in left sidebar
3. Click **"Edit"** button (top right)
4. Change:
   - **Memory:** Move slider to **2048 MB** OR type `2048`
   - **Timeout:** Change to **2 min 0 sec** (type: `2` min, `0` sec)
5. Click orange **"Save"** button

### **2.5 Add LibreOffice Layer**

1. Still in **"Configuration"** tab
2. Scroll down, click **"Layers"** in left sidebar
3. Click **"Add a layer"** button
4. Select **"Specify an ARN"** radio button
5. In text box, paste this EXACTLY:
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
```
6. Click orange **"Add"** button
7. You should see layer added (green success)

### **2.6 Enable Function URL**

1. Still in **"Configuration"** tab
2. Click **"Function URL"** in left sidebar
3. Click **"Create function URL"** button
4. Configure:
   - **Auth type:** Select **"NONE"** from dropdown
   - **✅ Check** the box: "Configure cross-origin resource sharing (CORS)"
   - CORS settings will appear:
     - **Allow origin:** Type `*`
     - **Allow methods:** Type `POST, OPTIONS`
     - **Allow headers:** Type `Content-Type`
5. Click orange **"Save"** button

### **2.7 COPY FUNCTION URL** ⭐ IMPORTANT

You'll see **"Function URL"** displayed. It looks like:
```
https://abcd1234xyz.lambda-url.eu-west-1.on.aws/
```

**COPY THIS ENTIRE URL!** 

Save it somewhere (Notepad) - you'll need it!

---

## 🔄 STEP 3: Repeat for Other 4 Functions

**Now you know the process!** Repeat Step 2 for:

### **Function 2: ppt-to-pdf**
- Name: `pdfmaster-ppt-to-pdf`
- ZIP: `ppt-to-pdf.zip`
- Same settings (2048MB, 2min, same layer, CORS)
- **COPY URL**

### **Function 3: pdf-to-word**
- Name: `pdfmaster-pdf-to-word`
- ZIP: `pdf-to-word.zip`
- Same settings
- **COPY URL**

### **Function 4: pdf-to-excel**
- Name: `pdfmaster-pdf-to-excel`
- ZIP: `pdf-to-excel.zip`
- Same settings
- **COPY URL**

### **Function 5: pdf-to-ppt**
- Name: `pdfmaster-pdf-to-ppt`
- ZIP: `pdf-to-ppt.zip`
- Same settings
- **COPY URL**

**Each function takes ~3 minutes when you know the process!**

---

## 📝 STEP 4: Update .env with URLs

Open: `D:\PDFMasterTool\.env`

Add these lines (paste your URLs):
```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://your-url-1.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://your-url-2.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://your-url-3.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://your-url-4.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://your-url-5.lambda-url.eu-west-1.on.aws/
```

Save the file.

---

## 🧪 STEP 5: Test

Restart server:
```bash
npm run dev
```

Open browser:
```
http://localhost:9001/tools/word-to-pdf
```

Upload a Word file → Should convert to PDF! ✅

---

## ⏱️ TIMELINE

```
Step 1: .env update         = 1 min
Step 2: First function      = 8-10 min
Step 3: Other 4 functions   = 12 min (3 min each)
Step 4: Update .env URLs    = 2 min
Step 5: Test                = 2 min
─────────────────────────────────────
TOTAL:                      = 25 min
```

---

## 🆘 TROUBLESHOOTING

**Can't find .zip files?**
Location: `D:\PDFMasterTool\aws\lambda\`

**Layer ARN not working?**
Try alternative: `arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6:1`

**Function URL not showing?**
Make sure you saved after creating it. Refresh page.

**Test fails?**
- Check all 5 URLs in .env
- Make sure server restarted
- Try uploading different file

---

## ✅ SUCCESS CHECKLIST

- [ ] .env file updated with credentials
- [ ] Function 1: word-to-pdf created
- [ ] Function 2: ppt-to-pdf created
- [ ] Function 3: pdf-to-word created
- [ ] Function 4: pdf-to-excel created
- [ ] Function 5: pdf-to-ppt created
- [ ] All 5 URLs copied to .env
- [ ] Server restarted
- [ ] Test successful
- [ ] ALL 23 TOOLS WORKING! 🎉

---

**Start with Step 1! You got this! 💪**








