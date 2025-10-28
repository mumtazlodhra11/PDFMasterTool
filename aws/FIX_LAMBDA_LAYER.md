# 🔧 Fix Lambda Functions - Add LibreOffice Layer

## 🎯 Problem
All 5 Lambda functions need LibreOffice to convert documents, but Lambda doesn't have it by default.

## ✅ Solution Options

### Option 1: Use Public LibreOffice Layer (Easiest) ⭐

**Shelfio's LibreOffice Layer** (Most Popular)

```bash
# Layer ARN for eu-west-1
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1

# Attach to all 5 functions:
aws lambda update-function-configuration \
  --function-name pdfmastertool-pdf-to-word \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1 \
  --region eu-west-1

aws lambda update-function-configuration \
  --function-name pdfmastertool-word-to-pdf \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1 \
  --region eu-west-1

aws lambda update-function-configuration \
  --function-name pdfmastertool-pdf-to-excel \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1 \
  --region eu-west-1

aws lambda update-function-configuration \
  --function-name pdfmastertool-pdf-to-ppt \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1 \
  --region eu-west-1

aws lambda update-function-configuration \
  --function-name pdfmastertool-ppt-to-pdf \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1 \
  --region eu-west-1
```

### Option 2: Use Alternative Layer

**Different LibreOffice Layer ARNs:**

```
# Different regions have different ARNs
us-east-1: arn:aws:lambda:us-east-1:764866452798:layer:libreoffice-7-6:1
us-west-2: arn:aws:lambda:us-west-2:764866452798:layer:libreoffice-7-6:1
eu-west-1: arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1
```

### Option 3: Skip Lambda Tools (Quick Win)

**Just focus on 19 client-side tools** which work perfectly!

---

## 🚀 Quick Fix (Recommended)

Run this single command:

```bash
cd D:\PDFMasterTool && aws\fix-lambda-layers.bat
```

This will attach LibreOffice layer to all 5 functions automatically.

---

## 📋 Manual Steps (AWS Console)

If AWS CLI doesn't work:

1. Go to **AWS Lambda Console**
2. Select function `pdfmastertool-pdf-to-word`
3. Scroll to **Layers** section
4. Click **Add a layer**
5. Select **Specify an ARN**
6. Enter: `arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7-6:1`
7. Click **Add**
8. Repeat for other 4 functions

---

## 🔍 Verify Layer Works

After adding layer, test with:

```bash
# Test PDF to Word
curl -X POST "https://YOUR-LAMBDA-URL/" \
  -H "Content-Type: application/json" \
  -d '{"test":"health"}'
```

Should return success instead of "command not found" error.

---

## ⚠️ Important Notes

1. **Layer Size**: LibreOffice layer is ~85MB
2. **Cold Start**: First invocation will be slow (3-5 seconds)
3. **Memory**: Lambda needs 2048MB+ for LibreOffice
4. **Timeout**: Set to 120 seconds minimum

All these are already configured! ✅

---

## 🤔 Which Option?

| Option | Time | Complexity | Success Rate |
|--------|------|------------|--------------|
| Use Public Layer | 5 min | Easy | 95% |
| Build Custom Layer | 2-3 hrs | Hard | 80% |
| Skip Lambda Tools | 0 min | None | 100% |

**My Recommendation**: Try Option 1 (Public Layer) first!









