/**
 * Word to PDF Lambda Container Function
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const startTime = Date.now();
  let tempInputPath, tempOutputPath;

  try {
    console.log('Word to PDF conversion started');

    const body = JSON.parse(event.body || '{}');
    const { fileContent, fileName = 'document.docx' } = body;

    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent parameter');
    }

    const wordBuffer = Buffer.from(fileContent, 'base64');
    console.log('Received Word file, size:', wordBuffer.length);

    const ext = fileName.endsWith('.doc') ? '.doc' : '.docx';
    tempInputPath = `/tmp/${Date.now()}_input${ext}`;
    await fs.writeFile(tempInputPath, wordBuffer);
    console.log(`Word file saved to ${tempInputPath}`);

    const outputDir = '/tmp';
    const command = `libreoffice7.6 --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to pdf --outdir ${outputDir} ${tempInputPath}`;

    console.log(`Executing: ${command}`);
    await execAsync(command, { timeout: 120000 });

    const baseName = path.basename(tempInputPath, ext);
    tempOutputPath = path.join(outputDir, `${baseName}.pdf`);

    const pdfBuffer = await fs.readFile(tempOutputPath);
    console.log(`Converted file size: ${pdfBuffer.length} bytes`);

    await cleanup([tempInputPath, tempOutputPath]);

    const duration = Date.now() - startTime;
    console.log(`Conversion completed in ${duration}ms`);

    const base64Output = pdfBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        fileContent: base64Output,
        fileName: fileName.replace(/\.(docx?|DOCX?)$/, '.pdf'),
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

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: message }),
  };
}

async function cleanup(paths) {
  for (const filePath of paths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore
      }
    }
  }
}











