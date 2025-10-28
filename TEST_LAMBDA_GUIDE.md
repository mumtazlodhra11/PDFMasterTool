# 🧪 Lambda Functions Testing Guide

Complete guide to test your deployed Lambda functions!

---

## ✅ What's Ready:

- ✅ **5 Lambda functions** deployed in Ireland (eu-west-1)
- ✅ **Public Function URLs** with CORS enabled
- ✅ **Test clients** in Node.js and Python
- ✅ **All functions** ready for production

---

## 🎯 Quick Test Methods:

### **Method 1: Node.js Test Client** ⭐ RECOMMENDED

```bash
# Interactive mode
node test-lambda-client.js

# Command line mode
node test-lambda-client.js pdf-to-word sample.pdf
```

**Features:**
- ✅ Interactive menu
- ✅ Automatic file download
- ✅ Progress indicators
- ✅ Error handling

---

### **Method 2: Python Test Client**

```bash
# Install requirements
pip install requests

# Interactive mode
python test-lambda-client.py

# Command line mode
python test-lambda-client.py pdf-to-word sample.pdf
```

---

### **Method 3: cURL (Quick Test)**

```bash
# Test PDF to Word conversion
curl -X POST "https://xxr3sbwwhdjfanfdbaqwvsg2ea0bvzzk.lambda-url.eu-west-1.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "BASE64_ENCODED_PDF_HERE",
    "fileName": "test.pdf"
  }'
```

---

### **Method 4: Frontend (Full Experience)**

```bash
# Create .env file first (see LAMBDA_URLS_READY.md)

# Start dev server
npm run dev

# Open browser
http://localhost:9001/tools/pdf-to-word
```

---

## 📋 Test Each Function:

### **1. Word to PDF** (Not deployed yet)
```bash
node test-lambda-client.js word-to-pdf sample.docx
```

### **2. PPT to PDF**
```bash
node test-lambda-client.js ppt-to-pdf presentation.pptx
```

### **3. PDF to Word**
```bash
node test-lambda-client.js pdf-to-word document.pdf
```

### **4. PDF to Excel**
```bash
node test-lambda-client.js pdf-to-excel report.pdf
```

### **5. PDF to PowerPoint**
```bash
node test-lambda-client.js pdf-to-ppt slides.pdf
```

---

## 🔍 Expected Responses:

### **Success Response:**
```json
{
  "success": true,
  "fileContent": "BASE64_ENCODED_OUTPUT",
  "fileName": "converted.docx",
  "message": "Conversion successful"
}
```

### **Error Response:**
```json
{
  "success": false,
  "error": "Conversion failed: Invalid file format"
}
```

---

## 🧪 Test Scenarios:

### **Scenario 1: Basic Conversion**
```bash
# Test with sample file
node test-lambda-client.js pdf-to-word sample.pdf

# Expected: Downloads converted.docx
```

### **Scenario 2: Large File**
```bash
# Test with 10MB+ file
node test-lambda-client.js pdf-to-word large.pdf

# Expected: Takes 30-60 seconds
```

### **Scenario 3: Invalid File**
```bash
# Test with wrong file type
node test-lambda-client.js pdf-to-word image.jpg

# Expected: Error message
```

### **Scenario 4: Concurrent Requests**
```bash
# Test multiple files simultaneously
node test-lambda-client.js pdf-to-word file1.pdf &
node test-lambda-client.js pdf-to-word file2.pdf &
node test-lambda-client.js pdf-to-word file3.pdf &

# Expected: All complete successfully
```

---

## 📊 Performance Benchmarks:

| File Size | Expected Time | Status |
|-----------|---------------|--------|
| < 1 MB | 5-10 seconds | ✅ Fast |
| 1-5 MB | 10-30 seconds | ✅ Normal |
| 5-10 MB | 30-60 seconds | ✅ Acceptable |
| > 10 MB | 60-120 seconds | ⚠️ Slow (Lambda timeout) |

---

## ⚠️ Known Limitations:

1. **File Size:** Max ~10 MB (Lambda payload limit)
2. **Timeout:** Max 120 seconds (Lambda timeout)
3. **Concurrent:** Max 1000 requests/second (Lambda default)
4. **Memory:** 2048 MB per function

---

## 🔧 Troubleshooting:

### **Issue: "Network timeout"**
```
Solution: Increase timeout in test client
- Node.js: No timeout by default
- Python: timeout=300 (5 minutes)
- cURL: Add --max-time 300
```

### **Issue: "Invalid base64"**
```
Solution: Check file encoding
- Ensure proper base64 encoding
- Remove newlines/whitespace
- Verify file is not corrupted
```

### **Issue: "CORS error"**
```
Solution: Check Function URL CORS
- Should allow all origins (*)
- Should allow POST method
- Should allow all headers
```

### **Issue: "Function timeout"**
```
Solution: Large file handling
- Split large PDFs
- Increase Lambda timeout (max 15 min)
- Consider S3 upload/download
```

---

## 📈 Monitoring:

### **Check CloudWatch Logs:**
```bash
# Via AWS Console
https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups

# Via AWS CLI
aws logs tail /aws/lambda/pdfmaster-pdf-to-word --follow --region eu-west-1
```

### **Check Lambda Metrics:**
```bash
# Invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=pdfmaster-pdf-to-word \
  --start-time 2025-10-27T00:00:00Z \
  --end-time 2025-10-27T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region eu-west-1
```

---

## 🎯 Next Steps:

1. ✅ Test all 5 functions with sample files
2. ✅ Verify response times are acceptable
3. ✅ Check CloudWatch logs for errors
4. ✅ Test with various file sizes
5. ✅ Deploy Word-to-PDF function (missing)
6. ✅ Integrate with frontend
7. ✅ Deploy to production

---

## 📝 Create .env File:

Before testing with frontend, create `.env` file:

```env
PUBLIC_LAMBDA_WORD_TO_PDF=https://euptkdl3fgsgyoud66lkiti54q0nnwbx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://kjvlahhbpn5vgcz65eyp4as22m0qeytt.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxr3sbwwhdjfanfdbaqwvsg2ea0bvzzk.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://odxspqynwszdskoxt7ml2urbjq0qddvh.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://mxw5nxnwmsic4yflfnevu4aapa0dxqbq.lambda-url.eu-west-1.on.aws/
```

Save as: `D:\PDFMasterTool\.env`

---

## 🎉 Success Criteria:

Deployment is successful when:
- [x] All 5 Lambda functions deployed
- [x] All Function URLs accessible
- [ ] Test client successfully converts files
- [ ] Frontend connects to Lambda
- [ ] No errors in CloudWatch logs
- [ ] Response times < 60 seconds
- [ ] All file formats supported

---

## 💡 Pro Tips:

1. **Use test client for debugging** - easier than frontend
2. **Check CloudWatch immediately** - logs are real-time
3. **Start with small files** - faster iterations
4. **Monitor costs** - Lambda charges per request
5. **Enable X-Ray** - for detailed tracing (optional)

---

**Ready to test? Run:**

```bash
node test-lambda-client.js
```

**Good luck! 🚀**


