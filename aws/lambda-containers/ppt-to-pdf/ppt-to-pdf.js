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
    const { fileContent, fileName = 'presentation.pptx' } = body;

    if (!fileContent) {
      return errorResponse(400, 'Missing fileContent');
    }

    const pptBuffer = Buffer.from(fileContent, 'base64');
    const ext = fileName.endsWith('.ppt') ? '.ppt' : '.pptx';
    tempInputPath = `/tmp/${Date.now()}_input${ext}`;
    await fs.writeFile(tempInputPath, pptBuffer);

    const outputDir = '/tmp';
    const command = `libreoffice7.6 --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to pdf --outdir ${outputDir} ${tempInputPath}`;

    await execAsync(command, { timeout: 120000 });

    const baseName = path.basename(tempInputPath, ext);
    tempOutputPath = path.join(outputDir, `${baseName}.pdf`);

    const pdfBuffer = await fs.readFile(tempOutputPath);
    await cleanup([tempInputPath, tempOutputPath]);

    const duration = Date.now() - startTime;
    const base64Output = pdfBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
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









