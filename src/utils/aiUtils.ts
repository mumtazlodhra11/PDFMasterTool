// Lazy import tesseract.js to avoid hydration errors in Astro
// tesseract.js uses WebAssembly and can cause issues during SSR/hydration
import type { ConversionProgress } from './pdfUtils';

// Lazy load OpenAI client only when needed (for AI features, not OCR)
async function getOpenAIClient() {
  const { default: OpenAI } = await import('openai');
  // In Astro, client-side env vars need PUBLIC_ prefix
  // Try both PUBLIC_OPENAI_API_KEY and OPENAI_API_KEY for compatibility
  const apiKey = import.meta.env.PUBLIC_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  
  console.log('[getOpenAIClient] Checking API key:', {
    hasPublicKey: !!import.meta.env.PUBLIC_OPENAI_API_KEY,
    hasRegularKey: !!import.meta.env.OPENAI_API_KEY,
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'none',
  });
  
  if (!apiKey) {
    const errorMsg = 'OpenAI API key is required for AI features. Please set PUBLIC_OPENAI_API_KEY in your .env file (for client-side) or use a server-side API endpoint.';
    console.error('[getOpenAIClient]', errorMsg);
    throw new Error(errorMsg);
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Only for client-side, consider moving to server
  });
}

/**
 * Perform OCR on image or PDF using Tesseract.js
 */
