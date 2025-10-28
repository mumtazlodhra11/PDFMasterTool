# Lambda Functions Update Required

## Issue Fixed
- ❌ Old: Client tried to use S3Client (requires AWS credentials in browser)
- ✅ New: Send file as base64 directly to Lambda
- ✅ Lambda returns result as base64 (no S3 needed for small files)

## Files Updated
1. ✅ pdf-to-word.js - Updated to accept base64
2. ⏳ word-to-pdf.js - Needs update
3. ⏳ pdf-to-excel.js - Needs update
4. ⏳ pdf-to-ppt.js - Needs update
5. ⏳ ppt-to-pdf.js - Needs update

## Changes Needed in Each File

### 1. Update Handler to Accept Base64:
```javascript
const { fileContent, fileName, fileKey } = body;

let inputBuffer;
if (fileContent) {
  inputBuffer = Buffer.from(fileContent, 'base64');
} else if (fileKey) {
  // Legacy S3 download
}
```

### 2. Return Base64 Instead of S3 Upload:
```javascript
const base64Output = outputBuffer.toString('base64');
return {
  statusCode: 200,
  headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  body: JSON.stringify({
    success: true,
    fileContent: base64Output,
    fileName: outputFileName,
    contentType: 'application/...',
  }),
};
```

## Quick Update & Redeploy

For now, we can test with pdf-to-word (already updated).
Other functions will give errors until updated.

## Alternative: Keep S3 Approach

If we want to keep S3, we need to:
1. Create Lambda API Gateway with S3 pre-signed URL generation
2. Client gets presigned URL, uploads to S3
3. Lambda processes from S3
4. Client downloads from S3 presigned URL

But base64 approach is simpler for files < 5MB.









