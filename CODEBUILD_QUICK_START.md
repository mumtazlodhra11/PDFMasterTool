# 🚀 CodeBuild Quick Start - Final Steps

## ✅ What's Done:
- ✅ ECR repositories created (5/5)
- ✅ buildspec.yml created
- ✅ Dockerfiles ready with LibreOffice

## 📋 Next Steps (20 minutes):

### Step 1: Upload Source to S3 (5 min)

```powershell
# Create S3 bucket (if doesn't exist)
aws s3 mb s3://pdfmastertool-builds --region eu-west-1

# Upload source code
cd D:\PDFMasterTool\aws
aws s3 cp lambda-containers.zip s3://pdfmastertool-builds/source/lambda-containers.zip
```

### Step 2: Create CodeBuild Project (10 min)

**Go to AWS Console:**
```
https://eu-west-1.console.aws.amazon.com/codesuite/codebuild/home?region=eu-west-1
```

**Click "Create build project"**

**Fill these values:**

1. **Project name:** `pdfmaster-lambda-build`

2. **Source:**
   - Source provider: **AWS S3**
   - Bucket: `pdfmastertool-builds`
   - S3 object key: `source/lambda-containers.zip`

3. **Environment:**
   - Operating system: **Amazon Linux 2**
   - Runtime: **Standard**
   - Image: **aws/codebuild/amazonlinux2-x86_64-standard:5.0**
   - ✅ **Privileged** (MUST CHECK THIS!)

4. **Buildspec:**
   - Buildspec name: `buildspec.yml`
   - (File is in: `aws/lambda-containers/buildspec.yml`)

5. Click **"Create build project"**

### Step 3: Start Build (30-40 min automated)

1. Select project: `pdfmaster-lambda-build`
2. Click **"Start build"**
3. Watch progress (30-40 minutes)
4. **Build happens automatically - grab coffee! ☕**

### Step 4: Create Lambda Functions (15 min)

After build completes, create Lambda functions:

**Full guide:** See `CODEBUILD_SETUP_GUIDE.md` Step 6

### Step 5: Update .env & Test

Copy Function URLs to `.env` file and test!

---

## ⏱️ Total Time:

| Step | Time | Manual/Auto |
|------|------|-------------|
| Upload to S3 | 5 min | Manual |
| Create CodeBuild | 10 min | Manual |
| **Build (CodeBuild)** | **30-40 min** | **AUTO** ✅ |
| Create Lambda | 15 min | Manual |
| Update .env | 2 min | Manual |
| **TOTAL** | **~65 min** | |

**Most time is automated!** You just wait for build to complete.

---

## 📝 Quick Checklist:

- [ ] S3 bucket created
- [ ] Source code uploaded to S3
- [ ] CodeBuild project created
- [ ] Build started (running now...)
- [ ] Build completed ✅
- [ ] Images visible in ECR ✅
- [ ] Lambda functions created
- [ ] Function URLs copied to .env
- [ ] Test successful!

---

**Ready to continue? Let me know when you've created the CodeBuild project!**