export async function performOCR(
  file: File,
  language: string = 'eng',
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  try {
    // Ensure we're on the client side (not during SSR/hydration)
    if (typeof window === 'undefined') {
      throw new Error('OCR can only be performed on the client side');
    }

    onProgress?.({ progress: 10, status: 'processing', message: 'Initializing OCR...' });

    // CRITICAL FIX: Wait for hydration to complete before loading tesseract
    // This prevents the "Cannot read properties of undefined (reading 'exports')" error
    // Wait for both DOM ready and a delay to ensure hydration is complete
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    // Additional delay to ensure React hydration is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Lazy import tesseract.js only when needed (client-side only)
    // Use Function constructor to prevent early evaluation during hydration
    const loadTesseract = new Function('return import("tesseract.js")');
    const tesseractModule = await loadTesseract().catch((error) => {
      console.error('[performOCR] Failed to load tesseract.js:', error);
      throw new Error('Failed to load OCR engine. Please refresh the page and try again.');
    });
    const { createWorker } = tesseractModule;
    
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
 * Convert scanned PDF or image to searchable PDF using OCR
 */
export async function createSearchablePDF(
  file: File,
  language: string = 'eng',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    // Ensure we're on the client side (not during SSR/hydration)
    if (typeof window === 'undefined') {
      throw new Error('OCR can only be performed on the client side');
    }

    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    onProgress?.({ progress: 5, status: 'processing', message: `Initializing OCR engine for ${language}...` });

    // CRITICAL FIX: Wait for hydration to complete before loading tesseract
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use Function constructor to prevent early evaluation during hydration
    const loadTesseract = new Function('return import("tesseract.js")');
    const tesseractModule = await loadTesseract().catch((error) => {
      console.error('[createSearchablePDF] Failed to load tesseract.js:', error);
      throw new Error('Failed to load OCR engine. Please refresh the page and try again.');
    });
    const { createWorker } = tesseractModule;
    
    // Initialize Tesseract worker with optimized settings for best accuracy
    // Note: Language parameter is for recognizing text IN that language, not translating TO it
    let worker;
    try {
      worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress will be updated per page
          }
        },
      });
      console.log(`[createSearchablePDF] Tesseract worker initialized with language: ${language}`);
    } catch (error) {
      console.error(`[createSearchablePDF] Failed to load language ${language}, falling back to English:`, error);
      // Fallback to English if language pack not available
      onProgress?.({ progress: 5, status: 'processing', message: `Language ${language} not available, using English...` });
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress will be updated per page
          }
        },
      });
    }
    
    // Configure OCR for maximum accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
      preserve_interword_spaces: '1', // Preserve spaces between words
      tessedit_char_whitelist: '', // Allow all characters
      classify_bln_numeric_mode: '0', // Better for mixed content
      textord_min_linesize: '2.5', // Better line detection
      textord_tabvector_vertical_gap_factor: '0.5', // Better table detection
      tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only (best quality)
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let totalPages = 1;
    let isPDF = false;

    // Check if file is PDF or image
    if (file.type === 'application/pdf') {
      isPDF = true;
      onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

      const arrayBuffer = await file.arrayBuffer();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      totalPages = pdfjsDoc.numPages;

      // Process each PDF page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const progressStart = 10 + ((pageNum - 1) / totalPages) * 80;
        const progressEnd = 10 + (pageNum / totalPages) * 80;

        onProgress?.({
          progress: progressStart,
          status: 'processing',
          message: `Processing page ${pageNum} of ${totalPages}...`,
        });

        const page = await pdfjsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.5 }); // Higher scale (3.5x) for much better OCR accuracy

        // Render page to canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');

        // Set canvas dimensions
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Improve image quality for OCR
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Image preprocessing for better OCR accuracy
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        
        // Enhance contrast and brightness for better OCR
        for (let i = 0; i < pixelData.length; i += 4) {
          // Convert to grayscale and enhance contrast
          const r = pixelData[i];
          const g = pixelData[i + 1];
          const b = pixelData[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Enhance contrast (stretch histogram)
          const contrast = 1.3; // Increase contrast for better text recognition
          const enhanced = ((gray - 128) * contrast) + 128;
          const clamped = Math.max(0, Math.min(255, enhanced));
          
          pixelData[i] = clamped;
          pixelData[i + 1] = clamped;
          pixelData[i + 2] = clamped;
        }
        
        context.putImageData(imageData, 0, 0);

        // Convert canvas to image blob with maximum quality
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          }, 'image/png', 1.0); // Maximum quality
        });

        // Perform OCR on the preprocessed page image
        onProgress?.({
          progress: progressStart + 5,
          status: 'processing',
          message: `Running advanced OCR on page ${pageNum}...`,
        });

        // Use recognize with better options
        let ocrResult;
        try {
          ocrResult = await worker.recognize(imageBlob, {
            rectangle: undefined, // Process entire image
          });
        } catch (ocrError) {
          console.error(`[createSearchablePDF] OCR error on page ${pageNum}:`, ocrError);
          // Continue to next page instead of failing completely
          continue;
        }
        
        const { data: { text, words, lines, paragraphs } } = ocrResult;
        
        // Clean and format OCR text for better quality
        let cleanedText = text || '';
        if (cleanedText) {
          cleanedText = cleanedText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\s+([.,;:!?])/g, '$1')
            .replace(/([.,;:!?])([^\s\n])/g, '$1 $2')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }

        // Get original page dimensions for proper scaling
        const originalPage = await pdfjsDoc.getPage(pageNum);
        const originalViewport = originalPage.getViewport({ scale: 1.0 });
        const scaleFactor = viewport.width / originalViewport.width;
        
        // Create PDF page with original dimensions
        const pdfPage = pdfDoc.addPage([originalViewport.width, originalViewport.height]);

        // Embed the original page image (without preprocessing for display)
        const originalViewportForImage = originalPage.getViewport({ scale: 2.0 });
        const imageCanvas = document.createElement('canvas');
        const imageContext = imageCanvas.getContext('2d');
        if (!imageContext) throw new Error('Failed to get canvas context');
        
        imageCanvas.width = Math.floor(originalViewportForImage.width);
        imageCanvas.height = Math.floor(originalViewportForImage.height);
        imageContext.imageSmoothingEnabled = true;
        imageContext.imageSmoothingQuality = 'high';
        
        await originalPage.render({
          canvasContext: imageContext,
          viewport: originalViewportForImage,
        }).promise;
        
        const imageBytes = await new Promise<ArrayBuffer>((resolve) => {
          imageCanvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(resolve);
            } else {
              throw new Error('Failed to convert canvas to blob');
            }
          }, 'image/png', 1.0);
        });
        
        const pdfImage = await pdfDoc.embedPng(imageBytes);
        pdfPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfPage.getWidth(),
          height: pdfPage.getHeight(),
        });

        // Add properly positioned searchable text layer using OCR word coordinates
        // Use cleaned text if available, otherwise use original text
        const finalText = cleanedText || text || '';
        if (finalText.trim() && words && words.length > 0) {
          // Use word-level positioning for accurate text placement
          for (const word of words) {
            if (word.confidence > 30 && word.text.trim()) { // Filter low-confidence words
              try {
                // Scale coordinates back to original page size
                const x = (word.bbox.x0 / scaleFactor);
                const y = pdfPage.getHeight() - (word.bbox.y1 / scaleFactor); // PDF coordinates are bottom-up
                const wordWidth = (word.bbox.x1 - word.bbox.x0) / scaleFactor;
                
                // Calculate font size based on word height
                const wordHeight = (word.bbox.y1 - word.bbox.y0) / scaleFactor;
                const fontSize = Math.max(8, Math.min(24, wordHeight * 0.9));
                
                // Ensure coordinates are within page bounds
                if (x >= 0 && x < pdfPage.getWidth() && y >= 0 && y < pdfPage.getHeight()) {
                  pdfPage.drawText(word.text, {
                    x: Math.max(0, Math.min(x, pdfPage.getWidth() - wordWidth)),
                    y: Math.max(fontSize, Math.min(y, pdfPage.getHeight() - fontSize)),
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                    opacity: 0, // Completely invisible but searchable
                  });
                }
              } catch (wordError) {
                // Skip words with positioning errors
                console.warn(`[createSearchablePDF] Error positioning word "${word.text}":`, wordError);
              }
            }
          }
          
          // Fallback: If word-level positioning didn't work, use line-based positioning
          if (words.length === 0 || !words.some(w => w.confidence > 30)) {
            const textLines = text.split('\n').filter(line => line.trim());
            const fontSize = 12;
            let yPos = pdfPage.getHeight() - 30;

            for (const line of textLines) {
              if (yPos < fontSize) break;
              pdfPage.drawText(line, {
                x: 10,
                y: yPos,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
                opacity: 0, // Completely invisible but searchable
              });
              yPos -= fontSize + 8;
            }
          }
        }

        onProgress?.({
          progress: progressEnd,
          status: 'processing',
          message: `Completed page ${pageNum} of ${totalPages}`,
        });
      }
    } else {
      // Handle image file with enhanced preprocessing
      onProgress?.({ progress: 20, status: 'processing', message: 'Preprocessing image for OCR...' });

      // Load and preprocess image for better OCR
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas for preprocessing
      const preprocessCanvas = document.createElement('canvas');
      const preprocessContext = preprocessCanvas.getContext('2d');
      if (!preprocessContext) throw new Error('Failed to get canvas context');

      // Use higher resolution for OCR (3x scale)
      const scale = 3.0;
      preprocessCanvas.width = img.width * scale;
      preprocessCanvas.height = img.height * scale;
      
      preprocessContext.imageSmoothingEnabled = true;
      preprocessContext.imageSmoothingQuality = 'high';
      preprocessContext.drawImage(img, 0, 0, preprocessCanvas.width, preprocessCanvas.height);

      // Enhance image for OCR
      const imageData = preprocessContext.getImageData(0, 0, preprocessCanvas.width, preprocessCanvas.height);
      const pixelData = imageData.data;
      
      // Enhance contrast and convert to grayscale for better OCR
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Enhance contrast
        const contrast = 1.3;
        const enhanced = ((gray - 128) * contrast) + 128;
        const clamped = Math.max(0, Math.min(255, enhanced));
        
        pixelData[i] = clamped;
        pixelData[i + 1] = clamped;
        pixelData[i + 2] = clamped;
      }
      
      preprocessContext.putImageData(imageData, 0, 0);
      
      // Convert to blob for OCR
      const preprocessedBlob = await new Promise<Blob>((resolve, reject) => {
        preprocessCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        }, 'image/png', 1.0);
      });

      onProgress?.({ progress: 30, status: 'processing', message: 'Running advanced OCR on image...' });

      // Perform OCR on preprocessed image
      const { data: { text, words } } = await worker.recognize(preprocessedBlob);
      
      URL.revokeObjectURL(imageUrl); // Clean up

      // Create PDF page with original image dimensions
      const imageBytes = await file.arrayBuffer();
      let pdfImage;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      }

      const pdfPage = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
      pdfPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      });

      // Add searchable text layer using word-level positioning
      if (text.trim() && words && words.length > 0) {
        const imageScale = scale; // OCR was done at 3x scale
        
        // Use word-level positioning for accurate placement
        for (const word of words) {
          if (word.confidence > 30 && word.text.trim()) {
            try {
              // Scale coordinates back to original image size
              const x = word.bbox.x0 / imageScale;
              const y = pdfPage.getHeight() - (word.bbox.y1 / imageScale); // PDF coordinates are bottom-up
              const wordHeight = (word.bbox.y1 - word.bbox.y0) / imageScale;
              const fontSize = Math.max(8, Math.min(24, wordHeight * 0.9));
              
              if (x >= 0 && x < pdfPage.getWidth() && y >= 0 && y < pdfPage.getHeight()) {
                pdfPage.drawText(word.text, {
                  x: Math.max(0, Math.min(x, pdfPage.getWidth() - 100)),
                  y: Math.max(fontSize, Math.min(y, pdfPage.getHeight() - fontSize)),
                  size: fontSize,
                  font: font,
                  color: rgb(0, 0, 0),
                  opacity: 0, // Completely invisible but searchable
                });
              }
            } catch (wordError) {
              console.warn(`[createSearchablePDF] Error positioning word:`, wordError);
            }
          }
        }
        
        // Fallback to line-based if word positioning failed
        if (words.length === 0 || !words.some(w => w.confidence > 30)) {
          const textLines = text.split('\n').filter(line => line.trim());
          const fontSize = 12;
          let yPos = pdfPage.getHeight() - 30;

          for (const line of textLines) {
            if (yPos < fontSize) break;
            pdfPage.drawText(line, {
              x: 10,
              y: yPos,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
              opacity: 0, // Completely invisible but searchable
            });
            yPos -= fontSize + 8;
          }
        }
      }
    }

    await worker.terminate();

    onProgress?.({ progress: 95, status: 'processing', message: 'Creating searchable PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    throw error;
  }
}

