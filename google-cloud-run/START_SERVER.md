# 🚀 Local Server Start Guide

## Quick Start

### Option 1: Simple Start (Recommended)
```powershell
cd google-cloud-run
python app.py
```

Server will start on: **http://localhost:9001**

### Option 2: Using Script
```powershell
cd google-cloud-run
.\run_local.ps1
```

## Verify Server is Running

Open browser and go to:
- **Health Check**: http://localhost:9001/health
- Should show: `{"status":"ok"}`

Or test in PowerShell:
```powershell
curl http://localhost:8080/health
```

## Test Excel to PDF

Once server is running, open a **NEW terminal** and run:

```powershell
cd google-cloud-run
python test_local.py sample.xlsx
```

Or use the PowerShell script:
```powershell
.\test_local.ps1 -ExcelFile "sample.xlsx"
```

## Troubleshooting

### Port 9001 already in use?
```powershell
# Find what's using port 9001
netstat -ano | findstr :9001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Server not starting?
1. Check Python is installed: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check for errors in terminal

### LibreOffice not found?
- Install from: https://www.libreoffice.org/download/
- Add to PATH: `C:\Program Files\LibreOffice\program`

## Stop Server

Press `Ctrl+C` in the terminal where server is running

