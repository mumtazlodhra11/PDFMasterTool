# 🐳 Build & Deploy Lambda Containers (FREE Solution)

## 🎯 Why Containers?

**Benefits:**
- ✅ **100% FREE** (no API charges, only AWS Lambda costs)
- ✅ LibreOffice included
- ✅ No layer permission issues
- ✅ Full control over environment
- ✅ Cost: ~$2-5/month (AWS Lambda only)

---

## 📋 Prerequisites

```bash
# 1. Docker Desktop installed
# Download from: https://www.docker.com/products/docker-desktop/

# 2. AWS CLI configured
aws configure
# Enter your credentials

# 3. Login to AWS ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 137288645009.dkr.ecr.eu-west-1.amazonaws.com
```

---

## 🚀 Step 1: Create ECR Repositories (One Time)

```bash
cd D:\PDFMasterTool\aws\lambda-containers

# Create ECR repositories for each function
aws ecr create-repository --repository-name pdfmastertool-pdf-to-word --region eu-west-1
aws ecr create-repository --repository-name pdfmastertool-word-to-pdf --region eu-west-1
aws ecr create-repository --repository-name pdfmastertool-pdf-to-excel --region eu-west-1
aws ecr create-repository --repository-name pdfmastertool-pdf-to-ppt --region eu-west-1
aws ecr create-repository --repository-name pdfmastertool-ppt-to-pdf --region eu-west-1
```

---

## 🏗️ Step 2: Build Docker Images

```bash
# Build PDF to Word
cd pdf-to-word
docker build -t pdfmastertool-pdf-to-word:latest .

# Build Word to PDF
cd ../word-to-pdf
docker build -t pdfmastertool-word-to-pdf:latest .

# Build PDF to Excel
cd ../pdf-to-excel
docker build -t pdfmastertool-pdf-to-excel:latest .

# Build PDF to PPT
cd ../pdf-to-ppt
docker build -t pdfmastertool-pdf-to-ppt:latest .

# Build PPT to PDF
cd ../ppt-to-pdf
docker build -t pdfmastertool-ppt-to-pdf:latest .
```

**Note:** Each build takes 5-10 minutes (LibreOffice installation)

---

## 📤 Step 3: Push to ECR

```bash
# Tag and push PDF to Word
docker tag pdfmastertool-pdf-to-word:latest 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-pdf-to-word:latest
docker push 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-pdf-to-word:latest

# Tag and push Word to PDF
docker tag pdfmastertool-word-to-pdf:latest 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-word-to-pdf:latest
docker push 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-word-to-pdf:latest

# Repeat for other 3 functions...
```

---

## 🔄 Step 4: Update Lambda Functions

```bash
# Update PDF to Word function to use container
aws lambda update-function-code \
  --function-name pdfmastertool-pdf-to-word \
  --image-uri 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-pdf-to-word:latest \
  --region eu-west-1

# Update Word to PDF
aws lambda update-function-code \
  --function-name pdfmastertool-word-to-pdf \
  --image-uri 137288645009.dkr.ecr.eu-west-1.amazonaws.com/pdfmastertool-word-to-pdf:latest \
  --region eu-west-1

# Repeat for other functions...
```

---

## 💰 Cost Breakdown (FREE vs Paid)

### Option 1: CloudConvert (Paid)
```
100 conversions/day:
- Free tier: 25/day
- Paid: 75/day × 30 days = 2,250/month
- Cost: ~$30/month 💸
━━━━━━━━━━━━━━━━━━━━
Annual: $360/year
```

### Option 2: Lambda Containers (FREE)
```
100 conversions/day:
- Lambda invocations: 3,000/month = $0.60
- Compute time: ~$2-3/month
- Storage: ~$1/month
━━━━━━━━━━━━━━━━━━━━
Total: ~$3-5/month 💚
Annual: $36-60/year
```

**Savings: $300-324/year!** 🎉

---

## ⚡ Quick Deploy Script

```bash
# Run automated build and deploy
cd D:\PDFMasterTool\aws\lambda-containers
.\build-and-deploy-all.bat
```

This will:
1. Build all 5 Docker images
2. Push to ECR
3. Update Lambda functions
4. Test functions

**Time:** 30-45 minutes (first time, mostly LibreOffice download)

---

## 🧪 Test After Deployment

```bash
# Test PDF to Word
curl -X POST "https://YOUR-LAMBDA-URL/" \
  -H "Content-Type: application/json" \
  -d '{"fileContent":"base64-content-here","fileName":"test.pdf"}'
```

Or test in browser:
```
http://localhost:9001/tools/pdf-to-word
```

---

## 📊 Comparison Table

| Feature | CloudConvert | Lambda Container |
|---------|--------------|------------------|
| **Setup Time** | 30 min | 1-2 hours |
| **Monthly Cost** | $30 | $3-5 |
| **Annual Cost** | $360 | $36-60 |
| **Free Tier** | 25/day | Unlimited |
| **Maintenance** | Zero | Low |
| **Quality** | Excellent | Excellent |
| **Control** | No | Full |

---

## 🎯 My Recommendation

### For Your Use Case: Lambda Containers ✅

**Why?**
1. **ONE-TIME** 2-hour setup
2. **FREE** forever (only $3-5/month AWS costs)
3. No recurring charges
4. Full control
5. Unlimited conversions

**When to Use CloudConvert:**
- Need to launch in next 1 hour
- Don't have Docker installed
- Don't want any technical work

---

## 🚀 Ready to Build?

**Option A: Lambda Containers (Recommended)** ⭐
```
Time: 1-2 hours (one time)
Cost: $3-5/month forever
Savings: $300+/year

Steps:
1. Install Docker Desktop (10 min)
2. Build images (30 min)
3. Push to ECR (15 min)
4. Update Lambda (5 min)
━━━━━━━━━━━━━━━━━
Total: 60 minutes ✅
```

**Option B: CloudConvert API**
```
Time: 30 minutes
Cost: $30/month = $360/year
```

---

**Kya karna hai?**

1. **FREE solution** build karein? (1-2 hours, one time) ⭐
2. **Paid API** use karein? ($30/month)
3. **Skip** Lambda tools for now?

Batao! Main FREE solution recommend karta hoon! 🚀💚











