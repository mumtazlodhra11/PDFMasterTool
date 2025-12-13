# Local Testing Guide

## 🧪 Test Excel to PDF Conversion Locally

### Prerequisites

1. **Python 3.8+** - Already installed ✅
2. **LibreOffice** - Required for Excel to PDF conversion
   - Download: https://www.libreoffice.org/download/
   - Install and add to PATH

### Step 1: Start Local Server

```powershell
cd google-cloud-run
.\run_local.ps1
```

Server will start on: `http://localhost:8080`

### Step 2: Test Excel to PDF (in a NEW terminal)

```powershell
cd google-cloud-run
.\test_local.ps1 -ExcelFile "sample.xlsx"
```

Or test with your own file:
```powershell
.\test_local.ps1 -ExcelFile "path/to/your/file.xlsx"
```

### Step 3: Check Results

- PDF will be saved as: `filename_converted.pdf`
- Open the PDF and verify:
  - ✅ Charts are not split
  - ✅ Charts render properly
  - ✅ Landscape orientation (if charts detected)
  - ✅ Good quality

### Manual Testing with Python

```powershell
cd google-cloud-run
python test_local.py sample.xlsx
```

### Test with Chart Split Prevention

The test script automatically uses:
- `prevent_chart_split=true`
- `scale_charts_to_fit=true`
- `fit_to_page=true`
- `print_quality=high`
- `orientation=landscape` (auto-detected if charts present)

### Troubleshooting

**Server won't start:**
- Check if port 8080 is free
- Install dependencies: `pip install -r requirements.txt`

**LibreOffice not found:**
- Install LibreOffice
- Add to PATH: `C:\Program Files\LibreOffice\program`

**Conversion fails:**
- Check LibreOffice is installed
- Check file is valid Excel (.xlsx or .xls)
- Check server logs for errors

### Fix Issues Before Deploying

1. Test locally with your Excel file
2. Verify charts render correctly
3. Fix any issues in `app.py`
4. Test again
5. Only then deploy to Cloud Run


