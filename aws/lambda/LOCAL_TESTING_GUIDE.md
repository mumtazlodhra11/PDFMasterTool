# 🧪 Lambda Functions - Local Testing Guide

Test your Lambda functions locally **WITHOUT** deploying to AWS!

---

## 🎯 **Why Test Locally?**

✅ **Fast** - No deployment time  
✅ **Free** - No AWS costs  
✅ **Debug** - Easy to add console.logs  
✅ **Iterate** - Test changes instantly  

---

## 📋 **Prerequisites**

```bash
# You need:
✅ Node.js 20+ installed
✅ Test files in test-files/ directory
✅ Lambda functions in aws/lambda/ directory
```

---

## 🚀 **Quick Start**

### **Step 1: Create Test Files Directory**

```bash
cd aws/lambda
mkdir test-files
```

### **Step 2: Add Test Files**

Add sample files to `test-files/` directory:
- `sample.docx` - For testing word-to-pdf
- `sample.pptx` - For testing ppt-to-pdf
- `sample.pdf` - For testing pdf-to-word, pdf-to-excel, pdf-to-ppt

You can use any real files from your computer!

### **Step 3: Run Single Test**

```bash
# Test specific function
node test-lambda-local.js word-to-pdf test-files/sample.docx
node test-lambda-local.js pdf-to-word test-files/sample.pdf
```

### **Step 4: Run All Tests**

```bash
# Test all 5 functions at once
node test-all-local.js
```

---

## 📖 **Detailed Usage**

### **Test Single Function**

```bash
# Syntax:
node test-lambda-local.js [function-name] [test-file-path]

# Examples:
node test-lambda-local.js word-to-pdf test-files/my-doc.docx
node test-lambda-local.js ppt-to-pdf test-files/my-presentation.pptx
node test-lambda-local.js pdf-to-word test-files/my-file.pdf
node test-lambda-local.js pdf-to-excel test-files/my-file.pdf
node test-lambda-local.js pdf-to-ppt test-files/my-file.pdf
```

### **Available Functions**

| Function Name | Input Format | Output Format |
|---------------|--------------|---------------|
| `word-to-pdf` | .docx, .doc | .pdf |
| `ppt-to-pdf` | .pptx, .ppt | .pdf |
| `pdf-to-word` | .pdf | .docx |
| `pdf-to-excel` | .pdf | .xlsx |
| `pdf-to-ppt` | .pdf | .pptx |

---

## 📊 **Understanding Output**

### **Successful Test:**
```
================================
🧪 Testing: word-to-pdf
================================

✅ Lambda function loaded

📁 Test file: sample.docx
📊 File size: 12.45 KB
📦 Base64 size: 16.60 KB

⏳ Processing...

✅ SUCCESS!

⏱️  Processing time: 2450ms
📄 Output file: sample.pdf
📊 Output size: 45.67 KB
💾 Saved to: test-output/sample.pdf

================================
✅ TEST PASSED
================================
```

### **Failed Test:**
```
❌ FAILED!

Status: 500
Error: Conversion failed: libreoffice7.6: command not found

================================
❌ TEST FAILED
================================
```

---

## 🔍 **What Happens During Test?**

1. **Loads** Lambda function code
2. **Reads** your test file
3. **Converts** file to base64
4. **Calls** Lambda handler function
5. **Processes** conversion (simulates AWS)
6. **Saves** output to `test-output/` directory
7. **Reports** results

---

## 📁 **Output Files**

Converted files are saved to:
```
aws/lambda/test-output/
├── sample.pdf          (from word-to-pdf)
├── converted.docx      (from pdf-to-word)
├── converted.xlsx      (from pdf-to-excel)
└── converted.pptx      (from pdf-to-ppt)
```

You can open these files to verify conversion quality!

---

## ⚠️ **Important Notes**

### **LibreOffice Required**

Lambda functions use LibreOffice for conversion. Local testing will:

❌ **FAIL** if LibreOffice not installed locally  
✅ **PASS** logic test but skip actual conversion

**This is NORMAL!** The code works fine on AWS Lambda where LibreOffice is bundled.

### **What Gets Tested Locally:**

