/**
 * PDF to Word Lambda Container Function
 * Uses LibreOffice bundled in Docker image
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Handle OPTIONS request for CORS preflight
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

exports.handler = async (event) => {
  // Handle CORS preflight
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
    console.log('PDF to Word conversion started');

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileContent, fileName = 'document.pdf' } = body;

    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent parameter');
    }

    // Decode base64 file content
    const pdfBuffer = Buffer.from(fileContent, 'base64');
    console.log('Received PDF, size:', pdfBuffer.length);

    // Save to temp file
    tempInputPath = `/tmp/${Date.now()}_input.pdf`;
    await fs.writeFile(tempInputPath, pdfBuffer);
    console.log(`PDF saved to ${tempInputPath}`);

    // Convert using LibreOffice
    const outputDir = '/tmp';
    const command = `libreoffice7.6 --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to docx --outdir ${outputDir} ${tempInputPath}`;

    console.log(`Executing: ${command}`);
    await execAsync(command, { timeout: 120000 });

    // Read converted file
    const baseName = path.basename(tempInputPath, '.pdf');
    tempOutputPath = path.join(outputDir, `${baseName}.docx`);

    const wordBuffer = await fs.readFile(tempOutputPath);
    console.log(`Converted file size: ${wordBuffer.length} bytes`);

    // Cleanup temp files
    await cleanup([tempInputPath, tempOutputPath]);

    const duration = Date.now() - startTime;
    console.log(`Conversion completed in ${duration}ms`);

    // Return base64 encoded file
    const base64Output = wordBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        fileContent: base64Output,
        fileName: fileName.replace('.pdf', '.docx'),
        fileSize: wordBuffer.length,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        processingTime: duration,
      }),
    };
  } catch (error) {
    console.error('Conversion error:', error);
    await cleanup([tempInputPath, tempOutputPath]);
    return errorResponse(500, `Conversion failed: ${error.message}`);
  }
};

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}

async function cleanup(paths) {
  for (const filePath of paths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}









