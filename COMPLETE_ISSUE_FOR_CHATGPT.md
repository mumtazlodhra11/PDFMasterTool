# Complete Issue Summary - PDF Conversion Lambda Deployment

## 🎯 GOAL (What We Want to Achieve)
Deploy AWS Lambda functions that convert documents using LibreOffice:
- PDF to Word (.docx)
- PDF to Excel (.xlsx)
- PDF to PPT (.pptx)
- PPT to PDF
- Word to PDF

**Requirements:**
- Must work with existing Lambda Function URLs (already deployed)
- Must be 100% FREE (no paid APIs)
- Must use LibreOffice for high-quality conversions
- Backend must be production-ready

---

## 📋 CURRENT STATUS

### ✅ What's Already Working:
1. **5 Lambda functions deployed** with Function URLs:
   - `pdfmastertool-pdf-to-word`
   - `pdfmastertool-pdf-to-excel`
   - `pdfmastertool-pdf-to-ppt`
   - `pdfmastertool-ppt-to-pdf`
   - `pdfmastertool-word-to-pdf`

2. **Function URLs are public and accessible**:
   - https://xxr3sbwwhdjfanfdbaqwvsg2ea0bvzzk.lambda-url.eu-west-1.on.aws/ (pdf-to-word)
   - https://odxspqynwszdskoxt7ml2urbjq0qddvh.lambda-url.eu-west-1.on.aws/ (pdf-to-excel)
   - https://mxw5nxnwmsic4yflfnevu4aapa0dxqbq.lambda-url.eu-west-1.on.aws/ (pdf-to-ppt)
   - Plus 2 more

3. **Frontend is ready** and making requests to Lambda

4. **IAM Role exists**: `PDFMasterTool-Lambda-Role`

5. **EC2 instance available** for deployment:
   - IP: 34.241.164.163
   - Region: eu-west-1
   - AWS CLI configured
   - Docker installed
   - 50GB storage

### ❌ What's NOT Working:
Lambda functions currently contain **mock data** - they return dummy responses instead of actual conversions.

**When we test from frontend:** "Conversion failed" error appears because Lambda doesn't have LibreOffice.

---

## 🔧 WHAT WE TRIED (All Failed Attempts)

### **Attempt 1: Simple Lambda ZIP Deployment**
```javascript
// Code uses LibreOffice via child_process
execSync('libreoffice --headless --convert-to docx input.pdf');
```
**Issue:** LibreOffice not installed in Lambda environment.
**Error:** `Command 'libreoffice' not found`

---

### **Attempt 2: Docker Lambda with Debian + LibreOffice**
```dockerfile
FROM debian:bookworm-slim
RUN apt-get install libreoffice-core libreoffice-writer
RUN npm install -g aws-lambda-ric
```
**Issue:** `aws-lambda-ric` failed to install - requires `cmake`, `autoreconf`, and many build tools.
**Errors:**
- `cmake is not installed`
- `autoreconf: not found`
- Build dependencies missing

---

### **Attempt 3: AWS Lambda Official Base Image with yum**
```dockerfile
FROM public.ecr.aws/lambda/nodejs:20
RUN yum install -y libreoffice
```
**Issue:** `yum: command not found` - Lambda base image doesn't have yum.

---

### **Attempt 4: AWS Lambda Base Image with microdnf**
```dockerfile
FROM public.ecr.aws/lambda/nodejs:20
RUN microdnf install -y wget tar gzip
RUN wget LibreOffice_7.6.4_Linux_x86-64_rpm.tar.gz
RUN rpm -Uvh --nodeps *.rpm
```
**Issue:** LibreOffice download/extraction failed during Docker build.
**Error:** `returned a non-zero code: 8`

---

### **Attempt 5: Public Lambda Layer**
```bash
aws lambda update-function-configuration \
  --layers arn:aws:lambda:eu-west-1:764866452798:layer:libreoffice-7_4:1
```
**Issue:** Permission denied - EC2 IAM role can't access external layer.
**Error:** `User is not authorized to perform: lambda:GetLayerVersion because no resource-based policy allows the lambda:GetLayerVersion action`

---

### **Attempt 6: CloudConvert API**
Suggested using CloudConvert API for conversions.
**Issue:** User requirement is 100% FREE solution - no paid APIs allowed.