/**
 * Extract text from PDF using OCR (for scanned PDFs) or direct text extraction
 * Tries direct extraction first, falls back to OCR if no text found
 */
export async function extractTextFromPDFWithOCR(
  file: File,
  language: string = 'eng',
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  try {
    // Ensure we're on the client side (not during SSR/hydration)
    if (typeof window === 'undefined') {
      throw new Error('OCR can only be performed on the client side');
    }

    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDF...' });

    // Validate PDF file first
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if file is empty
    if (arrayBuffer.byteLength === 0) {
      throw new Error('The PDF file is empty. Please select a valid PDF file.');
    }
    
    // Check if file is too small (likely corrupted)
    if (arrayBuffer.byteLength < 100) {
      throw new Error('The PDF file is too small and may be corrupted. Please check the file and try again.');
    }
    
    // Check PDF header
    const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const header = String.fromCharCode(...firstBytes);
    if (!header.startsWith('%PDF')) {
      throw new Error('Invalid PDF file. The file does not appear to be a valid PDF document. Please check the file and try again.');
    }
    
    // Try multiple worker sources for better compatibility
    const pdfjsLib = await import('pdfjs-dist');
    
    // Try to set worker source with fallback
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      } catch (workerError) {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        } catch (unpkgError) {
          // Fallback to legacy worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.js`;
        }
      }
    }

    // Try loading PDF with multiple attempts and better error handling
    let pdfDoc;
    const loadAttempts = [
      { data: arrayBuffer },
      { data: arrayBuffer, password: '' }, // Try without password
      { data: arrayBuffer, disableAutoFetch: true },
      { data: arrayBuffer, verbosity: 0 }, // Reduce logging
    ];
    
    let loadError: Error | null = null;
    for (let attempt = 0; attempt < loadAttempts.length; attempt++) {
      try {
        onProgress?.({
          progress: 5 + (attempt * 2),
          status: 'processing',
          message: `Loading PDF... (attempt ${attempt + 1}/${loadAttempts.length})`,
        });
        
        // Wrap getDocument promise in a timeout to catch hanging loads
        const loadPromise = pdfjsLib.getDocument(loadAttempts[attempt]).promise;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout after 30 seconds')), 30000);
        });
        
        pdfDoc = await Promise.race([loadPromise, timeoutPromise]) as any;
        
        if (pdfDoc && pdfDoc.numPages !== undefined) {
          console.log(`[extractTextFromPDFWithOCR] PDF loaded successfully on attempt ${attempt + 1}, pages: ${pdfDoc.numPages}`);
          break;
        } else {
          throw new Error('PDF document loaded but invalid (no pages)');
        }
      } catch (error: any) {
        loadError = error;
        const errorMsg = error?.message || String(error) || 'Unknown error';
        console.warn(`[extractTextFromPDFWithOCR] Load attempt ${attempt + 1} failed:`, {
          name: error?.name,
          message: errorMsg,
          error: error,
        });
        
        // Check if it's a password-protected PDF
        if (error?.name === 'PasswordException' || errorMsg?.toLowerCase().includes('password') || errorMsg?.toLowerCase().includes('encrypted')) {
          throw new Error('This PDF is password protected. Please unlock the PDF first using the "Unlock PDF" tool, then try again.');
        }
        
        // Check if PDF is corrupted or invalid
        if (error?.name === 'InvalidPDFException' || 
            error?.name === 'UnexpectedResponseException' ||
            errorMsg?.toLowerCase().includes('invalid pdf') || 
            errorMsg?.toLowerCase().includes('corrupted') ||
            errorMsg?.toLowerCase().includes('document load failed') ||
            errorMsg?.toLowerCase().includes('cannot read')) {
          if (attempt === loadAttempts.length - 1) {
            throw new Error('The PDF file appears to be corrupted or invalid. Please try repairing it first using the "Repair PDF" tool, or use a different PDF file.');
          }
          // Continue to next attempt
          continue;
        }
        
        // Check for timeout
        if (errorMsg?.includes('timeout')) {
          throw new Error('PDF loading timed out. The file may be too large or corrupted. Please try a smaller file or repair the PDF first.');
        }
        
        // For other errors, continue to next attempt if not last
        if (attempt < loadAttempts.length - 1) {
          continue;
        }
        
        // Last attempt failed - provide helpful error message
        throw new Error(`Failed to load PDF: ${errorMsg}. The PDF may be corrupted, password protected, or in an unsupported format. Please try a different PDF file.`);
      }
    }
    
    if (!pdfDoc) {
      const finalError = loadError || new Error('Failed to load PDF document');
      throw new Error(`Failed to load PDF: ${finalError.message}. Please check if the file is a valid, uncorrupted PDF.`);
    }
    
    const numPages = pdfDoc.numPages;
    
    if (numPages === 0) {
      throw new Error('The PDF has no pages. Please use a valid PDF file with content.');
    }

    let fullText = '';
    let hasText = false;

    // First, try to extract text directly from PDF with better formatting
    onProgress?.({ progress: 10, status: 'processing', message: 'Extracting text from PDF...' });
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        progress: 10 + ((pageNum / numPages) * 30),
        status: 'processing',
        message: `Extracting text from page ${pageNum} of ${numPages}...`,
      });

      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Better text extraction with formatting preservation
        // Group text items by lines based on Y position
        const items = textContent.items as any[];
        const lines: { y: number; items: Array<{ x: number; text: string; width: number }> }[] = [];
        const lineTolerance = 3; // pixels tolerance for grouping into same line
        
        for (const item of items) {
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const x = transform[4];
          const y = transform[5];
          const text = item.str || '';
          const width = item.width || 0;
          
          if (!text.trim()) continue;
          
          // Find existing line with similar Y position
          let foundLine = false;
          for (const line of lines) {
            if (Math.abs(line.y - y) <= lineTolerance) {
              line.items.push({ x, text, width });
              foundLine = true;
              break;
            }
          }
          
          // Create new line if not found
          if (!foundLine) {
            lines.push({ y, items: [{ x, text, width }] });
          }
        }
        
        // Sort lines by Y position (top to bottom, PDF coordinates are bottom-up)
        lines.sort((a, b) => b.y - a.y);
        
        // Build text from lines with better paragraph detection
        let pageText = '';
        let lastLineY = -1;
        const paragraphGapThreshold = 15; // pixels - gap between paragraphs
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Sort items in line by X position (left to right)
          line.items.sort((a, b) => a.x - b.x);
          
          let lineText = '';
          let lastEndX = -1;
          
          for (const item of line.items) {
            // Add space if there's a gap between items
            if (lastEndX !== -1 && item.x - lastEndX > 5) {
              lineText += ' ';
            }
            lineText += item.text;
            lastEndX = item.x + item.width;
          }
          
          if (lineText.trim()) {
            // Detect paragraph breaks (larger gap between lines)
            if (lastLineY !== -1 && lastLineY - line.y > paragraphGapThreshold) {
              pageText += '\n'; // Add extra line break for paragraph
            }
            pageText += lineText.trim() + '\n';
            lastLineY = line.y;
          }
        }
        
        if (pageText.trim()) {
          hasText = true;
          
          // Professional formatting for direct text extraction
          let formattedPageText = pageText.trim()
            // Normalize line endings
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Fix spacing
            .replace(/[ \t]+/g, ' ') // Multiple spaces -> single space
            .replace(/\s+([.,;:!?])/g, '$1') // Remove space before punctuation
            .replace(/([.,;:!?])([^\s\n])/g, '$1 $2') // Add space after punctuation
            // Clean up line breaks
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive breaks
            .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces
            .replace(/\n[ \t]+/g, '\n') // Remove leading spaces
            // Fix word boundaries
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between case changes
            // Clean numbers
            .replace(/(\d)\s+(\d)/g, '$1$2') // Remove spaces in numbers
            .trim();
          
          // Add properly formatted page separator
          if (numPages > 1) {
            fullText += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            fullText += `Page ${pageNum} of ${numPages}\n`;
            fullText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          }
          
          fullText += formattedPageText;
          if (pageNum < numPages) {
            fullText += '\n\n'; // Space between pages
          }
        }
      } catch (error) {
        console.warn(`Failed to extract text from page ${pageNum}:`, error);
      }
    }

    // If we found text, check if we should enhance with OCR for better quality
    if (hasText && fullText.trim()) {
      // Check if extracted text seems incomplete (very short or mostly whitespace)
      const textRatio = fullText.replace(/\s/g, '').length / fullText.length;
      if (textRatio < 0.3) {
        // Text seems sparse, might benefit from OCR enhancement
        onProgress?.({ progress: 35, status: 'processing', message: 'Text layer found but sparse. Enhancing with OCR...' });
        // Continue to OCR section for enhancement
      } else {
        // Text extraction looks good, apply final formatting and return
        let formattedText = fullText.trim()
          .replace(/\n{4,}/g, '\n\n') // Max 2 consecutive breaks
          .replace(/[ \t]+/g, ' ') // Normalize spaces
          .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces
          .replace(/\n[ \t]+/g, '\n'); // Remove leading spaces
        
        // Add document header if multiple pages
        if (numPages > 1) {
          const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          const title = `EXTRACTED TEXT FROM PDF\n`;
          const info = `Total Pages: ${numPages}\nExtracted: ${new Date().toLocaleString()}\n`;
          const separator = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          formattedText = header + title + info + separator + formattedText;
        }
        
        onProgress?.({ progress: 100, status: 'completed', message: 'Text extracted and formatted successfully' });
        return formattedText;
      }
    }

    // No text found, use OCR
    onProgress?.({ progress: 40, status: 'processing', message: 'No text layer found. Using OCR...' });

    // CRITICAL FIX: Wait for hydration to complete before loading tesseract
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use Function constructor to prevent early evaluation during hydration
    const loadTesseract = new Function('return import("tesseract.js")');
    const tesseractModule = await loadTesseract().catch((error) => {
      console.error('[extractTextFromPDFWithOCR] Failed to load tesseract.js:', error);
      throw new Error('Failed to load OCR engine. Please refresh the page and try again.');
    });
    const { createWorker } = tesseractModule;
    
    // Initialize Tesseract worker with better settings
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Progress will be updated per page
        }
      },
    });
    
    // Set OCR parameters for better accuracy and layout preservation
    await worker.setParameters({
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
      preserve_interword_spaces: '1', // Preserve spaces between words
      tessedit_char_whitelist: '', // Allow all characters (empty = no restriction)
      classify_bln_numeric_mode: '0', // Better for mixed content
      textord_min_linesize: '2.5', // Better line detection
      textord_tabvector_vertical_gap_factor: '0.5', // Better table detection
    });

    fullText = '';

    // Process each page with OCR
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const progressStart = 40 + ((pageNum - 1) / numPages) * 55;
      const progressEnd = 40 + (pageNum / numPages) * 55;

      onProgress?.({
        progress: progressStart,
        status: 'processing',
        message: `Running OCR on page ${pageNum} of ${numPages}...`,
      });

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.0 }); // Higher scale (3x) for better OCR accuracy

        // Render page to canvas with better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');

        // Set canvas dimensions
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Improve image quality for OCR
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Image preprocessing for better OCR accuracy
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        
        // Enhance contrast and brightness for better OCR
        for (let i = 0; i < pixelData.length; i += 4) {
          // Convert to grayscale if needed and enhance contrast
          const r = pixelData[i];
          const g = pixelData[i + 1];
          const b = pixelData[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Enhance contrast (stretch histogram)
          const contrast = 1.2; // Increase contrast
          const enhanced = ((gray - 128) * contrast) + 128;
          const clamped = Math.max(0, Math.min(255, enhanced));
          
          pixelData[i] = clamped;
          pixelData[i + 1] = clamped;
          pixelData[i + 2] = clamped;
        }
        
        context.putImageData(imageData, 0, 0);

        // Convert canvas to image blob with better quality
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          }, 'image/png', 1.0); // Maximum quality
        });

        // Perform OCR on the page image with layout preservation
        onProgress?.({
          progress: progressStart + 5,
          status: 'processing',
          message: `Running OCR on page ${pageNum}...`,
        });

        const { data } = await worker.recognize(imageBlob, {
          rectangle: undefined, // Process entire image
        });
        
        // Use the text with better formatting
        let pageText = data.text || '';
        
        // Filter low-confidence words if confidence data is available
        if (data.words && data.words.length > 0) {
          const highConfidenceWords: string[] = [];
          for (const word of data.words) {
            // Include words with confidence > 30 (Tesseract confidence is 0-100)
            if (word.confidence > 30) {
              highConfidenceWords.push(word.text);
            }
          }
          // If we have high-confidence words, use them; otherwise use full text
          if (highConfidenceWords.length > 0 && highConfidenceWords.length > data.words.length * 0.5) {
            // Reconstruct text from high-confidence words (simplified)
            // For better results, we'll use the full text but note low confidence areas
            pageText = data.text;
          }
        }
        
        // PROFESSIONAL TEXT FORMATTING - Ready to use directly
        // Clean and format text for immediate use (no manual formatting needed)
        pageText = pageText
          // Step 1: Normalize line endings
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          
          // Step 2: Fix common OCR spacing issues
          .replace(/[ \t]+/g, ' ') // Normalize multiple spaces/tabs to single space
          .replace(/\s+([.,;:!?])/g, '$1') // Remove spaces before punctuation
          .replace(/([.,;:!?])([^\s])/g, '$1 $2') // Add space after punctuation
          
          // Step 3: Fix line breaks and paragraph structure
          .replace(/\n{4,}/g, '\n\n') // Limit excessive paragraph breaks (max 2)
          .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces from lines
          .replace(/\n[ \t]+/g, '\n') // Remove leading spaces from lines
          
          // Step 4: Smart paragraph detection
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n')
          
          // Step 5: Detect and preserve paragraphs (lines ending without punctuation likely continue)
          .split('\n')
          .map((line, index, arr) => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // If line doesn't end with sentence-ending punctuation and next line starts with lowercase,
            // it's likely a continuation - join them
            const nextLine = arr[index + 1]?.trim();
            if (nextLine && 
                !/[.!?]$/.test(trimmed) && 
                /^[a-z]/.test(nextLine) &&
                trimmed.length < 80) { // Short lines are more likely continuations
              return trimmed + ' ';
            }
            
            return trimmed;
          })
          .join('\n')
          .replace(/ +\n/g, '\n') // Clean up any remaining trailing spaces
          
          // Step 6: Fix word boundaries
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
          
          // Step 7: Improve number formatting
          .replace(/(\d)\s+(\d)/g, '$1$2') // Remove spaces in numbers (e.g., "1 234" -> "1234")
          .replace(/(\d)\s*([a-zA-Z])/g, '$1 $2') // Add space between number and letter
          
          // Step 8: Fix common OCR character errors
          .replace(/[|]/g, 'l') // | -> l
          .replace(/\b0+([a-zA-Z])/g, 'O$1') // Leading zero before letter -> O
          
          // Step 9: Clean up final formatting
          .replace(/\n{3,}/g, '\n\n') // Final cleanup of excessive breaks
          .trim();
        
        // Step 10: Add proper page separation
        if (pageText) {
          if (numPages > 1) {
            fullText += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            fullText += `Page ${pageNum} of ${numPages}\n`;
            fullText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          }
          fullText += pageText;
          if (pageNum < numPages) {
            fullText += '\n\n'; // Space between pages
          }
        }

        onProgress?.({
          progress: progressEnd,
          status: 'processing',
          message: `Completed OCR on page ${pageNum} of ${numPages}`,
        });
      } catch (error) {
        console.error(`Error processing page ${pageNum} with OCR:`, error);
        fullText += `--- Page ${pageNum} ---\n[Error: Could not extract text from this page]\n\n`;
      }
    }

    await worker.terminate();

    if (!fullText.trim()) {
      throw new Error('No text could be extracted from the PDF. The PDF may be empty or corrupted.');
    }

    // Final formatting - clean up the entire document for best readability
    let finalText = fullText
      .trim()
      // Ensure consistent spacing
      .replace(/\n{4,}/g, '\n\n') // Max 2 consecutive line breaks
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces
      .replace(/\n[ \t]+/g, '\n') // Remove leading spaces
      // Fix punctuation spacing
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.,;:!?])([^\s\n])/g, '$1 $2')
      // Clean up page separators
      .replace(/\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n/g, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      .trim();

    // Add document header if multiple pages
    if (numPages > 1) {
      const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      const title = `EXTRACTED TEXT FROM PDF\n`;
      const info = `Total Pages: ${numPages}\nExtracted: ${new Date().toLocaleString()}\n`;
      const separator = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      finalText = header + title + info + separator + finalText;
    }

    onProgress?.({ progress: 100, status: 'completed', message: 'Text extraction completed and formatted' });

    return finalText;
  } catch (error) {
    console.error('[extractTextFromPDFWithOCR] Error:', error);
    
    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for specific error types
    if (errorMessage.includes('password') || errorMessage.includes('Password') || errorMessage.includes('PasswordException')) {
      onProgress?.({ 
        progress: 0, 
        status: 'error', 
        message: 'This PDF is password protected. Please unlock it first using the "Unlock PDF" tool.' 
      });
      throw new Error('PDF is password protected. Please unlock it first using the "Unlock PDF" tool, then try extracting text again.');
    }
    
    if (errorMessage.includes('corrupted') || errorMessage.includes('Invalid PDF') || errorMessage.includes('InvalidPDFException') || errorMessage.includes('corrupted')) {
      onProgress?.({ 
        progress: 0, 
        status: 'error', 
        message: 'The PDF file appears to be corrupted. Please try repairing it first.' 
      });
      throw new Error('The PDF file is corrupted or invalid. Please use the "Repair PDF" tool first, or try a different PDF file.');
    }
    
    if (errorMessage.includes('empty') || errorMessage.includes('too small')) {
      onProgress?.({ 
        progress: 0, 
        status: 'error', 
        message: errorMessage 
      });
      throw error;
    }
    
    // Generic error with helpful message
    onProgress?.({ 
      progress: 0, 
      status: 'error', 
      message: `Failed to extract text: ${errorMessage}` 
    });
    
    throw new Error(`Failed to extract text from PDF: ${errorMessage}. Please ensure the PDF is valid and not corrupted or password protected.`);
  }
}

