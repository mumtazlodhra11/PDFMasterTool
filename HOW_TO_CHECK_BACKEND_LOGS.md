# How to Check Backend Logs for Excel-to-PDF

## Method 1: Google Cloud Console (Easiest)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Make sure you're logged in with the correct Google account

2. **Navigate to Cloud Run:**
   - In the left sidebar, go to **"Cloud Run"** (under "Serverless")
   - Or search for "Cloud Run" in the top search bar

3. **Select Your Service:**
   - Find your Python backend service: `pdf-converter-python` or similar
   - Click on the service name

4. **View Logs:**
   - Click on the **"LOGS"** tab at the top
   - You'll see real-time logs from your backend
   - Look for messages starting with `[XLSX->PDF]`

5. **Filter Logs:**
   - In the search box, type: `XLSX->PDF` or `excel-to-pdf`
   - This will filter to show only Excel-to-PDF conversion logs

## Method 2: Google Cloud CLI (Command Line)

If you have `gcloud` CLI installed:

```bash
# List your Cloud Run services
gcloud run services list

# View logs for Python backend
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pdf-converter-python" --limit 50 --format json

# View logs with filter for Excel-to-PDF
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pdf-converter-python AND textPayload=~'XLSX->PDF'" --limit 50
```

## Method 3: Direct URL (Quick Access)

1. **Get your service URL from the logs:**
   - From your console logs: `https://pdf-converter-python-my7a6p7ima-uc.a.run.app`
   - Extract the service name: `pdf-converter-python`

2. **Go directly to logs:**
   ```
   https://console.cloud.google.com/run/detail/us-central1/pdf-converter-python/logs
   ```
   (Replace `pdf-converter-python` with your actual service name)

## What to Look For

When you convert an Excel file, you should see these log messages:

✅ **Good Signs (Modifications are being applied):**
```
[XLSX->PDF] 🔧 Modifying Excel print settings to PREVENT CHART SPLITTING...
[XLSX->PDF] Processing sheet: Sheet1
[XLSX->PDF] ✅✅✅ AGGRESSIVE: fitToWidth=1, fitToHeight=999, fitToPage=True...
[XLSX->PDF] ✅✅✅ Removed ALL page breaks...
[XLSX->PDF] ✅✅✅ FORCED: Landscape orientation...
[XLSX->PDF] ✅✅✅ FORCED: Minimal margins (0.3")...
[XLSX->PDF] ✅ Excel file modified and saved with anti-split settings
[XLSX->PDF] ✅✅✅ FORCED: Landscape mode for chart preservation...
```

❌ **Bad Signs (Modifications NOT being applied):**
- No `[XLSX->PDF]` messages at all
- Error messages about `openpyxl` or `load_workbook`
- Messages saying "Could not modify print settings"

## Quick Test

1. **Open Cloud Run logs** (Method 1 above)
2. **Convert an Excel file** from your frontend
3. **Watch the logs in real-time** - you should see the `[XLSX->PDF]` messages appear

## If You Don't See the Logs

1. **Check the service name:**
   - Make sure you're looking at the **Python backend** service
   - Not the Node.js backend service

2. **Check the time range:**
   - Make sure logs are set to show "Last 1 hour" or "Last 24 hours"
   - Recent logs might not show immediately

3. **Check permissions:**
   - Make sure you have "Viewer" or "Editor" permissions on the Cloud Run service

## Screenshot Locations

The logs will show:
- **Timestamp** - When the conversion happened
- **Severity** - Usually "INFO" for our messages
- **Text** - The actual log message with `[XLSX->PDF]` prefix

---

**Once you check the logs, share what you see and we can determine if:**
1. ✅ Excel file modifications ARE being applied (but LibreOffice still splits charts)
2. ❌ Excel file modifications are NOT being applied (need to fix the code)