---

## 🚧 CORE PROBLEMS

### **Problem 1: LibreOffice Installation**
- Standard Lambda doesn't include LibreOffice
- Docker builds with LibreOffice fail due to:
  - Missing build dependencies (cmake, autoreconf, g++, make)
  - Complex dependency chains
  - Lambda RIC (Runtime Interface Client) compilation issues

### **Problem 2: Lambda Container Complexity**
- Official AWS Lambda images use `microdnf` (not apt/yum)
- Installing LibreOffice from source requires extensive build tools
- Docker images become very large (>1GB)
- Build time: 15-20 minutes

### **Problem 3: IAM Permissions**
- EC2 role (`SSM-EC2`) lacks ECR permissions:
  - `ecr:GetAuthorizationToken` - denied
  - `lambda:GetLayerVersion` - denied for external layers

### **Problem 4: Resource Constraints**
- Initial EC2 had only 4.8GB disk (now upgraded to 50GB)
- Docker build requires significant space
- Build tools installation adds 500MB+ overhead

---

## 💻 ENVIRONMENT DETAILS

### AWS Account:
- **Account ID:** 137288645009
- **Region:** eu-west-1 (Ireland)
- **IAM Role:** PDFMasterTool-Lambda-Role

### EC2 Instance:
- **IP:** 34.241.164.163
- **OS:** Ubuntu 24.04 (Amazon Linux compatible)
- **Storage:** 50GB
- **Docker:** Installed and running
- **AWS CLI:** v2.31.23
- **IAM Role:** SSM-EC2 (limited permissions)

### Lambda Functions:
- **Runtime:** nodejs20.x
- **Timeout:** 120 seconds
- **Memory:** 2048MB
- **Architecture:** x86_64
- **Deployment:** Currently ZIP-based with mock handlers

---

## 🎯 WHAT WE NEED

### **Working Solution That:**
1. ✅ Runs LibreOffice in AWS Lambda
2. ✅ Works with existing Function URLs (no redeployment)
3. ✅ Is 100% FREE (no paid APIs)
4. ✅ Can be deployed from EC2 or CloudShell
5. ✅ Handles PDF/Word/Excel/PPT conversions
6. ✅ Production-ready and reliable

### **Acceptable Solutions:**
- Docker Lambda with LibreOffice (if build issues can be fixed)
- Custom Lambda Layer with LibreOffice binaries
- Alternative free document conversion library for Node.js
- Client-side conversion (JavaScript libraries in browser)

### **NOT Acceptable:**
- Paid APIs (CloudConvert, etc.)
- Expensive infrastructure changes
- Solutions requiring complex AWS permissions we don't have

---

## 📝 SPECIFIC QUESTIONS FOR CHATGPT

1. **How to successfully build a Docker Lambda image with LibreOffice?**
   - What base image to use?
   - How to handle `aws-lambda-ric` build dependencies?
   - Minimal Dockerfile that actually works?

2. **Is there a working public Lambda Layer with LibreOffice?**
   - That doesn't require external permissions
   - Compatible with eu-west-1 region
   - For Node.js 20 runtime

3. **Alternative FREE solutions?**
   - Pure JavaScript libraries for document conversion?
   - Pre-compiled LibreOffice binaries for Lambda?
   - Other open-source conversion tools?

4. **If Docker is the only way:**
   - Step-by-step Dockerfile that builds successfully
   - How to minimize image size?
   - How to reduce build time?

---

## 🔍 ADDITIONAL CONTEXT

- We've been trying for 2 days to get this working
- Multiple Docker build attempts all failed at different stages
- EC2 has limited IAM permissions (can't easily add more)
- CloudShell is available as alternative deployment method
- Frontend is ready and waiting for working backend
- User prefers simple, straightforward solution

---

## ✅ SUCCESS CRITERIA

A solution is successful when:
1. Lambda function receives PDF file (base64)
2. Converts it to Word/Excel/PPT using LibreOffice
3. Returns converted file (base64)
4. No "Conversion failed" errors
5. Works reliably in production
6. Costs $0 (free tier usage only)

---

**Please provide a working solution that addresses these specific Docker/LibreOffice issues in AWS Lambda environment.**



