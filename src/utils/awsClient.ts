import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const AWS_REGION = import.meta.env.PUBLIC_AWS_REGION || 'eu-west-1';
const AWS_ACCESS_KEY_ID = import.meta.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = import.meta.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = import.meta.env.PUBLIC_AWS_S3_BUCKET || import.meta.env.AWS_S3_BUCKET;

// Cloud Run API URLs
// Updated: 7 Dec 2025 - New deployment to europe-west1
// Node.js backend (for Office to PDF conversions)
const NODE_BACKEND_URL = import.meta.env.PUBLIC_NODE_BACKEND_URL || import.meta.env.PUBLIC_CLOUD_RUN_URL || import.meta.env.VITE_API_URL || "https://file-converter-backend-607448904463.us-central1.run.app";
// Python backend (for PDF to Office conversions)
// FIXED: Use correct Cloud Run URL - ensure it's the latest deployed service
// IMPORTANT: If environment variable has wrong/old URL, it will cause CORS errors
// Default to the correct service URL
const DEFAULT_PYTHON_URL = "https://pdf-converter-607448904463.europe-west1.run.app";
// For local development, use localhost:8001 if available (changed from 9001 due to port conflict)
const LOCAL_PYTHON_URL = import.meta.env.DEV ? "http://localhost:8001" : null;
const PYTHON_BACKEND_URL = LOCAL_PYTHON_URL || import.meta.env.PUBLIC_PYTHON_BACKEND_URL || import.meta.env.PUBLIC_CLOUD_RUN_URL || DEFAULT_PYTHON_URL;

// Validate URL - if it contains old/wrong service name, use default
const PYTHON_BACKEND_URL_FINAL = PYTHON_BACKEND_URL.includes('pdf-converter-python-my7a6p7ima')
  ? DEFAULT_PYTHON_URL
  : PYTHON_BACKEND_URL;

// URL validation (console logs removed for production)

// Use Node.js backend for Office to PDF and HTML to PDF conversions
// Use Python backend for PDF to Office conversions
const CLOUD_RUN_URL = NODE_BACKEND_URL;

// S3 Client (only needed for file uploads, not conversions)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client!;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(file: File, key?: string): Promise<string> {
  const client = getS3Client();
  const uploadKey = key || generateS3Key(file.name);

  const fileBuffer = await file.arrayBuffer();
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: uploadKey,
    Body: new Uint8Array(fileBuffer),
    ContentType: file.type,
    Metadata: {
      uploadTime: new Date().toISOString(),
      originalName: file.name,
    },
  });

  await client.send(command);
  return uploadKey;
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get download URL for S3 file
 */
