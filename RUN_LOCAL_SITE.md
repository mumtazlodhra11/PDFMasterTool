# 🚀 Local Site (Frontend) Run Karne Ke Liye

## Step 1: Backend Server Start Karein (Port 9001)
**Terminal 1:**
```powershell
cd D:\PDFMasterTool\google-cloud-run
.\venv\Scripts\Activate.ps1
python app.py
```

Wait for: `Uvicorn running on http://0.0.0.0:9001`

## Step 2: Frontend Dev Server Start Karein (Port 4321)
**Terminal 2 (NEW):**
```powershell
cd D:\PDFMasterTool
npm run dev
```

Wait for: `Local: http://localhost:4321`

## Step 3: Browser Mein Open Karein
- Frontend: http://localhost:4321
- Excel to PDF tool: http://localhost:4321/tools/excel-to-pdf

## Step 4: Test Karein
1. Excel file upload karein (with charts)
2. Convert button click karein
3. PDF download karein
4. Charts check karein - properly render ho rahe hain?

## Important:
- Backend (port 9001) pehle start karein
- Frontend (port 4321) phir start karein
- Dono terminals open rakhna hoga

## .env.local File:
`.env.local` file mein local backend URL set hai:
```
PUBLIC_CLOUD_RUN_URL=http://localhost:9001
```

## Troubleshooting:
- Agar "can't reach" error aaye → Backend check karein (port 9001)
- Agar conversion fail ho → LibreOffice install karein
- Agar CORS error aaye → Backend restart karein


