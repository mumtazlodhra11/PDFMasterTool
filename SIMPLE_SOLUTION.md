# 🎯 SIMPLEST SOLUTION - Deploy in 15 Minutes

**Problem:** AWS CLI install karna padega (time lagega)  
**Solution:** Manual deployment actually EASIER hai!

---

## ✅ EASIEST WAY - Manual Console (15-20 min)

**Why this is better:**
- ✅ No installation needed
- ✅ Visual interface (easy to follow)
- ✅ Copy-paste settings
- ✅ Works immediately

---

## 🚀 QUICK START (3 STEPS)

### **STEP 1: Update .env (1 min)**

Open: `D:\PDFMasterTool\.env`

Add at top:
```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAR75YKPGIWNM7CCRZ
AWS_SECRET_ACCESS_KEY=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
```

Save file.

---

### **STEP 2: Deploy First Function (10 min)**

#### **2.1 Open AWS Console**
```
https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1
```

#### **2.2 Create Function**
- Click **"Create function"**
- Name: `pdfmaster-word-to-pdf`
- Runtime: **Node.js 20.x**
- Click **"Create"**

#### **2.3 Upload Code**
- Code tab → Upload from → .zip file
- Choose: `D:\PDFMasterTool\aws\lambda\word-to-pdf.zip`
- Save

#### **2.4 Configure**
- Configuration → General → Edit
- Memory: **2048 MB**
- Timeout: **2 min**
- Save

#### **2.5 Add Layer**
- Configuration → Layers → Add layer
- Specify an ARN:
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
```
- Add

#### **2.6 Enable Function URL**
- Configuration → Function URL → Create
- Auth: **NONE**
- ✅ Enable CORS
- Allow origin: `*`
- Allow methods: `POST, OPTIONS`
- Save

#### **2.7 COPY URL**
Copy the Function URL (looks like `https://xxx.lambda-url.eu-west-1.on.aws/`)

---

### **STEP 3: Test (2 min)**

Add URL to `.env`:
```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://your-url-here.lambda-url.eu-west-1.on.aws/
```

Restart server:
```bash
npm run dev
```

Test:
```
http://localhost:9001/tools/word-to-pdf
```

Upload Word file → Should work! ✅

---

## 🔁 REPEAT FOR OTHER 4 FUNCTIONS

Same steps for:
- `pdfmaster-ppt-to-pdf` (ppt-to-pdf.zip)
- `pdfmaster-pdf-to-word` (pdf-to-word.zip)
- `pdfmaster-pdf-to-excel` (pdf-to-excel.zip)
- `pdfmaster-pdf-to-ppt` (pdf-to-ppt.zip)

Each takes ~3 min (copy same settings)

---

## ⏱️ TOTAL TIME

```
Step 1: .env update        = 1 min
Step 2: First function     = 10 min
Step 3: Other 4 functions  = 12 min (3 min each)
Step 4: Test               = 2 min
────────────────────────────────────
TOTAL:                     = 25 min
```

---

## 🎯 START NOW

1. **Update .env** (copy-paste above)
2. **Open console:** https://eu-west-1.console.aws.amazon.com/lambda/
3. **Follow Step 2** above
4. **Done!**

---

**Ready? Let's deploy! 🚀**






