# Unified File Converter Backend

Minimal Express API intended for Google Cloud Run deployment. Exposes a single `/convert/*` namespace for Word/PDF/PPT/Excel conversions and defaults to JSON responses.  
The service shells out to **LibreOffice** (headless mode) to perform the actual file conversions.

## Endpoints

All routes expect a `multipart/form-data` payload with a single `file` field:

- `POST /convert/word-to-pdf`
- `POST /convert/pdf-to-word`
- `POST /convert/ppt-to-pdf`
- `POST /convert/pdf-to-ppt`
- `POST /convert/excel-to-pdf`
- `POST /convert/pdf-to-excel`

`GET /health` returns a simple JSON status response.

## Configuration

Set the following environment variables (use `.env.local` for local dev or Cloud Run service variables in production):

```
CORS_ORIGINS=https://your-s3-app.example.com,https://another-domain.com
MAX_FILE_SIZE=52428800
LIBREOFFICE_BIN=soffice
TEMP_ROOT=/tmp/converter
```

If `CORS_ORIGINS` is omitted the server defaults to `*` (all origins). The file size limit defaults to 50 MB.

## Local Development

```bash
cd backend
npm install
npm run dev
```

Send a file using curl:

```bash
curl -F "file=@./sample.docx" http://localhost:8080/convert/word-to-pdf
```

## Deploy to Cloud Run

Ensure you are authenticated (`gcloud auth login`) and the Cloud Run API is enabled:

```bash
cd backend
bash deploy.sh
```

Or run the command manually:

```bash
gcloud run deploy file-converter-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --concurrency 80 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0
```

After deployment note the service URL (e.g. `https://file-converter-backend-xyz.a.run.app`) and update your frontend environment:

```
VITE_API_BASE=https://file-converter-backend-xyz.a.run.app
```