/**
 * Summarize PDF text using AI (with fallback to simple text extraction)
 */
export async function summarizeText(
  text: string,
  options: {
    maxLength?: number;
    format?: 'bullet' | 'paragraph';
    useAI?: boolean;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  const { maxLength = 500, format = 'bullet', useAI = true } = options;

  try {
    onProgress?.({ progress: 20, status: 'processing', message: 'Analyzing document...' });

    // Try AI generation if enabled
    if (useAI) {
      try {
        const prompt = format === 'bullet'
          ? `Summarize the following text in bullet points (maximum ${maxLength} words):\n\n${text.substring(0, 8000)}`
          : `Provide a concise summary of the following text (maximum ${maxLength} words):\n\n${text.substring(0, 8000)}`;

        onProgress?.({ progress: 50, status: 'processing', message: 'Generating summary with AI...' });

        const openai = await getOpenAIClient();
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
      } catch (aiError) {
        console.warn('AI summarization failed, using fallback method:', aiError);
        // Fall through to fallback method
      }
    }

    // Fallback: Simple text summarization
    onProgress?.({ progress: 50, status: 'processing', message: 'Generating summary (simple method)...' });
    return generateSimpleSummary(text, maxLength, format);
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Summarization failed' });
    throw error;
  }
}

/**
 * Simple text summarization (fallback method)
 */
function generateSimpleSummary(text: string, maxLength: number, format: 'bullet' | 'paragraph'): string {
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length === 0) {
    return 'No meaningful content found to summarize.';
  }

  // Extract key sentences (first, middle, last)
  const keySentences: string[] = [];
  if (sentences.length >= 1) keySentences.push(sentences[0]); // First sentence
  if (sentences.length >= 3) keySentences.push(sentences[Math.floor(sentences.length / 2)]); // Middle
  if (sentences.length >= 2) keySentences.push(sentences[sentences.length - 1]); // Last

  // Limit to maxLength words
  let summary = keySentences.join(format === 'bullet' ? '\n• ' : ' ');
  const words = summary.split(/\s+/);
  if (words.length > maxLength) {
    summary = words.slice(0, maxLength).join(' ') + '...';
  }

  if (format === 'bullet') {
    return '• ' + summary.replace(/\n/g, '\n• ');
  }

  return summary;
}

