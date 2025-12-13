# 🚀 Start Dev Server - Quick Guide

## ✅ Correct Port

**Dev server runs on port 9001, NOT 4321!**

---

## 🎯 Quick Start

### Option 1: Start in Current Terminal
```bash
npm run dev
```

**Wait for this message:**
```
  Local:   http://localhost:9001/
```

**Then open in browser:**
```
http://localhost:9001
```

---

### Option 2: Start in New Terminal Window (Windows)
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
```

---

## 🔍 Verify Server is Running

### Check Port:
```powershell
# PowerShell
Get-NetTCPConnection -LocalPort 9001
```

If you see output, server is running! ✅

### Test URL:
Open in browser:
```
http://localhost:9001
```

Or test with curl:
```bash
curl http://localhost:9001
```

---

## ❌ Common Issues

### Issue 1: "Port 9001 already in use"
**Solution:**
```powershell
# Find process using port 9001
netstat -ano | findstr :9001

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Then restart:
npm run dev
```

### Issue 2: "Can't reach this page"
**Check:**
1. ✅ Is dev server running? (Look at terminal)
2. ✅ Are you using correct port? (`http://localhost:9001`)
3. ✅ Check firewall settings
4. ✅ Try: `http://127.0.0.1:9001`

### Issue 3: Dev server starts but page won't load
**Solution:**
1. Check browser console (F12)
2. Clear browser cache (Ctrl+Shift+R)
3. Try incognito mode
4. Check if Node.js version is correct: `node --version` (should be >=20)

---

## 📋 Configuration

### Port Settings:
- **Dev server:** Port 9001 (configured in `package.json` and `astro.config.mjs`)
- **Can be changed:** Edit `package.json` → `"dev": "astro dev --port YOUR_PORT"`

### Default URLs:
- Local: `http://localhost:9001`
- Network: `http://YOUR_IP:9001` (if `host: true` in config)

---

## 🧪 Test After Starting

1. **Open browser:**
   ```
   http://localhost:9001
   ```

2. **You should see:**
   - PDF Master Tool homepage
   - All tools visible
   - No errors in browser console (F12)

3. **Test conversion:**
   - Click any conversion tool (e.g., Word to PDF)
   - Upload a test file
   - Should work with Cloud Run backend!

---

## 🎉 Success!

If you see the homepage, dev server is working! ✅

**Next:** Test the 5 conversion tools:
- Word to PDF
- PDF to Word
- PDF to Excel
- PDF to PowerPoint
- PowerPoint to PDF

All tools should work with your Cloud Run backend! 🚀














