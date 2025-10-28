/**
 * PowerPoint to PDF Lambda Function
 * Uses LibreOffice for high-quality conversion
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });

exports.handler = async (event) => {
  // Handle OPTIONS request for CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: '',
    };
  }

  const startTime = Date.now();
  let tempInputPath, tempOutputPath;
  
  try {
    console.log('PowerPoint to PDF conversion started');
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileContent, fileName = 'presentation.pptx', fileKey } = body;
    
    let pptBuffer;
    
    // Support both base64 (new) and S3 (legacy) approaches
    if (fileContent) {
      // New approach: base64 content from client
      pptBuffer = Buffer.from(fileContent, 'base64');
      console.log('Received base64 file, size:', pptBuffer.length);
    } else if (fileKey) {
      // Legacy approach: download from S3
      const bucketName = process.env.S3_BUCKET || 'pdfmastertool-temp-files';
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      });
      
      const { Body } = await s3Client.send(getCommand);
      pptBuffer = await streamToBuffer(Body);
      console.log('Downloaded from S3, size:', pptBuffer.length);
    } else {
      return errorResponse(400, 'Missing fileContent or fileKey parameter');
    }
    
    // Save to temp file
    const ext = fileName.endsWith('.ppt') ? '.ppt' : '.pptx';
    tempInputPath = `/tmp/${Date.now()}_input${ext}`;
    await fs.writeFile(tempInputPath, pptBuffer);
    console.log(`PowerPoint file saved to ${tempInputPath}`);
    
    // Convert using LibreOffice
    const outputDir = '/tmp';
    const command = `libreoffice7.6 --headless --convert-to pdf --outdir ${outputDir} ${tempInputPath}`;
    
    console.log(`Executing: ${command}`);
    await execAsync(command, { timeout: 120000 }); // 2 minute timeout
    
    // Read converted file
    const baseName = path.basename(tempInputPath, ext);
    tempOutputPath = path.join(outputDir, `${baseName}.pdf`);
    
    const pdfBuffer = await fs.readFile(tempOutputPath);
    console.log(`Converted file size: ${pdfBuffer.length} bytes`);
    
    // Cleanup temp files
    await cleanup([tempInputPath, tempOutputPath]);
    
    const duration = Date.now() - startTime;
    console.log(`Conversion completed in ${duration}ms`);
    
    // Return file as base64
    const base64Output = pdfBuffer.toString('base64');
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        fileContent: base64Output,
        fileName: fileName.replace(/\.(pptx?|PPTX?)$/, '.pdf'),
        fileSize: pdfBuffer.length,
        contentType: 'application/pdf',
        processingTime: duration,
      }),
    };
    
  } catch (error) {
    console.error('Conversion error:', error);
    await cleanup([tempInputPath, tempOutputPath]);
    
    return errorResponse(500, `Conversion failed: ${error.message}`);
  }
};

// Helper functions
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function cleanup(paths) {
  for (const filePath of paths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}






