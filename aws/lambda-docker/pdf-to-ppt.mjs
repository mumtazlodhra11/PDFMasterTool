/**
 * PDF to PowerPoint Lambda Function (Docker)
 * Uses LibreOffice for conversion
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { basename } from "node:path";

const execP = promisify(execFile);

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return corsResponse(200, '');
  }

  const startTime = Date.now();
  let inPath, outPath;
  
  try {
    console.log('PDF to PowerPoint conversion started');
    
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { fileContent, fileName = 'document.pdf' } = body;
    
    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent parameter');
    }
    
    const pdfBuffer = Buffer.from(fileContent, 'base64');
    console.log('Received file, size:', pdfBuffer.length);
    
    inPath = `/tmp/${Date.now()}-input.pdf`;
    await writeFile(inPath, pdfBuffer);
    
    const args = [
      "--headless", "--nologo", "--norestore", "--nolockcheck",
      "--convert-to", "pptx",
      "--outdir", "/tmp", inPath
    ];
    
    const env = { ...process.env, HOME: "/tmp" };
    await execP("soffice", args, { env, timeout: 240000 });
    
    const baseName = basename(inPath, '.pdf');
    outPath = `/tmp/${baseName}.pptx`;
    
    const pptBuffer = await readFile(outPath);
    console.log(`Converted file size: ${pptBuffer.length} bytes`);
    
    await cleanup([inPath, outPath]);
    
    const duration = Date.now() - startTime;
    const base64Output = pptBuffer.toString('base64');
    
    return corsResponse(200, JSON.stringify({
      success: true,
      fileContent: base64Output,
      fileName: fileName.replace('.pdf', '.pptx'),
      fileSize: pptBuffer.length,
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      processingTime: duration,
    }));
    
  } catch (error) {
    console.error('Conversion error:', error);
    await cleanup([inPath, outPath]);
    return errorResponse(500, `Conversion failed: ${error.message}`);
  }
};

async function cleanup(paths) {
  for (const filePath of paths) {
    if (filePath) {
      try { await unlink(filePath); } catch (err) {}
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
  return { statusCode, headers: corsHeaders(), body };
}

function errorResponse(statusCode, message) {
  return corsResponse(statusCode, JSON.stringify({ success: false, error: message }));
}


