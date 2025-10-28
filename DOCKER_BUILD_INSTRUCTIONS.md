# 🐳 Docker Build Instructions - Step by Step

## ⚠️ Docker Desktop Not Running

**Error:** `docker daemon is not running`

---

## ✅ Step 1: Start Docker Desktop (2 minutes)

### Option A: Start from Start Menu
```
1. Press Windows key
2. Type "Docker Desktop"
3. Click to open
4. Wait for Docker to fully start (whale icon in system tray)
```

### Option B: Start from Desktop
```
1. Double-click Docker Desktop icon
2. Wait 30-60 seconds for startup
3. Look for whale icon in system tray (bottom right)
4. Icon should NOT be red/yellow (should be white/blue)
```

**Docker ready when:**
- ✅ Whale icon visible in system tray
- ✅ Icon is NOT animating
- ✅ Right-click icon shows "Docker Desktop is running"

---

## ✅ Step 2: Verify Docker (1 minute)

After Docker Desktop starts, run:

```bash
docker --version
docker ps
```

Should see:
```
Docker version 25.0.3
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

---

## ✅ Step 3: Build Lambda Containers (40 minutes)

Once Docker is running:

### Automated Build (Recommended)
```bash
cd D:\PDFMasterTool\aws\lambda-containers
.\build-and-deploy-all.bat
```

This will automatically:
1. Login to AWS ECR ✅
2. Create ECR repositories ✅
3. Build 5 Docker images (30-40 min) 🕐
4. Push images to ECR ✅
5. Update Lambda functions ✅

---

## ⏱️ Expected Build Times

```
┌────────────────────┬─────────────┐
│ Container          │ Build Time  │
├────────────────────┼─────────────┤
│ pdf-to-word        │ ~8 minutes  │
│ word-to-pdf        │ ~8 minutes  │
│ pdf-to-excel       │ ~8 minutes  │
│ pdf-to-ppt         │ ~8 minutes  │
│ ppt-to-pdf         │ ~8 minutes  │
├────────────────────┼─────────────┤
│ **TOTAL**          │ **40 min**  │
└────────────────────┴─────────────┘
```

**Why so long?**
- LibreOffice download: ~200MB
- Installation: Multiple RPM packages
- First build is slow, updates are fast

---

## 📊 Build Progress

You'll see:

```
Step 1/7 : FROM public.ecr.aws/lambda/nodejs:20
 ---> Pulling from lambda/nodejs
 ---> 12345abcde

Step 2/7 : RUN yum install -y wget tar...
 ---> Running in container123
 ---> Installing packages...

Step 3/7 : RUN cd /tmp && wget LibreOffice...
 ---> Downloading LibreOffice (THIS IS SLOW - BE PATIENT!)
 ---> Installing LibreOffice...

... continues ...
```

**Don't close the terminal!** Let it run.

---

## 🚨 Common Issues

### Issue 1: Docker Not Starting
```
Error: Cannot connect to Docker daemon

Solution:
1. Restart Docker Desktop
2. Wait 2 minutes
3. Try again
```

### Issue 2: Build Fails with "No space"
```
Error: No space left on device

Solution:
1. Open Docker Desktop
2. Settings → Resources → Disk image size
3. Increase to 60GB+
4. Apply & Restart
```

### Issue 3: LibreOffice Download Fails
```
Error: wget: unable to resolve host

Solution:
- Check internet connection
- Try again (temporary network issue)
```

---

## 🎯 After Build Completes

### Test Functions

```bash
# Test PDF to Word
curl -X POST "https://YOUR-LAMBDA-URL/" \
  -H "Content-Type: application/json" \
  -d '{"fileContent":"JVBERi0...", "fileName":"test.pdf"}'
```

Or test in browser:
```
http://localhost:9001/tools/pdf-to-word
http://localhost:9001/tools/word-to-pdf
http://localhost:9001/tools/pdf-to-excel
```

---

## 💰 Final Cost

After this ONE-TIME build:

```
Monthly AWS Cost: $3-5
Annual Cost: $36-60

vs CloudConvert: $360/year

Savings: $300-324/year! 💚
```

---

## 🚀 Quick Start (After Docker Starts)

```bash
# 1. Start Docker Desktop (manually)
# 2. Wait for whale icon in system tray
# 3. Run this:

cd D:\PDFMasterTool\aws\lambda-containers
.\build-and-deploy-all.bat

# 4. Wait 40 minutes (go get coffee! ☕)
# 5. Test at http://localhost:9001
```

---

## 📋 Checklist

- [ ] Docker Desktop installed
- [ ] Docker Desktop running (whale icon visible)
- [ ] AWS CLI configured
- [ ] In correct directory (`aws/lambda-containers`)
- [ ] Run `build-and-deploy-all.bat`
- [ ] Wait 40 minutes ⏳
- [ ] Test tools

---

## ❓ Need Help?

If stuck:
1. Check Docker is running (whale icon)
2. Check AWS CLI works: `aws sts get-caller-identity`
3. Check directory: `cd D:\PDFMasterTool\aws\lambda-containers`
4. Read error messages carefully
5. Restart Docker Desktop if needed

---

## 🎉 Success Looks Like

```
[Step 4/4] Updating Lambda functions...
{
    "FunctionName": "pdfmastertool-pdf-to-word",
    "LastUpdateStatus": "Successful",
    ...
}

============================================
Done! All Lambda functions updated!
============================================

Test at: http://localhost:9001/tools/pdf-to-word
```

---

**Ready? Start Docker Desktop now!** 🐳









