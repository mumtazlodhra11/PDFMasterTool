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
    const body = JSON.parse(event.body || '{}');
    const { fileContent, fileName = 'document.pdf' } = body;

    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent');
    }

    const pdfBuffer = Buffer.from(fileContent, 'base64');
    tempInputPath = `/tmp/${Date.now()}_input.pdf`;
    await fs.writeFile(tempInputPath, pdfBuffer);

    const outputDir = '/tmp';
    const command = `libreoffice7.6 --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to pptx --outdir ${outputDir} ${tempInputPath}`;

    await execAsync(command, { timeout: 120000 });

    const baseName = path.basename(tempInputPath, '.pdf');
    tempOutputPath = path.join(outputDir, `${baseName}.pptx`);

    const pptBuffer = await fs.readFile(tempOutputPath);
    await cleanup([tempInputPath, tempOutputPath]);

    const duration = Date.now() - startTime;
    const base64Output = pptBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        fileContent: base64Output,
        fileName: fileName.replace('.pdf', '.pptx'),
        fileSize: pptBuffer.length,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        processingTime: duration,
      }),
    };
  } catch (error) {
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
      try { await fs.unlink(filePath); } catch (e) {}
    }
  }
}













