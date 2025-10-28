# ⚡ Quick Reference - Lambda Deployment

**Keep this open while deploying!**

---

## 🎯 **Function Settings (Copy These)**

**For ALL 5 Functions:**

| Setting | Value |
|---------|-------|
| Runtime | Node.js 20.x |
| Architecture | x86_64 |
| Memory | 2048 MB |
| Timeout | 2 min 0 sec |
| Handler | (leave default) |

---

## 📦 **ZIP Files to Upload**

| Function Name | ZIP File |
|---------------|----------|
| pdfmaster-word-to-pdf | word-to-pdf.zip |
| pdfmaster-ppt-to-pdf | ppt-to-pdf.zip |
| pdfmaster-pdf-to-word | pdf-to-word.zip |
| pdfmaster-pdf-to-excel | pdf-to-excel.zip |
| pdfmaster-pdf-to-ppt | pdf-to-ppt.zip |

**Location:** `D:\PDFMasterTool\aws\lambda\*.zip`

---

## 🔧 **LibreOffice Layer ARN**

**Copy and paste this:**

```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6-brotli:1
```

**For other regions:** Replace `eu-west-1` with your region.

**Alternative ARN (if first doesn't work):**
```
arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_6:1
```

---

## 🌐 **CORS Configuration**

**For Function URL:**

| Setting | Value |
|---------|-------|
| Auth type | NONE |
| Allow origin | * |
| Allow methods | POST, OPTIONS |
| Allow headers | Content-Type |
| Max age | 86400 |

---

## 📝 **.env Template**

**Copy URLs here as you create functions:**

```env
PUBLIC_LAMBDA_WORD_TO_PDF=
PUBLIC_LAMBDA_PPT_TO_PDF=
PUBLIC_LAMBDA_PDF_TO_WORD=
PUBLIC_LAMBDA_PDF_TO_EXCEL=
PUBLIC_LAMBDA_PDF_TO_PPT=
```

---

## ✅ **Deployment Checklist**

```
[ ] 1. word-to-pdf - Created & URL copied
[ ] 2. ppt-to-pdf - Created & URL copied
[ ] 3. pdf-to-word - Created & URL copied
[ ] 4. pdf-to-excel - Created & URL copied
[ ] 5. pdf-to-ppt - Created & URL copied
[ ] 6. .env file updated
[ ] 7. Dev server restarted
[ ] 8. Tested locally
[ ] 9. All working!
```

---

## 🔗 **Quick Links**

- **AWS Console:** https://console.aws.amazon.com/
- **Lambda Service:** https://console.aws.amazon.com/lambda/
- **Your Project:** http://localhost:9001

---

## 🆘 **Quick Fixes**

### **Can't find LibreOffice layer?**
Use ARN directly in "Specify an ARN" option

### **Function timeout?**
Configuration → General → Timeout → 2 min

### **CORS error?**
Function URL → Edit → Enable CORS → Save

### **Code upload failed?**
Make sure file size < 50 MB (all are ~10-15 MB)

---

## 💡 **Tips**

1. ✅ Do first function slowly and carefully
2. ✅ Copy settings for remaining functions
3. ✅ Test each function after creating
4. ✅ Save all Function URLs immediately
5. ✅ Don't forget to restart dev server!

---

**Time per function:**
- First: 10 min (learn process)
- Rest: 5 min each (repeat process)
- **Total: ~45 min** ⏱️

Good luck! 🚀






