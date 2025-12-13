import type { ConversionProgress } from './pdfUtils';

/**
 * Extract text from PDF for voice reading
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  try {
    console.log('[extractTextFromPDF] ===== STARTING PDF TEXT EXTRACTION =====');
    console.log('[extractTextFromPDF] File name:', file.name);
    console.log('[extractTextFromPDF] File size:', file.size, 'bytes');
    console.log('[extractTextFromPDF] File type:', file.type);
    
    onProgress?.({ progress: 5, status: 'processing', message: 'Initializing PDF reader...' });

    // Import pdfjs-dist
    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist');
      console.log('[extractTextFromPDF] pdfjs-dist loaded, version:', pdfjsLib.version);
    } catch (importError) {
      console.error('[extractTextFromPDF] Failed to import pdfjs-dist:', importError);
      throw new Error('Failed to load PDF library. Please refresh the page and try again.');
    }
    
    // Set worker source with multiple fallback options
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        // Try CDN first
        const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log('[extractTextFromPDF] Worker source set to CDN:', workerUrl);
      } catch (workerError) {
        console.warn('[extractTextFromPDF] CDN worker failed, trying unpkg:', workerError);
        try {
          // Fallback to unpkg
          const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          console.log('[extractTextFromPDF] Worker source set to unpkg:', workerUrl);
        } catch (unpkgError) {
          console.error('[extractTextFromPDF] Both CDN and unpkg failed:', unpkgError);
          // Try jsdelivr alternative
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;
          console.log('[extractTextFromPDF] Using legacy worker');
        }
      }
    } else {
      console.log('[extractTextFromPDF] Worker already initialized:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF file...' });

    // Validate file size
    if (file.size === 0) {
      throw new Error('The PDF file is empty. Please select a valid PDF file.');
    }

    // Read file as array buffer with validation
    let arrayBuffer: ArrayBuffer;
    try {
      console.log('[extractTextFromPDF] Reading file as ArrayBuffer...');
      arrayBuffer = await file.arrayBuffer();
      console.log('[extractTextFromPDF] File read successfully, size:', arrayBuffer.byteLength, 'bytes');
      
      // Validate file size
      if (arrayBuffer.byteLength === 0) {
        throw new Error('The PDF file is empty. Please select a valid PDF file.');
      }
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error('The PDF file is too small to be valid. Please check the file.');
      }
    } catch (readError) {
      console.error('[extractTextFromPDF] Error reading file:', readError);
      throw new Error(`Failed to read PDF file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
    }

    // Validate PDF header (check first 8 bytes for PDF signature)
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 8));
    const headerString = String.fromCharCode(...headerBytes.slice(0, 4));
    
    if (headerString !== '%PDF') {
      // Check if it might be a different format
      const firstBytes = Array.from(headerBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.error('[extractTextFromPDF] Invalid PDF header. First 4 bytes (hex):', firstBytes);
      throw new Error('Invalid PDF file. The file does not appear to be a valid PDF document. Please ensure you selected a PDF file.');
    }
    
    // Check PDF version (should be 1.x)
    const versionBytes = headerBytes.slice(5, 8);
    const versionString = String.fromCharCode(...versionBytes);
    console.log('[extractTextFromPDF] PDF version:', versionString);

    onProgress?.({ progress: 15, status: 'processing', message: 'Parsing PDF document...' });

    // Load PDF document with better error handling and multiple attempts
    let pdfDoc;
    let loadError: any = null;
    
    // Try loading with different options
    // Convert ArrayBuffer to Uint8Array for better compatibility
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const loadAttempts = [
      { 
        data: uint8Array, // Try Uint8Array first
        verbosity: 0,
        stopAtErrors: false,
        useSystemFonts: true,
        disableFontFace: false,
      },
      { 
        data: arrayBuffer, // Fallback to ArrayBuffer
        verbosity: 0,
        stopAtErrors: false,
        useSystemFonts: true,
        disableFontFace: false,
      },
      { 
        data: uint8Array,
        verbosity: 0,
        stopAtErrors: false,
        useSystemFonts: false,
        disableFontFace: true,
      },
      { 
        data: arrayBuffer,
        verbosity: 0,
        stopAtErrors: true,
      }
    ];

    for (let attempt = 0; attempt < loadAttempts.length; attempt++) {
      try {
        console.log(`[extractTextFromPDF] Loading attempt ${attempt + 1}/${loadAttempts.length}`, {
          dataType: loadAttempts[attempt].data instanceof Uint8Array ? 'Uint8Array' : 'ArrayBuffer',
          dataLength: loadAttempts[attempt].data instanceof Uint8Array ? loadAttempts[attempt].data.length : (loadAttempts[attempt].data as ArrayBuffer).byteLength,
          options: {
            verbosity: loadAttempts[attempt].verbosity,
            stopAtErrors: loadAttempts[attempt].stopAtErrors,
            useSystemFonts: (loadAttempts[attempt] as any).useSystemFonts,
            disableFontFace: (loadAttempts[attempt] as any).disableFontFace,
          }
        });
        
        // Add timeout to prevent hanging
        const loadPromise = pdfjsLib.getDocument(loadAttempts[attempt]).promise;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout after 30 seconds')), 30000)
        );
        
        pdfDoc = await Promise.race([loadPromise, timeoutPromise]) as any;
        console.log(`[extractTextFromPDF] PDF loaded successfully on attempt ${attempt + 1}, pages: ${pdfDoc.numPages}`);
        break; // Success, exit loop
      } catch (error: any) {
        loadError = error;
        console.error(`[extractTextFromPDF] Load attempt ${attempt + 1} failed:`, {
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          fullError: error
        });
        
        // If this is the last attempt, throw the error
        if (attempt === loadAttempts.length - 1) {
          console.error('[extractTextFromPDF] All loading attempts failed. Final error:', loadError);
          
          // Provide more specific error messages
          if (loadError?.name === 'PasswordException' || loadError?.message?.includes('password') || loadError?.message?.toLowerCase().includes('password')) {
            throw new Error('This PDF is password-protected. Please unlock it first using the "Unlock PDF" tool.');
          } else if (loadError?.name === 'InvalidPDFException' || loadError?.message?.includes('Invalid PDF') || loadError?.message?.includes('invalid')) {
            throw new Error('The PDF file is corrupted or invalid. Please try a different PDF file.');
          } else if (loadError?.message?.includes('Missing PDF header') || loadError?.message?.includes('header')) {
            throw new Error('Invalid PDF file. The file does not appear to be a valid PDF document.');
          } else if (loadError?.message?.includes('worker') || loadError?.message?.includes('Worker') || loadError?.message?.includes('workerSrc')) {
            throw new Error('PDF worker failed to load. Please refresh the page and try again. If the problem persists, check your internet connection.');
          } else if (loadError?.message?.includes('timeout')) {
            throw new Error('PDF loading timed out. The file may be too large or corrupted. Please try a smaller PDF file.');
          } else {
            const errorMsg = loadError?.message || loadError?.toString() || 'Unknown error';
            throw new Error(`Failed to load PDF document: ${errorMsg}. Please ensure the file is a valid, non-corrupted PDF. If the problem persists, try a different PDF file.`);
          }
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (!pdfDoc) {
      throw new Error('Failed to load PDF after multiple attempts. The file may be corrupted or incompatible.');
    }

    const numPages = pdfDoc.numPages;
    
    if (numPages === 0) {
      throw new Error('The PDF file has no pages.');
    }

    let fullText = '';
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        progress: 20 + ((pageNum / numPages) * 70),
        status: 'processing',
        message: `Extracting text from page ${pageNum} of ${numPages}...`,
      });

      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      } catch (pageError) {
        console.warn(`[extractTextFromPDF] Error extracting text from page ${pageNum}:`, pageError);
        // Continue with other pages even if one page fails
        fullText += `[Page ${pageNum}: Text extraction failed]\n\n`;
      }
    }

    if (!fullText.trim()) {
      throw new Error('No text found in PDF. This PDF may be image-based (scanned or flattened). Please use the "Extract Text (OCR)" tool first to extract text from images.');
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Text extracted successfully' });

    return fullText.trim();
  } catch (error) {
    console.error('[extractTextFromPDF] Error:', error);
    onProgress?.({ 
      progress: 0, 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Failed to extract text from PDF' 
    });
    throw error;
  }
}

/**
 * Convert text to speech using browser's Web Speech API
 * Note: Browser TTS doesn't support saving to file directly
 * This function will play the audio and return a Blob with text content
 */