/**
 * Translate PDF text using AI (with fallback message)
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  options: {
    useAI?: boolean;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
  const { useAI = true } = options;

  console.log('[translateText] Starting translation:', {
    targetLanguage,
    textLength: text.length,
    textPreview: text.substring(0, 100),
    useAI,
  });

  try {
    onProgress?.({ progress: 20, status: 'processing', message: 'Preparing translation...' });

    // Try AI translation if enabled
    if (useAI) {
      try {
        // Use full text, not just first 8000 characters
        const prompt = `Translate the following text to ${targetLanguage}. Maintain the original formatting and structure. Return only the translated text without any additional explanations:\n\n${text}`;

        console.log('[translateText] Calling OpenAI API...');
        onProgress?.({ progress: 50, status: 'processing', message: 'Translating with AI...' });

        const openai = await getOpenAIClient();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the user's text to ${targetLanguage} accurately while preserving formatting, structure, and context. Return only the translated text without any explanations or additional text.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        });

        const translatedText = response.choices[0]?.message?.content || '';
        
        console.log('[translateText] Translation completed:', {
          originalLength: text.length,
          translatedLength: translatedText.length,
          translatedPreview: translatedText.substring(0, 100),
        });

        if (!translatedText || translatedText.trim().length === 0) {
          throw new Error('Translation returned empty result');
        }

        onProgress?.({ progress: 100, status: 'completed' });
        return translatedText.trim();
      } catch (aiError) {
        console.error('[translateText] AI translation failed:', aiError);
        const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
        
        // Check if it's an API key error
        if (errorMessage.includes('API key') || errorMessage.includes('OPENAI') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          throw new Error('Translation requires OpenAI API key. Please set OPENAI_API_KEY environment variable.');
        }
        
        // Re-throw the error
        throw aiError;
      }
    }

    // Fallback: Return message that AI translation is required
    throw new Error('Translation requires OpenAI API key. Please set OPENAI_API_KEY environment variable or use a translation service.');
  } catch (error) {
    console.error('[translateText] Translation error:', error);
    onProgress?.({ progress: 0, status: 'error', message: error instanceof Error ? error.message : 'Translation failed' });
    throw error;
  }
}

/**
 * AI-powered smart PDF compression suggestions (with fallback)
 */