export async function getS3DownloadUrl(key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Call Cloud Run API for document conversion
 * Uses FormData (multipart/form-data) - simple and reliable
 * @param onProgress Optional callback for progress updates
 */
// Test service connectivity before making actual request
async function testServiceConnectivity(baseUrl: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    console.log('[Cloud Run] Testing connectivity to:', baseUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('[Cloud Run] ✅ Connectivity test passed:', data);
      return { accessible: true };
    } else {
      console.error('[Cloud Run] Connectivity test failed with status:', response.status);
      return { accessible: false, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.error('[Cloud Run] ❌ Connectivity test error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      accessible: false,
      error: errorMsg.includes('aborted') ? 'Timeout (service not responding)' : errorMsg
    };
  }
}

export async function callCloudRunConverter(
  toolType: string,
  file: File,
  options?: any,
  onProgress?: (progress: { progress: number; status: string; message?: string }) => void
): Promise<Blob> {
  // Check if Cloud Run URL is configured
  if (!CLOUD_RUN_URL) {
    throw new Error(
      `❌ Cloud Run URL not configured!\n\n` +
      `The "${toolType}" tool requires Cloud Run backend.\n\n` +
      `🚀 Quick Setup:\n` +
      `1. Deploy: cd google-cloud-run && .\\deploy.ps1\n` +
      `2. Create .env file in project root:\n` +
      `   PUBLIC_CLOUD_RUN_URL=https://your-service-url.run.app\n` +
      `3. Restart server: npm run dev\n\n` +
      `💡 Check deploy.ps1 output for the service URL.`
    );
  }

  // Map tool types to Cloud Run endpoints
  const endpointMap: Record<string, string> = {
    'pdf-to-word': 'pdf-to-word',
    'word-to-pdf': 'word-to-pdf',
    'pdf-to-excel': 'pdf-to-excel',
    'pdf-to-ppt': 'pdf-to-ppt',
    'pdf-to-powerpoint': 'pdf-to-ppt', // Map pdf-to-powerpoint to pdf-to-ppt endpoint
    'powerpoint-to-pdf': 'ppt-to-pdf',
    'ppt-to-pdf': 'ppt-to-pdf',
    'html-to-pdf': 'html-to-pdf',
    'htm-to-pdf': 'html-to-pdf',
    'excel-to-pdf': 'excel-to-pdf',
    'ai-ocr': 'ai-ocr',
    'fill-pdf-forms': 'fill-pdf-forms',
    'esign-pdf': 'esign-pdf',
    'pdf-compare': 'pdf-compare',
    'pdf-to-quiz': 'pdf-to-quiz',
    'pdf-voice-reader': 'pdf-voice-reader',
    'pdf-analytics': 'pdf-analytics',
    'smart-redaction': 'smart-redaction',
    'smart-organizer': 'smart-organizer',
    'pdf-metadata': 'pdf-metadata',
    'flatten-pdf': 'flatten-pdf',
    'password-protect': 'password-protect',
  };

  const endpoint = endpointMap[toolType];
  if (!endpoint) {
    throw new Error(`Unknown tool type: ${toolType}. Supported: ${Object.keys(endpointMap).join(', ')}`);
  }

  // Use Node.js backend for Office to PDF conversions (word-to-pdf, ppt-to-pdf, html-to-pdf)
  // Use Python backend for PDF to Office conversions (pdf-to-word, pdf-to-ppt, pdf-to-excel)
  // CRITICAL: Use Python backend for excel-to-pdf because it has Excel print settings modification logic
  const officeToPdfConversions = ['word-to-pdf', 'ppt-to-pdf', 'powerpoint-to-pdf', 'html-to-pdf', 'htm-to-pdf'];
  // Excel-to-PDF needs Python backend for chart split prevention
  const useNodeBackend = officeToPdfConversions.includes(toolType) && toolType !== 'excel-to-pdf';
  const backendUrl = useNodeBackend ? NODE_BACKEND_URL : PYTHON_BACKEND_URL_FINAL;
  const apiUrl = `${backendUrl}/convert/${endpoint}`;

  console.log(`[Cloud Run] Using ${useNodeBackend ? 'Node.js' : 'Python'} backend for ${toolType}`);
  if (toolType === 'excel-to-pdf') {
    console.log(`[Cloud Run] ✅ Using Python backend for excel-to-pdf (has Excel print settings modification for chart split prevention)`);
  }

  // Skip connectivity test for now - it might be causing issues
  // Direct POST request should work if service is accessible
  console.log('[Cloud Run] Skipping connectivity test, proceeding with POST request directly');

  // Create FormData with file
  const formData = new FormData();
  formData.append('file', file);

  // Add CORS headers for live site
  const headers: HeadersInit = {};

  // Get current origin for CORS
  if (typeof window !== 'undefined') {
    headers['Origin'] = window.location.origin;
  }

  // For password-protect, add password and permission options
  if (toolType === 'password-protect') {
    if (options?.userPassword) {
      formData.append('user_password', options.userPassword);
    }
    if (options?.ownerPassword) {
      formData.append('owner_password', options.ownerPassword);
    }
    formData.append('allow_printing', (options?.permissions?.allowPrinting !== false).toString());
    formData.append('allow_copying', (options?.permissions?.allowCopying !== false).toString());
    formData.append('allow_editing', (options?.permissions?.allowEditing === true).toString());
  }

  // For Excel to PDF, add conversion options
  if (toolType === 'excel-to-pdf' && options) {
    console.log('[Excel->PDF] 📊 Options being sent to backend:', {
      preventChartSplit: options.preventChartSplit,
      scaleChartsToFit: options.scaleChartsToFit,
      fitToPage: options.fitToPage,
      orientation: options.orientation,
      pageSize: options.pageSize,
      allOptions: options
    });

    if (options.pageSize) formData.append('page_size', options.pageSize);
    if (options.orientation) formData.append('orientation', options.orientation);
    if (options.sheetSelection) formData.append('sheet_selection', options.sheetSelection);
    if (options.includeCharts !== undefined) formData.append('include_charts', options.includeCharts.toString());
    if (options.includeImages !== undefined) formData.append('include_images', options.includeImages.toString());
    if (options.fitToPage !== undefined) formData.append('fit_to_page', options.fitToPage.toString());
    if (options.fitToWidth !== undefined) formData.append('fit_to_width', options.fitToWidth.toString());
    if (options.fitToHeight !== undefined) formData.append('fit_to_height', options.fitToHeight.toString());
    if (options.marginTop !== undefined) formData.append('margin_top', options.marginTop.toString());
    if (options.marginRight !== undefined) formData.append('margin_right', options.marginRight.toString());
    if (options.marginBottom !== undefined) formData.append('margin_bottom', options.marginBottom.toString());
    if (options.marginLeft !== undefined) formData.append('margin_left', options.marginLeft.toString());
    if (options.printQuality) formData.append('print_quality', options.printQuality);
    if (options.repeatRows !== undefined) formData.append('repeat_rows', options.repeatRows.toString());
    if (options.repeatColumns !== undefined) formData.append('repeat_columns', options.repeatColumns.toString());
    if (options.showGridlines !== undefined) formData.append('show_gridlines', options.showGridlines.toString());
    if (options.showRowColHeaders !== undefined) formData.append('show_row_col_headers', options.showRowColHeaders.toString());

    // Chart handling options - CRITICAL FOR CHART SPLIT PREVENTION
    if (options.preventChartSplit !== undefined) {
      formData.append('prevent_chart_split', options.preventChartSplit.toString());
      console.log('[Excel->PDF] ✅✅✅ prevent_chart_split sent:', options.preventChartSplit);
    } else {
      console.warn('[Excel->PDF] ⚠️⚠️⚠️ prevent_chart_split is UNDEFINED! Defaulting to true...');
      formData.append('prevent_chart_split', 'true'); // Default to true if not provided
    }
    if (options.scaleChartsToFit !== undefined) formData.append('scale_charts_to_fit', options.scaleChartsToFit.toString());
    if (options.chartQuality) formData.append('chart_quality', options.chartQuality);

    console.log('[Excel->PDF] 📋 Final FormData entries for chart options:', {
      prevent_chart_split: formData.get('prevent_chart_split'),
      scale_charts_to_fit: formData.get('scale_charts_to_fit'),
      fit_to_page: formData.get('fit_to_page'),
      orientation: formData.get('orientation')
    });
  }

  // For eSign PDF, add signature image and position if provided in options
  if (toolType === 'esign-pdf') {
    if (options?.signatureFile) {
      formData.append('signature_image', options.signatureFile);
    }
    // Add normalized position parameters (0-1 range)
    // IMPORTANT: Always send nx/ny if they are defined (even if 0.0, which is valid for top-left)
    // Only skip if they are truly undefined/null
    if (options?.nx !== undefined && options?.nx !== null && options?.ny !== undefined && options?.ny !== null) {
      formData.append('nx', options.nx.toString());
      formData.append('ny', options.ny.toString());
      console.log('[eSign] ✅ Sending position coordinates:', { nx: options.nx, ny: options.ny });
    } else {
      console.warn('[eSign] ⚠️ Position coordinates not provided!', { nx: options?.nx, ny: options?.ny });
    }

    // Add normalized size parameters (0-1 range)
    if (options?.nw !== undefined && options?.nw > 0) {
      formData.append('nw', options.nw.toString());
    }
    if (options?.nh !== undefined && options?.nh > 0) {
      formData.append('nh', options.nh.toString());
    }

    // Page number (1-based, default to 1)
    const pageNum = (options?.page && options.page > 0) ? Math.floor(options.page) : 1;
    formData.append('page', pageNum.toString());
    console.log('[eSign] Sending normalized coordinates to backend:', {
      nx: options?.nx,
      ny: options?.ny,
      nw: options?.nw,
      nh: options?.nh,
      page: pageNum,
      'options.page': options?.page,
      'pageNum (final)': pageNum,
      hasPosition: options?.nx !== undefined && options?.nx >= 0 && options?.ny !== undefined && options?.ny >= 0,
      allOptions: JSON.stringify(options)
    });
  }

  try {
    console.log('[Cloud Run] Starting request to:', apiUrl);
    console.log('[Cloud Run] File:', file.name, `(${(file.size / 1024).toFixed(2)}KB)`);
    try {
      const formDataEntries = Array.from(formData.entries()).map(([k, v]) => [k, v instanceof File ? `${v.name} (${v.size} bytes)` : v]);
      console.log('[Cloud Run] FormData entries:', formDataEntries);
    } catch (e) {
      console.log('[Cloud Run] FormData entries: (unable to log entries)');
    }

    // Progress: Uploading file
    onProgress?.({ progress: 10, status: 'uploading', message: 'Uploading file to server...' });

    // Create AbortController for timeout
    // Optimized timeouts for faster processing
    const fileSizeMB = file.size / (1024 * 1024);
    const timeoutMs = fileSizeMB > 20 ? 120000 : 90000; // 2 min for large files, 1.5 min for normal (optimized)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    console.log(`[Cloud Run] Timeout set to ${timeoutMs / 1000}s (file size: ${fileSizeMB.toFixed(2)}MB)`);

    // For FormData, don't set Content-Type - browser will set it automatically with boundary
    // This is important for CORS preflight to work correctly
    console.log('[Cloud Run] Making fetch request...');
    console.log('[Cloud Run] Request URL:', apiUrl);
    console.log('[Cloud Run] Request method: POST');
    try {
      const formDataSize = formData.entries ? Array.from(formData.entries()).length : 'unknown';
      console.log('[Cloud Run] FormData size:', formDataSize);
    } catch (e) {
      console.log('[Cloud Run] FormData size: unknown');
    }

    // Progress: Processing
    onProgress?.({ progress: 30, status: 'processing', message: 'Processing file on server...' });

    // Simple fetch - let browser handle CORS automatically for FormData
    const fetchStartTime = Date.now();
    console.log('[Cloud Run] Sending POST request to:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Don't set mode/credentials - browser handles FormData CORS automatically
      // Don't set Content-Type - browser sets it with boundary for FormData
    }).catch((fetchError) => {
      const fetchDuration = Date.now() - fetchStartTime;
      console.error('[Cloud Run] ===== FETCH ERROR =====');
      console.error('[Cloud Run] Error after', fetchDuration, 'ms');
      console.error('[Cloud Run] Error name:', fetchError.name);
      console.error('[Cloud Run] Error message:', fetchError.message);
      console.error('[Cloud Run] Error stack:', fetchError.stack);
      console.error('[Cloud Run] Full error object:', fetchError);
      console.error('[Cloud Run] =======================');
      clearTimeout(timeoutId);
      // Better error message for network issues
      console.error('[Cloud Run] ❌ Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
        error: fetchError
      });
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);

      if (fetchError.name === 'AbortError') {
        throw new Error(
          `❌ Request timeout! The service took too long to respond.\n\n` +
          `URL: ${apiUrl}\n\n` +
          `The service might be cold starting or processing a large file.\n` +
          `Please try again in a few moments.`
        );
      }

      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('Network request failed') || errorMsg.includes('ERR_')) {
        console.error('[Cloud Run] ❌ POST request failed with network error');
        console.error('[Cloud Run] Error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });

        // Check if it's a CORS error
        const isCorsError = errorMsg.includes('CORS') || errorMsg.includes('cross-origin') || errorMsg.includes('Access-Control');

        throw new Error(
          `❌ Network Error: Cannot send POST request to Cloud Run service\n\n` +
          `URL: ${apiUrl}\n` +
          `Backend URL: ${backendUrl}\n` +
          `Error: ${errorMsg}\n\n` +
          `${isCorsError ? '🔴 CORS Error Detected!\n' : ''}` +
          `Quick Fixes:\n` +
          `1. Verify service is accessible: ${backendUrl}/health\n` +
          `2. Open browser console (F12) → Network tab → Check if OPTIONS request fails\n` +
          `3. Try incognito/private window (disables extensions)\n` +
          `4. Disable browser extensions (ad blockers, privacy tools)\n` +
          `5. Check if service needs to be redeployed\n\n` +
          `If service URL loads in browser but POST fails, it's likely:\n` +
          `- Browser extension blocking\n` +
          `- CORS preflight issue\n` +
          `- Network/firewall blocking POST requests\n` +
          `- Service not deployed or wrong URL configured`
        );
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    console.log('[Cloud Run] ✅ Fetch completed, status:', response.status);

    // Progress: Downloading result
    onProgress?.({ progress: 80, status: 'processing', message: 'Downloading converted file...' });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.detail || errorJson.error || errorJson.message || errorText;
        } catch {
          // Not JSON, use as-is
        }
      } catch {
        errorText = response.statusText || 'Unknown error';
      }

      console.error('[Cloud Run] ❌ Error response:', response.status, errorText);
      throw new Error(`Conversion failed (${response.status}): ${errorText}`);
    }

    // Cloud Run returns JSON with base64 file
    let result;
    let textResponse = '';
    try {
      textResponse = await response.text();
      try {
        result = JSON.parse(textResponse);
      } catch (e) {
        // If it's not JSON, throw to the outer catch block
        throw new Error('Invalid JSON');
      }
    } catch (parseError) {
      console.error('[Cloud Run] ❌ Failed to parse JSON response:', parseError);
      // textResponse is already read, so we can use it safely
      throw new Error(`Invalid response from server: ${textResponse.substring(0, 200)}`);
    }

    if (!result.success) {
      const errorMsg = result.error || result.detail || result.message || 'Conversion failed';
      console.error('[Cloud Run] ❌ Conversion failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // Decode base64 to Blob (robust method)
    // Node.js backend returns: result.output.data
    // Python backend returns: result.file
    let base64Data = result.output?.data || result.file || result.fileContent || '';

    // Log base64 data info
    const originalBase64Length = base64Data.length;
    console.log(`[Cloud Run] Base64 data received: ${originalBase64Length} characters (${(originalBase64Length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`[Cloud Run] Expected file size from server: ${result.output?.size || result.size || 'unknown'} bytes`);

    // Clean base64 string (remove whitespace, newlines, data URL prefix if present)
    base64Data = base64Data.replace(/^data:.*?;base64,/, '').replace(/\s/g, '').replace(/\n/g, '').replace(/\r/g, '');

    const cleanedBase64Length = base64Data.length;
    if (cleanedBase64Length !== originalBase64Length) {
      console.log(`[Cloud Run] Base64 cleaned: ${originalBase64Length} → ${cleanedBase64Length} characters`);
    }

    if (!base64Data) {
      console.error('[Cloud Run] ❌ No file data in response. Response structure:', {
        hasOutput: !!result.output,
        hasFile: !!result.file,
        hasFileContent: !!result.fileContent,
        keys: Object.keys(result),
        result: result
      });
      throw new Error('No file data received from server');
    }

    // Check if base64 data seems truncated (should be multiple of 4 for valid base64)
    if (base64Data.length % 4 !== 0) {
      console.warn(`[Cloud Run] ⚠️ Base64 length (${base64Data.length}) is not a multiple of 4 - might be truncated!`);
    }

    // Validate base64 string (should only contain base64 chars)
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      console.error('[Cloud Run] ❌ Invalid base64 data detected');
      throw new Error('Invalid file data received from server (base64 encoding error)');
    }

    // Progress: Decoding result
    onProgress?.({ progress: 90, status: 'processing', message: 'Preparing file for download...' });

    // Decode using direct atob + Uint8Array method (more reliable than data URL)
    try {
      // Method 1: Direct binary decode (most reliable)
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`[Cloud Run] Decoded binary size: ${bytes.length} bytes`);

      // Progress: Complete
      onProgress?.({ progress: 100, status: 'completed', message: 'Conversion complete!' });

      // Determine content type from filename OR file bytes (more reliable)
      // Node.js backend returns: result.output.mimetype
      // Python backend returns: result.format or result.mimetype
      let contentType = result.output?.mimetype || result.format || result.mimetype || 'application/octet-stream';

      // For HTML to PDF conversion, ensure content type is PDF
      if (toolType === 'html-to-pdf' || toolType === 'htm-to-pdf') {
        contentType = 'application/pdf';
      }

      // Validate PDF file integrity after decoding
      if (contentType === 'application/pdf' || (result.output?.filename || result.filename || '').endsWith('.pdf')) {
        const pdfHeader = String.fromCharCode(...bytes.slice(0, 4));
        const pdfFooter = String.fromCharCode(...bytes.slice(-10));
        const expectedSize = result.output?.size || result.size;

        console.log(`[Cloud Run] PDF validation: Header="${pdfHeader}", Size=${bytes.length} bytes, Expected=${expectedSize || 'unknown'}, Footer ends with EOF=${pdfFooter.includes('%%EOF')}`);

        if (pdfHeader !== '%PDF') {
          console.error('[Cloud Run] ❌ Invalid PDF: missing PDF header!');
          throw new Error('Invalid PDF file received: missing PDF header');
        }

        if (expectedSize && Math.abs(bytes.length - expectedSize) > 100) {
          console.warn(`[Cloud Run] ⚠️ PDF size mismatch: received ${bytes.length} bytes, expected ${expectedSize} bytes`);
        }

        if (!pdfFooter.includes('%%EOF')) {
          console.warn('[Cloud Run] ⚠️ PDF might be incomplete: missing EOF marker');
        }
      }

      // First, try to detect from file bytes (magic numbers) as fallback
      const firstBytes = bytes.slice(0, 8);
      if (firstBytes.length >= 4 && contentType === 'application/octet-stream') {
        const header = new TextDecoder('latin1').decode(firstBytes.slice(0, 4));
        if (header.startsWith('%PDF')) {
          contentType = 'application/pdf';
        } else if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B) {
          // ZIP signature (DOCX, XLSX, PPTX are all ZIP-based)
          // Check filename to determine which Office format
          const filename = result.output?.filename || result.filename || '';
          if (filename.endsWith('.docx')) {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (filename.endsWith('.xlsx')) {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          } else if (filename.endsWith('.pptx')) {
            contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          } else {
            // Default to DOCX if ZIP but no extension
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          }
        }
      }

      // Fallback to filename-based detection if bytes didn't match
      if (contentType === 'application/octet-stream') {
        const filename = result.output?.filename || result.filename || '';
        if (filename.endsWith('.pdf')) {
          contentType = 'application/pdf';
        } else if (filename.endsWith('.docx')) {
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (filename.endsWith('.xlsx')) {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (filename.endsWith('.pptx')) {
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }
      }

      // Create blob directly from bytes
      const typedBlob = new Blob([bytes], { type: contentType }) as Blob & {
        fileName?: string;
        originalFileName?: string;
        serverMetadata?: Record<string, any>;
      };
      // Node.js backend: result.output.filename, Python backend: result.filename
      typedBlob.fileName = result.output?.filename || result.filename || undefined;
      typedBlob.originalFileName = file.name;
      typedBlob.serverMetadata = {
        size: result.output?.size || result.size,
        processingTime: result.processing_time || result.processingTime,
        originalSize: result.original_size ?? result.originalSize,
        quality: result.quality,
        format: result.format,
      };

      console.log('[Cloud Run] ✅ Decoded file:', typedBlob.size, 'bytes, type:', contentType);

      // Additional validation for DOCX files (PDF to Word)
      if (toolType === 'pdf-to-word' && contentType.includes('wordprocessingml')) {
        // Validate DOCX structure (should start with PK - ZIP signature)
        const firstBytes = bytes.slice(0, 4);
        if (firstBytes[0] !== 0x50 || firstBytes[1] !== 0x4B) {
          console.error('[Cloud Run] ❌ Invalid DOCX: Missing ZIP signature');
          throw new Error('Invalid DOCX file received: file structure is corrupted');
        }
        console.log('[Cloud Run] ✅ DOCX file validated: ZIP signature found');
      }

      // Validate blob size
      if (typedBlob.size === 0) {
        throw new Error('Received empty file from server');
      }

      if (typedBlob.size < 100) {
        console.warn('[Cloud Run] Very small file size:', typedBlob.size, 'bytes - file might be corrupted');
      }

      // For DOCX files, verify ZIP structure immediately
      if (contentType.includes('wordprocessingml') || contentType.includes('docx')) {
        const headArray = bytes.slice(0, 2);
        if (headArray[0] !== 0x50 || headArray[1] !== 0x4B) {
          console.error('[Cloud Run] ❌ Invalid DOCX structure. Expected PK (ZIP), got:', headArray);
          throw new Error('Corrupted DOCX received (invalid ZIP header). Please try converting again.');
        }
      }

      // For PDF files, verify PDF header
      if (contentType.includes('pdf')) {
        const pdfHeader = new TextDecoder().decode(bytes.slice(0, 4));
        if (!pdfHeader.startsWith('%PDF')) {
          console.error('[Cloud Run] ❌ Invalid PDF structure. Expected %PDF, got:', pdfHeader);
          throw new Error('Corrupted PDF received (invalid PDF header). Please try converting again.');
        }
      }

      return typedBlob;
    } catch (decodeError) {
      console.error('[Cloud Run] ❌ Base64 decode error:', decodeError);
      throw new Error(`Failed to decode file from server: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
    }
  } catch (error) {
    console.error('[Cloud Run] Conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Cloud Run conversion failed: ${errorMessage}`);
  }
}

/**
 * Main converter function - uses Cloud Run only (no Lambda)
 */
export async function callLambdaConverter(
  toolType: string,
  file: File,
  options?: any
): Promise<Blob> {
  // ONLY use Cloud Run - no Lambda fallback
  return await callCloudRunConverter(toolType, file, options);
}

/**
 * Check if operation requires Cloud Run backend
 */
export function requiresCloudRun(operation: string): boolean {
  const cloudRunOperations = [
    'word-to-pdf',
    'powerpoint-to-pdf',
    'ppt-to-pdf',
    'excel-to-pdf',
    'pdf-to-word',
    'pdf-to-powerpoint',
    'pdf-to-ppt',
    'pdf-to-excel',
    'edit-pdf',
  ];
  return cloudRunOperations.includes(operation);
}

/**
 * Generate unique S3 key for file
 */
export function generateS3Key(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  return `uploads/${timestamp}-${random}.${extension}`;
}


