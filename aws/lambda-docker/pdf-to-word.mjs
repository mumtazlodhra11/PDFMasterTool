/**
 * PDF to Word Lambda Function (Docker)
 * Uses LibreOffice for high-quality conversion
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { basename } from "node:path";

const execP = promisify(execFile);

export const handler = async (event) => {
  // Handle OPTIONS request for CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return corsResponse(200, '');
  }

  const startTime = Date.now();
  let inPath, outPath;
  
  try {
    console.log('PDF to Word conversion started');
    
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { fileContent, fileName = 'document.pdf' } = body;
    
    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent parameter');
    }
    
    // Decode base64 file
    const pdfBuffer = Buffer.from(fileContent, 'base64');
    console.log('Received file, size:', pdfBuffer.length);
    
    // Save to temp file
    inPath = `/tmp/${Date.now()}-input.pdf`;
    await writeFile(inPath, pdfBuffer);
    console.log(`PDF saved to ${inPath}`);
    
    // Convert using LibreOffice
    const args = [
      "--headless", "--nologo", "--norestore", "--nolockcheck",
      "--convert-to", "docx",
      "--outdir", "/tmp", inPath
    ];
    
    const env = { ...process.env, HOME: "/tmp" };
    console.log(`Executing: soffice ${args.join(' ')}`);
    
    const { stdout, stderr } = await execP("soffice", args, { 
      env, 
      timeout: 240000 // 4 minute timeout
    });
    
    console.log('LibreOffice stdout:', stdout);
    if (stderr) console.log('LibreOffice stderr:', stderr);
    
    // Read converted file
    const baseName = basename(inPath, '.pdf');
    outPath = `/tmp/${baseName}.docx`;
    
    const wordBuffer = await readFile(outPath);
    console.log(`Converted file size: ${wordBuffer.length} bytes`);
    
    // Cleanup
    await cleanup([inPath, outPath]);
    
    const duration = Date.now() - startTime;
    console.log(`Conversion completed in ${duration}ms`);
    
    // Return file as base64
    const base64Output = wordBuffer.toString('base64');
    
    return corsResponse(200, JSON.stringify({
      success: true,
      fileContent: base64Output,
      fileName: fileName.replace('.pdf', '.docx'),
      fileSize: wordBuffer.length,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      processingTime: duration,
    }));
    
  } catch (error) {
    console.error('Conversion error:', error);
    await cleanup([inPath, outPath]);
    
    return errorResponse(500, `Conversion failed: ${error.message}`);
  }
};

// Helper functions
async function cleanup(paths) {
  for (const filePath of paths) {
    if (filePath) {
      try {
        await unlink(filePath);
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

function corsResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body,
  };
}

function errorResponse(statusCode, message) {
  return corsResponse(statusCode, JSON.stringify({
    success: false,
    error: message,
  }));
}