export async function getSmartCompressionAdvice(
  fileSize: number,
  pageCount: number,
  hasImages: boolean,
  options: {
    useAI?: boolean;
  } = {}
): Promise<{
  recommendedQuality: number;
  estimatedSize: string;
  suggestions: string[];
}> {
  const { useAI = true } = options;

  // Try AI if enabled
  if (useAI) {
    try {
      const prompt = `Given a PDF file with:
- Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB
- Page count: ${pageCount}
- Has images: ${hasImages ? 'Yes' : 'No'}

Provide compression recommendations in JSON format with:
1. recommendedQuality (0-100)
2. estimatedSize (in MB)
3. suggestions (array of strings)`;

      const openai = await getOpenAIClient();
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
    } catch (aiError) {
      console.warn('AI compression advice failed, using fallback:', aiError);
      // Fall through to fallback
    }
  }

  // Fallback: Simple rule-based recommendations
  return generateSimpleCompressionAdvice(fileSize, pageCount, hasImages);
}

/**
 * Simple compression advice (fallback method)
 */
function generateSimpleCompressionAdvice(
  fileSize: number,
  pageCount: number,
  hasImages: boolean
): {
  recommendedQuality: number;
  estimatedSize: string;
  suggestions: string[];
} {
  const sizeMB = fileSize / 1024 / 1024;
  const avgSizePerPage = sizeMB / pageCount;

  let recommendedQuality = 85;
  let suggestions: string[] = [];

  if (sizeMB > 10) {
    recommendedQuality = 70;
    suggestions.push('File is large. Use higher compression (70% quality)');
  } else if (sizeMB > 5) {
    recommendedQuality = 80;
    suggestions.push('File is medium-sized. Use moderate compression (80% quality)');
  } else {
    recommendedQuality = 90;
    suggestions.push('File is small. Use light compression (90% quality) to maintain quality');
  }

  if (hasImages) {
    suggestions.push('Document contains images. Image compression will be applied');
  }

  if (avgSizePerPage > 1) {
    suggestions.push('High size per page detected. Consider reducing image quality');
  }

  const estimatedSize = (sizeMB * (recommendedQuality / 100)).toFixed(2);

  return {
    recommendedQuality,
    estimatedSize: `${estimatedSize} MB`,
    suggestions,
  };
}

