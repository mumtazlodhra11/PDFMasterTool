# ☁️ CloudConvert Setup Guide

## 🎯 What is CloudConvert?

Professional API service for document conversions:
- ✅ Word ↔ PDF
- ✅ Excel ↔ PDF  
- ✅ PowerPoint ↔ PDF
- ✅ 200+ formats supported
- ✅ Better quality than LibreOffice

---

## 📝 Step 1: Get API Key (5 minutes)

### 1. Create Account
```
Go to: https://cloudconvert.com/register
- Sign up with email
- Verify email
- Free tier: 25 conversions/day
```

### 2. Get API Key
```
1. Login to dashboard: https://cloudconvert.com/dashboard
2. Go to "API" section
3. Click "Create API Key"
4. Copy the key (starts with "eyJ...")
```

---

## 🔧 Step 2: Add to Project (2 minutes)

### Add API Key to `.env`

```bash
# Open .env file and add:
PUBLIC_CLOUDCONVERT_API_KEY=your_api_key_here
```

**Important:** Keep this key secret! Don't commit to Git.

---

## ✅ Step 3: Update Tool Pages (10 minutes)

I've already created the CloudConvert utility. Now update tool pages:

### Update `src/pages/tools/word-to-pdf.astro`

```javascript
import { wordToPDF } from '@/utils/cloudConvert';

// In ToolTemplate onProcess:
onProcess={async (files) => {
  const result = await wordToPDF(files[0]);
  return result;
}}
```

### Update `src/pages/tools/pdf-to-word.astro`

```javascript
import { pdfToWord } from '@/utils/cloudConvert';

onProcess={async (files) => {
  const result = await pdfToWord(files[0]);
  return result;
}}
```

### Similarly update:
- `pdf-to-excel.astro` → `pdfToExcel()`
- `excel-to-pdf.astro` → `excelToPDF()`
- `pdf-to-ppt.astro` → `pdfToPPT()`
- `powerpoint-to-pdf.astro` → `pptToPDF()`

---

## 💰 Pricing

### Free Tier (For Testing)
```
✅ 25 conversions/day
✅ All formats included
✅ No credit card required
```

### Paid Plans (When Site Grows)
```
Starter: $9.99/month
- 1,000 conversion minutes
- ~500-1000 files depending on size

Pro: $29.99/month  
- 5,000 conversion minutes
- ~2500-5000 files

Business: Custom pricing
```

### Cost Estimation
```
If 100 conversions/day:
- Free tier covers first 25
- Remaining 75 conversions
- Cost: ~$0.30/day = $9/month

Break even: Site needs ~10-20 conversions/day to justify cost vs AWS Lambda complexity
```

---

## 🆚 CloudConvert vs Lambda

| Feature | CloudConvert | Lambda + LibreOffice |
|---------|--------------|---------------------|
| Setup Time | 30 min | 3-4 hours |
| Cost (100/day) | $9/month | $5-10/month |
| Maintenance | Zero | Medium |
| Quality | Excellent | Good |
| Formats | 200+ | Limited |
| Cold Start | None | 3-5 sec |
| Success Rate | 99.9% | ~95% |

---

## 🚀 Alternative: ConvertAPI (Similar Service)

If CloudConvert doesn't work:

```javascript
// ConvertAPI alternative
const response = await fetch('https://v2.convertapi.com/convert/docx/to/pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_CONVERTAPI_KEY',
  },
  body: formData,
});
```

**Pricing:**
- Free: 1500 seconds/month (~750 files)
- Paid: $10/month for 10,000 seconds

---

## ⚡ Quick Start Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Add API key to .env
echo "PUBLIC_CLOUDCONVERT_API_KEY=your_key_here" >> .env

# 3. Test locally
npm run dev

# 4. Test conversions at:
http://localhost:9001/tools/pdf-to-word
```

---

## 🧪 Testing

### Test Conversion
```javascript
// Test with small file first
const testFile = new File(['test'], 'test.docx', { 
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
});

const result = await wordToPDF(testFile);
console.log('Conversion successful!', result);
```

---

## 📊 Monitoring Usage

Dashboard: https://cloudconvert.com/dashboard/usage

```
- Check conversions used
- Monitor quota
- Upgrade when needed
```

---

## 🎯 When to Use Each Solution

### Use CloudConvert If:
```
✅ Want quick launch (30 min)
✅ Need high conversion quality
✅ Don't want to manage infrastructure
✅ Okay with $10-30/month cost
```

### Use Lambda + LibreOffice If:
```
✅ Have time (3-4 hours setup)
✅ Want zero recurring costs
✅ High conversion volume (>1000/day)
✅ Have AWS expertise
```

---

## 🚀 Ready to Implement?

**Option A: CloudConvert (Recommended for Now)**
```
1. Get API key (5 min)
2. Add to .env (1 min)
3. I'll update tool pages (10 min)
4. Test (5 min)
━━━━━━━━━━━━━━━━━
Total: 21 minutes! ✅
```

**Option B: Build Lambda Containers**
```
1. Create Dockerfiles (30 min)
2. Build images (20 min)
3. Push to ECR (10 min)
4. Update Lambda (20 min)
━━━━━━━━━━━━━━━━━
Total: 80 minutes
```

---

**Batao - CloudConvert API key lao aur 30 minutes me sab fix karte hain?** 🚀

Ya phir Lambda containers bana hain (2 hours work)?













