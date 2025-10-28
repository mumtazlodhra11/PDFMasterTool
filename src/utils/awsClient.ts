import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const AWS_REGION = import.meta.env.PUBLIC_AWS_REGION || 'eu-west-1';
const AWS_ACCESS_KEY_ID = import.meta.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = import.meta.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = import.meta.env.PUBLIC_AWS_S3_BUCKET || import.meta.env.AWS_S3_BUCKET;

// Lambda Function URLs (public, no credentials needed)
const LAMBDA_URLS = {
  pdfToWord: import.meta.env.PUBLIC_LAMBDA_PDF_TO_WORD,
  wordToPdf: import.meta.env.PUBLIC_LAMBDA_WORD_TO_PDF,
  pdfToExcel: import.meta.env.PUBLIC_LAMBDA_PDF_TO_EXCEL,
  pdfToPpt: import.meta.env.PUBLIC_LAMBDA_PDF_TO_PPT,
  pptToPdf: import.meta.env.PUBLIC_LAMBDA_PPT_TO_PDF,
};

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
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: uploadKey,
    Body: await file.arrayBuffer(),
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
 * Call Lambda function via HTTP URL for document conversion
 * Sends file as base64 directly to Lambda (no client-side S3 access needed)
 */
export async function callLambdaConverter(
  toolType: string,
  file: File
): Promise<Blob> {
  // Get the correct Lambda URL
  const lambdaUrl = getLambdaUrl(toolType);
  
  if (!lambdaUrl) {
    throw new Error(
      `❌ Lambda function not deployed!\n\n` +
      `The "${toolType}" tool requires AWS Lambda deployment.\n\n` +
      `🚀 Quick Setup (30-45 minutes):\n` +
      `1. Open: aws/QUICK_DEPLOY.md\n` +
      `2. Deploy 5 Lambda functions to AWS\n` +
      `3. Copy Function URLs to .env file\n` +
      `4. Restart server: npm run dev\n\n` +
      `📚 Full Guide: aws/LAMBDA_FIXES_COMPLETE.md\n\n` +
      `💡 Meanwhile, try our 18+ client-side tools that work instantly:\n` +
      `   • Merge PDF\n` +
      `   • Compress PDF\n` +
      `   • Image to PDF\n` +
      `   • PDF to JPG\n` +
      `   • And many more!`
    );
  }

  // Convert file to base64
  const fileBuffer = await file.arrayBuffer();
  const base64File = btoa(
    new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  // Call Lambda function with base64 file
  const response = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileContent: base64File,
      fileName: file.name,
      fileType: file.type,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Conversion failed: ${response.statusText} - ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  
  // If Lambda returns JSON with error
  if (contentType?.includes('application/json')) {
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Conversion failed');
    }
    
    // If result has base64 content
    if (result.fileContent) {
      const binaryString = atob(result.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: result.contentType || 'application/octet-stream' });
    }
  }

  // If Lambda returns file directly
  return await response.blob();
}

/**
 * Get Lambda URL for specific tool type
 */
function getLambdaUrl(toolType: string): string | undefined {
  const urlMap: Record<string, string | undefined> = {
    'pdf-to-word': LAMBDA_URLS.pdfToWord,
    'word-to-pdf': LAMBDA_URLS.wordToPdf,
    'pdf-to-excel': LAMBDA_URLS.pdfToExcel,
    'pdf-to-ppt': LAMBDA_URLS.pdfToPpt,
    'powerpoint-to-pdf': LAMBDA_URLS.pptToPdf,
    'ppt-to-pdf': LAMBDA_URLS.pptToPdf,
  };

  return urlMap[toolType];
}

/**
 * Determine if file should use Lambda (server-side) processing
 * based on file size and complexity
 */
export function shouldUseLambda(file: File, operation: string): boolean {
  const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
  
  // Operations that always require Lambda
  const lambdaOnlyOperations = [
    'word-to-pdf',
    'powerpoint-to-pdf',
    'excel-to-pdf',
    'pdf-to-word',
    'pdf-to-powerpoint',
    'pdf-to-excel',
  ];

  if (lambdaOnlyOperations.includes(operation)) {
    return true;
  }

  // Large files should use Lambda
  if (file.size > FILE_SIZE_THRESHOLD) {
    return true;
  }

  return false;
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