/**
 * Extract key information from PDF using AI (with fallback)
 */
export async function extractKeyInfo(
  text: string,
  options: {
    useAI?: boolean;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<{
  title?: string;
  author?: string;
  keyPoints: string[];
  topics: string[];
}> {
  const { useAI = true } = options;

  try {
    onProgress?.({ progress: 30, status: 'processing', message: 'Analyzing content...' });

    // Try AI extraction if enabled
    if (useAI) {
      try {
        const prompt = `Analyze this document and extract:
1. Document title (if identifiable)
2. Author (if mentioned)
3. Key points (top 5)
4. Main topics (top 3)

Document text:
${text.substring(0, 5000)}

Respond in JSON format.`;

        onProgress?.({ progress: 70, status: 'processing', message: 'Extracting information with AI...' });

        const openai = await getOpenAIClient();
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
      } catch (aiError) {
        console.warn('AI extraction failed, using fallback method:', aiError);
        // Fall through to fallback
      }
    }

    // Fallback: Simple text analysis
    onProgress?.({ progress: 70, status: 'processing', message: 'Extracting information (simple method)...' });
    return extractSimpleKeyInfo(text);
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Analysis failed' });
    throw error;
  }
}

/**
 * Simple key information extraction (fallback method)
 */
function extractSimpleKeyInfo(text: string): {
  title?: string;
  author?: string;
  keyPoints: string[];
  topics: string[];
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Try to find title (usually first line or line with "Title:")
  let title: string | undefined;
  for (const line of lines.slice(0, 10)) {
    if (line.length > 10 && line.length < 100 && !line.includes(':')) {
      title = line;
      break;
    }
    if (line.toLowerCase().includes('title:')) {
      title = line.replace(/title:/i, '').trim();
      break;
    }
  }

  // Try to find author
  let author: string | undefined;
  for (const line of lines.slice(0, 20)) {
    if (line.toLowerCase().includes('author:') || line.toLowerCase().includes('by:')) {
      author = line.replace(/author:|by:/i, '').trim();
      break;
    }
  }

  // Extract key points (first few sentences)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 200)
    .slice(0, 5);

  // Extract topics (common words)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (!['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  const topics = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return {
    title: title || undefined,
    author: author || undefined,
    keyPoints: sentences,
    topics: topics.length > 0 ? topics : ['General', 'Document', 'Content'],
  };
}

/**
 * Generate quiz questions from PDF content
 */
export async function generateQuizFromPDF(
  file: File,
  options: {
    numQuestions?: number;
    questionTypes?: ('mcq' | 'truefalse' | 'fillblank')[];
    useAI?: boolean;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const { numQuestions = 10, questionTypes = ['mcq', 'truefalse'], useAI = true } = options;

    onProgress?.({ progress: 5, status: 'processing', message: 'Extracting text from PDF...' });

    // Extract text from PDF
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;

    let fullText = '';
    // Process pages in batches to avoid blocking the main thread
    const batchSize = 5;
    for (let pageNum = 1; pageNum <= numPages; pageNum += batchSize) {
      const batchEnd = Math.min(pageNum + batchSize - 1, numPages);
      onProgress?.({
        progress: 5 + ((pageNum / numPages) * 20),
        status: 'processing',
        message: `Extracting text from pages ${pageNum}-${batchEnd} of ${numPages}...`,
      });

      // Process batch
      const batchPromises = [];
      for (let p = pageNum; p <= batchEnd; p++) {
        batchPromises.push(
          pdfDoc.getPage(p).then(async (page) => {
            const textContent = await page.getTextContent();
            return textContent.items.map((item: any) => item.str).join(' ');
          })
        );
      }
      
      const batchTexts = await Promise.all(batchPromises);
      fullText += batchTexts.join('\n\n') + '\n\n';
      
      // Yield to browser to prevent long tasks
      if (pageNum + batchSize <= numPages) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (!fullText.trim()) {
      throw new Error('No text found in PDF. Please use a PDF with extractable text or use OCR first.');
    }

    onProgress?.({ progress: 30, status: 'processing', message: 'Generating quiz questions...' });

    let quizData: any;

    // Try AI generation if enabled and API key available
    if (useAI) {
      try {
        const openai = await getOpenAIClient();
        quizData = await generateQuizWithAI(fullText, numQuestions, questionTypes, openai, onProgress);
      } catch (aiError) {
        // AI not available - use fallback (this is expected if no API key)
        console.log('Using simple quiz generation (AI not available)');
        onProgress?.({ progress: 40, status: 'processing', message: 'Generating quiz questions (simple method)...' });
        // Fallback to simple text-based generation
        quizData = generateQuizFromText(fullText, numQuestions, questionTypes);
      }
    } else {
      // Use simple text-based generation
      onProgress?.({ progress: 40, status: 'processing', message: 'Generating quiz questions...' });
      quizData = generateQuizFromText(fullText, numQuestions, questionTypes);
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Creating quiz file...' });

    // Create JSON blob
    const jsonString = JSON.stringify(quizData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: `Quiz generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    throw error;
  }
}

/**
 * Generate quiz using AI (OpenAI)
 */
async function generateQuizWithAI(
  text: string,
  numQuestions: number,
  questionTypes: string[],
  openai: any,
  onProgress?: (progress: ConversionProgress) => void
): Promise<any> {
  onProgress?.({ progress: 40, status: 'processing', message: 'AI is generating quiz questions...' });

  // Limit text length for API
  const maxTextLength = 8000;
  const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) + '...' : text;

  const questionTypesStr = questionTypes.join(', ');
  const prompt = `Generate a quiz from the following PDF content. Create exactly ${numQuestions} questions.

Question types to include: ${questionTypesStr}

For each question type:
- MCQ: Provide 4 options (A, B, C, D) with one correct answer
- True/False: Provide statement and correct answer (true/false)
- Fill in the blank: Provide sentence with blank and correct answer

PDF Content:
${truncatedText}

Return a JSON object with this structure:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "questions": [
    {
      "type": "mcq" | "truefalse" | "fillblank",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"] (for MCQ only),
      "correctAnswer": "Correct answer",
      "explanation": "Brief explanation"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert quiz generator. Create educational, accurate quiz questions from document content. Always return valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  
  // Validate and structure the result
  return {
    title: result.title || 'PDF Quiz',
    description: result.description || 'Quiz generated from PDF content',
    totalQuestions: result.questions?.length || 0,
    questions: result.questions || [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate quiz using simple text analysis (fallback)
 */
function generateQuizFromText(
  text: string,
  numQuestions: number,
  questionTypes: string[]
): any {
  // Split text into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200); // Filter reasonable sentence lengths

  if (sentences.length === 0) {
    throw new Error('Could not extract meaningful sentences from PDF');
  }

  const questions: any[] = [];
  const usedSentences = new Set<number>();

  // Generate questions
  for (let i = 0; i < numQuestions && i < sentences.length * 2; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const sentenceIndex = Math.floor(Math.random() * sentences.length);
    
    if (usedSentences.has(sentenceIndex)) continue;
    usedSentences.add(sentenceIndex);

    const sentence = sentences[sentenceIndex];

    if (questionType === 'mcq' && sentence.length > 30) {
      // Create MCQ from sentence
      const words = sentence.split(/\s+/);
      if (words.length > 5) {
        const keyWord = words[Math.floor(words.length / 2)];
        const question = sentence.replace(keyWord, '______');
        const options = [
          keyWord,
          words[Math.max(0, Math.floor(words.length / 2) - 1)],
          words[Math.min(words.length - 1, Math.floor(words.length / 2) + 1)],
          words[Math.floor(words.length / 4)],
        ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

        questions.push({
          type: 'mcq',
          question: question,
          options: options.slice(0, 4),
          correctAnswer: keyWord,
          explanation: `The correct answer is "${keyWord}" based on the context.`,
        });
      }
    } else if (questionType === 'truefalse' && sentence.length > 20) {
      // Create True/False question
      const isTrue = Math.random() > 0.5;
      let question = sentence;
      
      if (!isTrue) {
        // Make it false by negating or changing a key word
        question = sentence.replace(/\b(is|are|was|were|has|have|can|cannot|will|won't)\b/gi, (match) => {
          const negations: { [key: string]: string } = {
            'is': 'is not',
            'are': 'are not',
            'was': 'was not',
            'were': 'were not',
            'has': 'has not',
            'have': 'have not',
            'can': 'cannot',
            'will': 'will not',
          };
          return negations[match.toLowerCase()] || match;
        });
      }

      questions.push({
        type: 'truefalse',
        question: question,
        correctAnswer: isTrue ? 'true' : 'false',
        explanation: isTrue ? 'This statement is true according to the document.' : 'This statement is false. The correct version is: ' + sentence,
      });
    } else if (questionType === 'fillblank' && sentence.length > 25) {
      // Create fill in the blank
      const words = sentence.split(/\s+/);
      if (words.length > 4) {
        const blankIndex = Math.floor(words.length / 2);
        const answer = words[blankIndex];
        const question = words.map((w, i) => i === blankIndex ? '______' : w).join(' ');

        questions.push({
          type: 'fillblank',
          question: question,
          correctAnswer: answer,
          explanation: `The blank should be filled with "${answer}".`,
        });
      }
    }
  }

  return {
    title: 'PDF Quiz',
    description: 'Quiz generated from PDF content',
    totalQuestions: questions.length,
    questions: questions,
    generatedAt: new Date().toISOString(),
  };
}
















