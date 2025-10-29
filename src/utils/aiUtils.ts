import OpenAI from 'openai';
import { createWorker } from 'tesseract.js';
import { ConversionProgress } from './pdfUtils';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for client-side, consider moving to server
});

/**
 * Perform OCR on image or PDF using Tesseract.js
 */
export async function performOCR(
  file: File,
  language: string = 'eng',
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Initializing OCR...' });

    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 70) + 10;
          onProgress?.({
            progress,
            status: 'processing',
            message: `Recognizing text... ${Math.round(m.progress * 100)}%`,
          });
        }
      },
    });

    onProgress?.({ progress: 85, status: 'processing', message: 'Extracting text...' });

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    onProgress?.({ progress: 100, status: 'completed' });

    return text;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'OCR failed' });
    throw error;
  }
}

/**
 * Summarize PDF text using OpenAI GPT-4
 */
export async function summarizeText(
  text: string,
  options: {
    maxLength?: number;
    format?: 'bullet' | 'paragraph';
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  const { maxLength = 500, format = 'bullet' } = options;

  try {
    onProgress?.({ progress: 20, status: 'processing', message: 'Analyzing document...' });

    const prompt = format === 'bullet'
      ? `Summarize the following text in bullet points (maximum ${maxLength} words):\n\n${text}`
      : `Provide a concise summary of the following text (maximum ${maxLength} words):\n\n${text}`;

    onProgress?.({ progress: 50, status: 'processing', message: 'Generating summary...' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, accurate summaries of documents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: Math.ceil(maxLength * 1.5),
      temperature: 0.5,
    });

    onProgress?.({ progress: 100, status: 'completed' });

    return response.choices[0]?.message?.content || 'Summary generation failed';
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Summarization failed' });
    throw error;
  }
}

/**
 * Translate PDF text using OpenAI GPT-4
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  try {
    onProgress?.({ progress: 20, status: 'processing', message: 'Preparing translation...' });

    const prompt = `Translate the following text to ${targetLanguage}. Maintain the original formatting and structure:\n\n${text}`;

    onProgress?.({ progress: 50, status: 'processing', message: 'Translating...' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate accurately while preserving formatting and context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    onProgress?.({ progress: 100, status: 'completed' });

    return response.choices[0]?.message?.content || 'Translation failed';
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Translation failed' });
    throw error;
  }
}

/**
 * AI-powered smart PDF compression suggestions
 */
export async function getSmartCompressionAdvice(
  fileSize: number,
  pageCount: number,
  hasImages: boolean
): Promise<{
  recommendedQuality: number;
  estimatedSize: string;
  suggestions: string[];
}> {
  try {
    const prompt = `Given a PDF file with:
- Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB
- Page count: ${pageCount}
- Has images: ${hasImages ? 'Yes' : 'No'}

Provide compression recommendations in JSON format with:
1. recommendedQuality (0-100)
2. estimatedSize (in MB)
3. suggestions (array of strings)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in PDF optimization. Provide technical, actionable advice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      recommendedQuality: result.recommendedQuality || 75,
      estimatedSize: result.estimatedSize || 'Unknown',
      suggestions: result.suggestions || ['Use standard compression settings'],
    };
  } catch (error) {
    return {
      recommendedQuality: 75,
      estimatedSize: 'Unknown',
      suggestions: ['Use standard compression settings'],
    };
  }
}

/**
 * Extract key information from PDF using AI
 */
export async function extractKeyInfo(
  text: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<{
  title?: string;
  author?: string;
  keyPoints: string[];
  topics: string[];
}> {
  try {
    onProgress?.({ progress: 30, status: 'processing', message: 'Analyzing content...' });

    const prompt = `Analyze this document and extract:
1. Document title (if identifiable)
2. Author (if mentioned)
3. Key points (top 5)
4. Main topics (top 3)

Document text:
${text.substring(0, 5000)}

Respond in JSON format.`;

    onProgress?.({ progress: 70, status: 'processing', message: 'Extracting information...' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert document analyzer. Extract structured information from documents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    onProgress?.({ progress: 100, status: 'completed' });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: result.title,
      author: result.author,
      keyPoints: result.keyPoints || [],
      topics: result.topics || [],
    };
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Analysis failed' });
    throw error;
  }
}