export async function textToSpeech(
  text: string,
  options: {
    language?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceName?: string;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Check if browser supports speech synthesis
      if (!('speechSynthesis' in window)) {
        throw new Error('Your browser does not support text-to-speech. Please use Chrome, Edge, Safari, or Firefox.');
      }

      onProgress?.({ progress: 20, status: 'processing', message: 'Preparing speech synthesis...' });

      const {
        language = 'en-US',
        rate = 1.0,
        pitch = 1.0,
        volume = 1.0,
        voiceName,
      } = options;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (voiceName) {
        selectedVoice = voices.find((v) => v.name === voiceName);
      } else {
        // Try to find a voice matching the language
        selectedVoice = voices.find((v) => v.lang.startsWith(language.split('-')[0]));
      }

      // If no voice found, use default
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }

      onProgress?.({ progress: 40, status: 'processing', message: 'Starting speech synthesis...' });

      // Split text into chunks (some browsers have limits)
      const maxChunkLength = 200; // Characters per chunk
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks: string[] = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkLength && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      let currentChunkIndex = 0;
      const totalChunks = chunks.length;

      const speakNextChunk = () => {
        if (currentChunkIndex >= totalChunks) {
          onProgress?.({ progress: 100, status: 'completed', message: 'Speech synthesis completed' });
          // Return text as blob (browser TTS doesn't support audio file export)
          const textBlob = new Blob([text], { type: 'text/plain' });
          resolve(textBlob);
          return;
        }

        const chunk = chunks[currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);

        utterance.lang = language;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
          currentChunkIndex++;
          const progress = 40 + ((currentChunkIndex / totalChunks) * 55);
          onProgress?.({
            progress,
            status: 'processing',
            message: `Speaking chunk ${currentChunkIndex} of ${totalChunks}...`,
          });
          speakNextChunk();
        };

        utterance.onerror = (event) => {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        window.speechSynthesis.speak(utterance);
      };

      // Wait for voices to load if needed
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          if (updatedVoices.length > 0) {
            if (voiceName) {
              selectedVoice = updatedVoices.find((v) => v.name === voiceName);
            } else {
              selectedVoice = updatedVoices.find((v) => v.lang.startsWith(language.split('-')[0]));
            }
            if (!selectedVoice && updatedVoices.length > 0) {
              selectedVoice = updatedVoices[0];
            }
            speakNextChunk();
          } else {
            reject(new Error('No voices available in your browser'));
          }
        };
      } else {
        speakNextChunk();
      }
    } catch (error) {
      onProgress?.({ progress: 0, status: 'error', message: 'Speech synthesis failed' });
      reject(error);
    }
  });
}

/**
 * Get available voices from browser
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Stop current speech synthesis
 */
export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Pause current speech synthesis
 */
export function pauseSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech synthesis
 */
export function resumeSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

