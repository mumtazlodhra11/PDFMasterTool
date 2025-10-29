/**
 * AWS Lambda Function for Heavy PDF Conversions
 * Node.js 20 Runtime
 * 
 * Handles:
 * - Word to PDF (LibreOffice)
 * - PowerPoint to PDF (LibreOffice)
 * - Excel to PDF (LibreOffice)
 * - PDF to Word (LibreOffice)
 * - PDF to PowerPoint (LibreOffice)
 * - PDF to Excel (LibreOffice)
 * - PDF Compression (Ghostscript)
 * - OCR Processing (Tesseract)
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  const { operation, s3Key, bucket, options = {} } = event;
  
  console.log(`Processing: ${operation} for file: ${s3Key}`);
  
  try {
    // Download file from S3
    const inputPath = `/tmp/input_${Date.now()}${path.extname(s3Key)}`;
    await downloadFromS3(bucket, s3Key, inputPath);
    
    let outputPath;
    
    // Process based on operation
    switch (operation) {
      case 'word-to-pdf':
      case 'powerpoint-to-pdf':
      case 'excel-to-pdf':
        outputPath = await convertOfficeToPDF(inputPath);
        break;
        
      case 'pdf-to-word':
        outputPath = await convertPDFToWord(inputPath);
        break;
        
      case 'pdf-to-powerpoint':
        outputPath = await convertPDFToPowerPoint(inputPath);
        break;
        
      case 'pdf-to-excel':
        outputPath = await convertPDFToExcel(inputPath);
        break;
        
      case 'compress-pdf':
        outputPath = await compressPDF(inputPath, options.quality || 'medium');
        break;
        
      case 'ocr-pdf':
        outputPath = await performOCR(inputPath, options.language || 'eng');
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    // Upload result to S3
    const outputKey = `processed/${Date.now()}_${path.basename(outputPath)}`;
    await uploadToS3(bucket, outputKey, outputPath);
    
    // Cleanup
    await fs.unlink(inputPath);
    await fs.unlink(outputPath);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        outputKey,
        message: 'Conversion successful',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

/**
 * Download file from S3
 */
async function downloadFromS3(bucket, key, outputPath) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  const stream = response.Body;
  const chunks = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  await fs.writeFile(outputPath, Buffer.concat(chunks));
}

/**
 * Upload file to S3
 */
async function uploadToS3(bucket, key, filePath) {
  const fileContent = await fs.readFile(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: getMimeType(filePath),
  });
  await s3Client.send(command);
}

/**
 * Convert Office formats to PDF using LibreOffice
 */
async function convertOfficeToPDF(inputPath) {
  const outputDir = '/tmp';
  const cmd = `/opt/libreoffice/program/soffice --headless --convert-to pdf --outdir ${outputDir} "${inputPath}"`;
  
  await execAsync(cmd);
  
  const baseName = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${baseName}.pdf`);
}

/**
 * Convert PDF to Word
 */
async function convertPDFToWord(inputPath) {
  const outputPath = inputPath.replace('.pdf', '.docx');
  const cmd = `/opt/libreoffice/program/soffice --headless --convert-to docx --outdir /tmp "${inputPath}"`;
  
  await execAsync(cmd);
  return outputPath;
}

/**
 * Convert PDF to PowerPoint
 */
async function convertPDFToPowerPoint(inputPath) {
  const outputPath = inputPath.replace('.pdf', '.pptx');
  const cmd = `/opt/libreoffice/program/soffice --headless --convert-to pptx --outdir /tmp "${inputPath}"`;
  
  await execAsync(cmd);
  return outputPath;
}

/**
 * Convert PDF to Excel
 */
async function convertPDFToExcel(inputPath) {
  const outputPath = inputPath.replace('.pdf', '.xlsx');
  // This is a simplified version - real implementation would use specialized tools
  const cmd = `/opt/libreoffice/program/soffice --headless --convert-to xlsx --outdir /tmp "${inputPath}"`;
  
  await execAsync(cmd);
  return outputPath;
}

/**
 * Compress PDF using Ghostscript
 */
async function compressPDF(inputPath, quality) {
  const outputPath = inputPath.replace('.pdf', '_compressed.pdf');
  
  const qualitySettings = {
    low: '/prepress',
    medium: '/ebook',
    high: '/screen',
    extreme: '/screen',
  };
  
  const setting = qualitySettings[quality] || '/ebook';
  
  const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${setting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
  
  await execAsync(cmd);
  return outputPath;
}

/**
 * Perform OCR using Tesseract
 */
async function performOCR(inputPath, language) {
  const outputBase = inputPath.replace('.pdf', '_ocr');
  const cmd = `tesseract "${inputPath}" "${outputBase}" -l ${language} pdf`;
  
  await execAsync(cmd);
  return `${outputBase}.pdf`;
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}














