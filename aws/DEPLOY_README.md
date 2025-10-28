# 🚀 Backend Deployment Options

Choose the deployment method that works best for you!

---

## ✅ Option 1: Deploy from EC2 (Recommended)

**Best for:** Direct deployment with full control

### Steps:

```bash
# 1. SSH into your EC2 instance
ssh ec2-user@YOUR_EC2_IP

# 2. Clone or upload project
git clone https://github.com/YOUR_REPO/PDFMasterTool.git
cd PDFMasterTool/aws

# 3. Run deployment script
chmod +x ec2-deploy-lambda.sh
./ec2-deploy-lambda.sh

# 4. Done! ✅
```

**Time:** 5-10 minutes  
**Difficulty:** Easy  
**Documentation:** `EC2_DEPLOYMENT_GUIDE.md`

---

## 🪟 Option 2: Deploy from Windows via EC2

**Best for:** Windows users who want to deploy remotely

### Steps:

```powershell
# From Windows PowerShell in project directory
cd D:\PDFMasterTool\aws

# Run deployment script
.\deploy-from-windows.ps1 -EC2_HOST "YOUR_EC2_IP" -EC2_USER "ec2-user"

# If using SSH key file
.\deploy-from-windows.ps1 -EC2_HOST "YOUR_EC2_IP" -SSH_KEY "C:\path\to\key.pem"

# Done! ✅
```

**Time:** 5-10 minutes  
**Difficulty:** Easy  
**Documentation:** `EC2_DEPLOYMENT_GUIDE.md`

---

## 🖱️ Option 3: Manual Console Deployment

**Best for:** AWS Console users, learning AWS

### Steps:

1. Open AWS Lambda Console
2. Create 5 functions manually
3. Upload ZIP files
4. Configure memory & timeout
5. Enable Function URLs
6. Copy URLs to .env

**Time:** 20-30 minutes  
**Difficulty:** Medium  
**Documentation:** `QUICK_DEPLOY.md`

---

## 📦 Option 4: SAM Deployment

**Best for:** Infrastructure as Code, CI/CD

### Steps:

```bash
# Install AWS SAM CLI
# Then deploy
cd aws
sam build
sam deploy --guided
```

**Time:** 15-20 minutes  
**Difficulty:** Medium  
**Documentation:** AWS SAM docs

---

## 🎯 Quick Comparison

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| **EC2 Script** | 5-10 min | ⭐ Easy | Quick deployment |
| **Windows → EC2** | 5-10 min | ⭐ Easy | Remote deployment |
| **Manual Console** | 20-30 min | ⭐⭐ Medium | Learning AWS |
| **SAM/Terraform** | 15-20 min | ⭐⭐⭐ Hard | Production/CI/CD |

---

## 📋 Prerequisites

### All Methods Need:
- ✅ AWS Account
- ✅ AWS Access Keys configured
- ✅ Lambda ZIP files ready

### EC2 Method Needs:
- ✅ EC2 instance running
- ✅ AWS CLI on EC2
- ✅ SSH access

### Windows Method Needs:
- ✅ EC2 instance running
- ✅ OpenSSH installed on Windows
- ✅ SSH key or password

---

## 🚀 Recommended Workflow

### For First-Time Users:
1. Use **EC2 Script** method (Option 1)
2. Learn AWS Console later
3. Move to SAM/Terraform for production

### For Production:
1. Use **SAM/Terraform** (Option 4)
2. Set up CI/CD pipeline
3. Automate deployments

---

## 🆘 Need Help?

### Can't SSH to EC2?
- Check EC2 security group allows port 22
- Verify SSH key permissions: `chmod 400 key.pem`
- Try EC2 Instance Connect from AWS Console

### AWS CLI Not Working?
```bash
# Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region, Format
```

### Deployment Failed?
1. Check CloudWatch Logs
2. Verify IAM role has permissions
3. Increase Lambda timeout/memory
4. Check CORS settings

---

## 📁 Files Overview

```
aws/
├── ec2-deploy-lambda.sh        # Linux deployment script ⭐
├── deploy-from-windows.ps1     # Windows → EC2 script ⭐
├── EC2_DEPLOYMENT_GUIDE.md     # Detailed EC2 guide ⭐
├── QUICK_DEPLOY.md             # Manual console guide
├── DEPLOY_README.md            # This file
├── template.yaml               # SAM template
└── lambda/
    ├── word-to-pdf.zip         # Ready to deploy ✅
    ├── ppt-to-pdf.zip          # Ready to deploy ✅
    ├── pdf-to-word.zip         # Ready to deploy ✅
    ├── pdf-to-excel.zip        # Ready to deploy ✅
    └── pdf-to-ppt.zip          # Ready to deploy ✅
```

---

## ✅ Success Criteria

Deployment is successful when:
- ✅ All 5 Lambda functions created
- ✅ All functions have public URLs
- ✅ .env file has all URLs
- ✅ Test curl returns 200 OK
- ✅ Frontend can call Lambda functions

---

## 🎉 Next Steps After Deployment

1. **Test Locally:**
   ```bash
   npm run dev
   # Visit: http://localhost:9001/tools/word-to-pdf
   ```

2. **Deploy Frontend:**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Monitor:**
   - Check CloudWatch Logs
   - Set up alarms
   - Monitor costs

4. **Optimize:**
   - Add caching
   - Optimize Lambda memory
   - Enable X-Ray tracing

---

## 💰 Cost Estimate

**Free Tier (First Year):**
- 1M Lambda requests/month: FREE
- EC2 t3.micro: FREE (750 hours/month)

**After Free Tier:**
- 10K requests/month: ~$2
- 100K requests/month: ~$15
- 1M requests/month: ~$120

**EC2 Costs:**
- t3.micro: $7.50/month (or stop when not using)
- t3.small: $15/month

---

## 🔥 Pro Tips

1. **Tag Everything:** Add `Project: PDFMasterTool` tag
2. **Use One Region:** Keep all resources in same region
3. **Enable Monitoring:** CloudWatch + X-Ray
4. **Set Budget Alerts:** Get notified at $10, $50, $100
5. **Backup .env:** Don't commit to Git!
6. **Use Secrets Manager:** For production credentials
7. **Enable Versioning:** Lambda function versions
8. **Create Aliases:** prod, staging, dev

---

## 📞 Support

**Issues?** Check:
- CloudWatch Logs for Lambda errors
- EC2 System Logs for instance issues
- AWS Support (if critical)

**Questions?** Read:
- `EC2_DEPLOYMENT_GUIDE.md` for EC2 details
- `QUICK_DEPLOY.md` for console deployment
- `LAMBDA_FIXES_COMPLETE.md` for Lambda architecture

---

**Ready to deploy? Chalo shuru karte hain! 🚀**

Choose your method above and follow the guide!