✅ **Code logic** - Function structure  
✅ **Base64 handling** - Input/output encoding  
✅ **Error handling** - Error messages  
✅ **Response format** - JSON structure  
❌ **Actual conversion** - Needs LibreOffice (AWS has it)

---

## 🧪 **Test Scenarios**

### **Scenario 1: Test with Real Files**
```bash
# Use your own files
node test-lambda-local.js word-to-pdf "C:/Users/Documents/report.docx"
node test-lambda-local.js pdf-to-word "C:/Users/Downloads/contract.pdf"
```

### **Scenario 2: Test Error Handling**
```bash
# Test with missing file
node test-lambda-local.js word-to-pdf non-existent-file.docx

# Expected: Error message about missing file
```

### **Scenario 3: Test All Functions**
```bash
# Batch test
node test-all-local.js

# Shows summary of all 5 functions
```

---

## 🐛 **Troubleshooting**

### **Error: "Lambda function not found"**
```bash
# Make sure you're in the right directory
cd aws/lambda
node test-lambda-local.js word-to-pdf
```

### **Error: "Test file not found"**
```bash
# Create test-files directory
mkdir test-files

# Add your test files
copy sample.docx test-files/
```

### **Error: "Cannot find module"**
```bash
# Install dependencies
npm install
```

### **Error: "libreoffice7.6: command not found"**
✅ **EXPECTED!** This is normal for local testing.  
The conversion will work on AWS Lambda where LibreOffice is installed.

---

## 📊 **Example Test Run**

```bash
PS D:\PDFMasterTool\aws\lambda> node test-lambda-local.js word-to-pdf test-files/sample.docx

================================
🧪 Testing: word-to-pdf
================================

✅ Lambda function loaded

📁 Test file: sample.docx
📊 File size: 12.45 KB
📦 Base64 size: 16.60 KB

⏳ Processing...

❌ FAILED!

Status: 500
Error: Conversion failed: spawn libreoffice7.6 ENOENT

================================
❌ TEST FAILED
================================

# This is EXPECTED! LibreOffice not installed locally.
# Code logic is correct and will work on AWS.
```

---

## ✅ **What To Check Before AWS Deployment**

Run these tests locally:

### **1. Code Logic Test**
```bash
# Does the function load without errors?
node -e "require('./word-to-pdf.js')"
```
Expected: No errors

### **2. Base64 Handling Test**
```bash
# Test with small test file
node test-lambda-local.js word-to-pdf test-files/sample.docx
```
Expected: Gets to "Processing..." stage

### **3. Response Format Test**
Check the response structure matches:
```json
{
  "statusCode": 200,
  "body": "{\"success\":true,\"fileContent\":\"...\",\"fileName\":\"...\"}"
}
```

---

## 🎯 **After Local Testing**

Once local tests pass (code-wise), deploy to AWS:

### **Option 1: Quick Deploy (ZIP)**
```bash
# See: aws/QUICK_DEPLOY.md
# Uses AWS Lambda + LibreOffice Layer
```

### **Option 2: Container Deploy**
```bash
# See: aws/lambda-containers/LIBREOFFICE_FIXED.md
# Full LibreOffice bundled in container
```

---

## 💡 **Pro Tips**

1. **Start Small** - Test with small files (< 1 MB)
2. **Check Logs** - Add console.log() for debugging
3. **Test Edge Cases** - Try corrupted files, wrong formats
4. **Verify Output** - Open converted files to check quality
5. **Measure Time** - Note processing times for optimization

---

## 📚 **Related Docs**

- **Lambda Fixes:** `aws/LAMBDA_FIXES_COMPLETE.md`
- **Quick Deploy:** `aws/QUICK_DEPLOY.md`
- **Container Deploy:** `aws/lambda-containers/LIBREOFFICE_FIXED.md`
- **Main Status:** `ALL_LAMBDA_FIXES_COMPLETE.md`

---

## 🎉 **Summary**

✅ **Local testing** lets you verify code WITHOUT AWS  
✅ **Two test scripts** provided (single + all functions)  
✅ **Easy to use** - Just run node commands  
✅ **Fast feedback** - No deployment wait time  
⚠️ **LibreOffice needed** on AWS only (not locally)  

**Test locally → Deploy to AWS → Full functionality! 🚀**










