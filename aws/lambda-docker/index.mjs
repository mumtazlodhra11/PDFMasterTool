/**
 * Main Lambda Handler - Routes to correct conversion function
 * Detects conversion type from event or uses CONVERSION_TYPE env var
 */

import { handler as pdfToWord } from './pdf-to-word.mjs';
import { handler as pdfToExcel } from './pdf-to-excel.mjs';
import { handler as pdfToPPT } from './pdf-to-ppt.mjs';

export const handler = async (event) => {
  // Determine conversion type
  const conversionType = process.env.CONVERSION_TYPE || detectConversionType(event);
  
  console.log(`Conversion type: ${conversionType}`);
  
  // Route to appropriate handler
  switch (conversionType) {
    case 'pdf-to-word':
      return await pdfToWord(event);
    case 'pdf-to-excel':
      return await pdfToExcel(event);
    case 'pdf-to-ppt':
      return await pdfToPPT(event);
    default:
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: `Unknown conversion type: ${conversionType}`,
        }),
      };
  }
};

function detectConversionType(event) {
  // Try to detect from body
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    if (body.conversionType) {
      return body.conversionType;
    }
  } catch (e) {
    // ignore
  }
  
  // Default to pdf-to-word
  return 'pdf-to-word';
}


