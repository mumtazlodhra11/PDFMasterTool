# 🚀 DEPLOY NOW - Complete Commands

Copy-paste these commands directly into your EC2 terminal!

---

## 📋 **Before Starting:**

```
✅ EC2 IP: _______________
✅ SSH Key: _______________
✅ AWS Access Key: _______________
✅ AWS Secret Key: _______________
```

---

## 🔥 **ONE-COMMAND DEPLOYMENT**

### **Step 1: Connect to EC2**

```bash
# Replace with your details:
ssh -i "YOUR_KEY.pem" ec2-user@YOUR_EC2_IP
```

### **Step 2: Copy-Paste This Complete Block**

```bash
# ============================================
# COMPLETE DEPLOYMENT - COPY ALL OF THIS
# ============================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting PDFMasterTool Lambda Deployment...${NC}"
echo ""

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo -e "${BLUE}📦 Installing AWS CLI...${NC}"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
fi

# Check if PDFMasterTool exists
if [ ! -d "PDFMasterTool" ]; then
    echo -e "${BLUE}📥 Project not found. Please upload or clone first.${NC}"
    echo ""
    echo "Option 1 - Clone from Git:"
    echo "  git clone YOUR_GITHUB_REPO_URL PDFMasterTool"
    echo ""
    echo "Option 2 - Upload from Windows:"
    echo "  scp -r D:\PDFMasterTool\aws ec2-user@YOUR_EC2_IP:~/"
    echo ""
    exit 1
fi

# Navigate to project
cd ~/PDFMasterTool/aws

# Check AWS credentials
echo -e "${BLUE}🔑 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo ""
    echo "Run: aws configure"
    echo "Then re-run this script"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo ""

# Make script executable
chmod +x ec2-deploy-lambda.sh

# Run deployment
echo -e "${BLUE}🚀 Starting Lambda deployment...${NC}"
echo ""
./ec2-deploy-lambda.sh

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 DEPLOYMENT SUCCESSFUL! 🎉        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "1. View .env file: cat ~/PDFMasterTool/.env"
    echo "2. Copy .env to Windows: scp ec2-user@YOUR_EC2_IP:~/PDFMasterTool/.env D:\PDFMasterTool\"
    echo "3. Test locally: npm run dev"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check error messages above"
fi
```

---

## ⚡ **Even Faster - All-in-One Script**

Copy this single block and paste in EC2:

```bash
cd ~ && \
if ! command -v aws &> /dev/null; then curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip -q awscliv2.zip && sudo ./aws/install && rm -rf aws awscliv2.zip; fi && \
cd ~/PDFMasterTool/aws && \
chmod +x ec2-deploy-lambda.sh && \
./ec2-deploy-lambda.sh
```

---

## 🔐 **Configure AWS (First Time Only)**

If AWS credentials not configured:

```bash
aws configure
```

Enter:
```
AWS Access Key ID: [paste your key]
AWS Secret Access Key: [paste your secret]
Default region name: us-east-1
Default output format: json
```

---

## 📥 **Upload Project to EC2 (If Not Already)**

### **Method 1: Git Clone**

```bash
# On EC2
cd ~
git clone https://github.com/YOUR_USERNAME/PDFMasterTool.git
```

### **Method 2: SCP from Windows**

```powershell
# From Windows PowerShell
scp -i "your-key.pem" -r D:\PDFMasterTool\aws ec2-user@YOUR_EC2_IP:~/PDFMasterTool/
```

---

## ✅ **Verify Deployment**

```bash
# Check if functions were created
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `pdfmastertool`)].FunctionName'

# View .env file
cat ~/PDFMasterTool/.env

# Test functions
cd ~/PDFMasterTool/aws
./test-lambda-functions.sh
```

---

## 📥 **Download .env to Windows**

```powershell
# From Windows
scp -i "your-key.pem" ec2-user@YOUR_EC2_IP:~/PDFMasterTool/.env D:\PDFMasterTool\
```

---

## 🎉 **Done!**

After deployment:
1. ✅ Lambda functions deployed
2. ✅ .env file created
3. ✅ Ready to test locally!

```bash
# On Windows
cd D:\PDFMasterTool
npm run dev
```

Visit: http://localhost:9001/tools/word-to-pdf

**Upload a file and test! 🚀**

