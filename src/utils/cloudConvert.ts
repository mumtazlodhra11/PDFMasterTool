/**
 * CloudConvert API Client for Document Conversions
 * Free tier: 25 conversions/day
 * Paid: $9.99 for 1000 conversions
 */

const CLOUDCONVERT_API_KEY = import.meta.env.PUBLIC_CLOUDCONVERT_API_KEY || '';
const API_BASE = 'https://api.cloudconvert.com/v2';

interface ConversionTask {
  id: string;
  status: string;
  result?: {
    files: Array<{
      url: string;
      filename: string;
    }>;
  };
}

/**
 * Convert file using CloudConvert API
 */
export async function convertWithCloudConvert(
  file: File,
  outputFormat: string
): Promise<Blob> {
  if (!CLOUDCONVERT_API_KEY) {
    throw new Error('CloudConvert API key not configured. Please add PUBLIC_CLOUDCONVERT_API_KEY to .env');
  }

  try {
    // Step 1: Create a job
    const jobResponse = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'upload-file': {
            operation: 'import/upload',
          },
          'convert-file': {
            operation: 'convert',
            input: 'upload-file',
            output_format: outputFormat,
            some_other_option: 'value',
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      }),
    });

    if (!jobResponse.ok) {
      throw new Error(`Failed to create conversion job: ${jobResponse.statusText}`);
    }

    const jobData = await jobResponse.json();
    const uploadTask = jobData.data.tasks.find((t: any) => t.name === 'upload-file');
    const exportTask = jobData.data.tasks.find((t: any) => t.name === 'export-file');

    // Step 2: Upload file
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch(uploadTask.result.form.url, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    // Step 3: Wait for conversion to complete
    const convertedFile = await pollTaskCompletion(exportTask.id);

    // Step 4: Download converted file
    const downloadResponse = await fetch(convertedFile.url);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download converted file: ${downloadResponse.statusText}`);
    }

    return await downloadResponse.blob();
  } catch (error) {
    console.error('CloudConvert conversion error:', error);
    throw error;
  }
}

/**
 * Poll task until completion
 */
async function pollTaskCompletion(taskId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const taskResponse = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
      },
    });

    const taskData = await taskResponse.json();
    const task = taskData.data;

    if (task.status === 'finished' && task.result?.files?.[0]) {
      return task.result.files[0];
    }

    if (task.status === 'error') {
      throw new Error(`Conversion failed: ${task.message || 'Unknown error'}`);
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Conversion timeout - took too long');
}

/**
 * Specific conversion helpers
 */
export async function wordToPDF(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'pdf');
}

export async function pdfToWord(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'docx');
}

export async function excelToPDF(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'pdf');
}

export async function pdfToExcel(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'xlsx');
}

export async function pptToPDF(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'pdf');
}

export async function pdfToPPT(file: File): Promise<Blob> {
  return convertWithCloudConvert(file, 'pptx');
}









