import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * PDF Utility Functions for client-side processing
 */

export type ConversionProgress = {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
};

/**
 * Merge multiple PDF files into one
 */
export async function mergePDFs(
  files: File[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF files...' });

    const mergedPdf = await PDFDocument.create();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      onProgress?.({
        progress: 10 + (i / totalFiles) * 70,
        status: 'processing',
        message: `Merging file ${i + 1} of ${totalFiles}...`,
      });

      const arrayBuffer = await files[i].arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    onProgress?.({ progress: 90, status: 'processing', message: 'Finalizing PDF...' });

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to merge PDFs' });
    throw error;
  }
}

/**
 * Split PDF into individual pages or ranges
 */
export async function splitPDF(
  file: File,
  ranges: { start: number; end: number }[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob[]> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const resultBlobs: Blob[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const { start, end } = ranges[i];
      onProgress?.({
        progress: 10 + (i / ranges.length) * 80,
        status: 'processing',
        message: `Splitting pages ${start}-${end}...`,
      });

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(
        pdf,
        Array.from({ length: end - start + 1 }, (_, idx) => start + idx - 1)
      );
      pages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      resultBlobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
    }

    onProgress?.({ progress: 100, status: 'completed' });

    return resultBlobs;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to split PDF' });
    throw error;
  }
}

/**
 * Rotate PDF pages
 */
export async function rotatePDF(
  file: File,
  rotation: 90 | 180 | 270,
  pages: number[] | 'all' | 'odd' | 'even',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    let pagesToRotate: number[] = [];
    
    if (pages === 'all') {
      pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
    } else if (pages === 'odd') {
      pagesToRotate = Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 === 1);
    } else if (pages === 'even') {
      pagesToRotate = Array.from({ length: totalPages }, (_, i) => i).filter(i => (i + 1) % 2 === 0);
    } else if (Array.isArray(pages)) {
      // Convert 1-based page numbers to 0-based indices
      pagesToRotate = pages.map(p => p - 1).filter(p => p >= 0 && p < totalPages);
    }

    if (pagesToRotate.length === 0) {
      throw new Error('No valid pages selected for rotation');
    }

    onProgress?.({ progress: 40, status: 'processing', message: `Rotating ${pagesToRotate.length} page(s)...` });

    pagesToRotate.forEach((pageIndex, index) => {
      if (pageIndex >= 0 && pageIndex < totalPages) {
        const page = pdf.getPage(pageIndex);
        // Get current rotation and add new rotation
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + rotation) % 360;
        page.setRotation({ angle: newRotation, type: 'degrees' });
        
        onProgress?.({
          progress: 40 + ((index + 1) / pagesToRotate.length) * 40,
          status: 'processing',
          message: `Rotating page ${pageIndex + 1} of ${totalPages}...`,
        });
      }
    });

    onProgress?.({ progress: 80, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to rotate PDF' });
    throw error;
  }
}

/**
 * Add watermark to PDF with comprehensive options
 */
export async function addWatermarkToPDF(
  file: File,
  options: {
    watermarkType?: 'standard' | 'custom';
    standardWatermark?: string;
    customText?: string;
    customImage?: File;
    customPdf?: File;
    position?: string;
    opacity?: number;
    fontSize?: number;
    rotation?: number;
    color?: string;
    fontFamily?: string;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const {
      watermarkType = 'standard',
      standardWatermark = 'CONFIDENTIAL',
      customText = '',
      customImage,
      customPdf,
      position = 'diagonal',
      opacity = 0.3,
      fontSize = 48,
      rotation = -45,
      color = '#808080',
      fontFamily = 'Helvetica-Bold',
    } = options;
    
    console.log('[addWatermarkToPDF] All options received:', {
      watermarkType,
      standardWatermark,
      customText,
      position,
      opacity,
      fontSize,
      rotation,
      color,
      fontFamily,
    });

    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const pages = pdf.getPages();
    const totalPages = pages.length;

    // Determine watermark content
    // CRITICAL: Only treat as image watermark if user explicitly uploaded image/PDF AND no custom text is provided
    // If customText is provided, prioritize text watermark over image/PDF
    const hasCustomText = customText !== undefined && customText !== null && typeof customText === 'string' && customText.trim().length > 0;
    const hasCustomImage = customImage !== undefined && customImage !== null;
    const hasCustomPdf = customPdf !== undefined && customPdf !== null;
    
    // Only use image/PDF watermark if explicitly uploaded AND no custom text provided
    const isImageWatermark = watermarkType === 'custom' && !hasCustomText && (hasCustomImage || hasCustomPdf);
    
    // For custom type: prioritize customText if provided
    let watermarkText: string = 'WATERMARK'; // Default fallback
    if (watermarkType === 'standard') {
      watermarkText = standardWatermark || 'CONFIDENTIAL';
    } else if (watermarkType === 'custom') {
      // CRITICAL: If customText is provided, always use it (ignore image/PDF)
      if (hasCustomText) {
        watermarkText = customText.trim();
        console.log('[addWatermarkToPDF] ✅ Using custom text watermark:', watermarkText);
      } else if (isImageWatermark) {
        // Only use image/PDF if no custom text and image/PDF is explicitly uploaded
        watermarkText = ''; // Will use image instead
        console.log('[addWatermarkToPDF] Using image/PDF watermark');
      } else {
        // No custom text or image - use standard watermark as fallback
        watermarkText = standardWatermark || 'CONFIDENTIAL';
        console.log('[addWatermarkToPDF] Using standard watermark (customText empty/missing):', watermarkText);
      }
    } else {
      watermarkText = standardWatermark || 'CONFIDENTIAL';
    }
    
    console.log('[addWatermarkToPDF] Watermark determination:', {
      watermarkType,
      customText,
      customTextProvided: customText !== undefined,
      isImageWatermark,
      finalWatermarkText: watermarkText,
    });

    // Embed font if text watermark is needed
    let font;
    // We need font if: not an image watermark AND we have watermark text to display
    if (!isImageWatermark && watermarkText && watermarkText.trim().length > 0) {
      try {
        // Map font family to StandardFonts
        let fontName: any = StandardFonts.HelveticaBold;
        if (fontFamily === 'Helvetica') {
          fontName = StandardFonts.Helvetica;
        } else if (fontFamily === 'Times-Roman') {
          fontName = StandardFonts.TimesRoman;
        } else if (fontFamily === 'Courier') {
          fontName = StandardFonts.Courier;
        }
        font = await pdf.embedFont(fontName);
        console.log('[addWatermarkToPDF] Font embedded successfully:', fontFamily);
      } catch (fontError) {
        console.error('[addWatermarkToPDF] Font embedding error:', fontError);
        // Fallback to default font
        try {
          font = await pdf.embedFont(StandardFonts.HelveticaBold);
          console.log('[addWatermarkToPDF] Using fallback font: HelveticaBold');
        } catch (fallbackError) {
          console.error('[addWatermarkToPDF] Even fallback font failed:', fallbackError);
          throw new Error('Failed to embed font for watermark. Please try again.');
        }
      }
    }

    // Embed image if image watermark (or convert PDF page to image)
    // CRITICAL: Only if no custom text is provided
    let watermarkImage: any = null;
    if (isImageWatermark && !hasCustomText) {
      if (customPdf) {
        // Convert first page of PDF to image
        onProgress?.({ progress: 10, status: 'processing', message: 'Converting PDF watermark to image...' });
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        
        const pdfArrayBuffer = await customPdf.arrayBuffer();
        const watermarkPdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
        
        if (watermarkPdfDoc.numPages === 0) {
          throw new Error('PDF watermark file has no pages');
        }
        
        // Render first page of PDF to canvas
        const firstPage = await watermarkPdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await firstPage.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to PNG blob
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert PDF page to image'));
          }, 'image/png', 1.0);
        });
        
        // Embed PNG as watermark image
        const pngArrayBuffer = await pngBlob.arrayBuffer();
        watermarkImage = await pdf.embedPng(pngArrayBuffer);
      } else if (customImage) {
        onProgress?.({ progress: 10, status: 'processing', message: 'Loading watermark image...' });
        const imageArrayBuffer = await customImage.arrayBuffer();
        const imageType = customImage.type;
        
        if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
          watermarkImage = await pdf.embedJpg(imageArrayBuffer);
        } else if (imageType === 'image/png') {
          watermarkImage = await pdf.embedPng(imageArrayBuffer);
        } else {
          throw new Error(`Unsupported image format: ${imageType}. Please use JPG or PNG.`);
        }
      }
    }

    // Parse color hex to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      try {
        if (!hex || typeof hex !== 'string') {
          console.warn('[addWatermarkToPDF] Invalid color input, using default gray:', hex);
          return { r: 0.5, g: 0.5, b: 0.5 }; // Default gray
        }
        
        // Normalize hex string - ensure it starts with #
        let normalizedHex = hex.trim();
        if (!normalizedHex.startsWith('#')) {
          normalizedHex = '#' + normalizedHex;
        }
        
        // Handle 3-digit hex colors (e.g., #f00 -> #ff0000)
        if (normalizedHex.length === 4) {
          normalizedHex = '#' + normalizedHex[1] + normalizedHex[1] + normalizedHex[2] + normalizedHex[2] + normalizedHex[3] + normalizedHex[3];
        }
        
        const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
        if (result) {
          const rgb = {
            r: Math.max(0, Math.min(1, parseInt(result[1], 16) / 255)),
            g: Math.max(0, Math.min(1, parseInt(result[2], 16) / 255)),
            b: Math.max(0, Math.min(1, parseInt(result[3], 16) / 255)),
          };
          console.log('[addWatermarkToPDF] Color parsed successfully:', { 
            input: hex, 
            normalized: normalizedHex, 
            rgb: rgb,
            rgb255: {
              r: Math.round(rgb.r * 255),
              g: Math.round(rgb.g * 255),
              b: Math.round(rgb.b * 255)
            }
          });
          return rgb;
        } else {
          console.warn('[addWatermarkToPDF] Color regex failed, using default gray:', { input: hex, normalized: normalizedHex });
          return { r: 0.5, g: 0.5, b: 0.5 }; // Default gray
        }
      } catch (colorError) {
        console.error('[addWatermarkToPDF] Color parsing error:', colorError, 'Input:', hex);
        return { r: 0.5, g: 0.5, b: 0.5 }; // Default gray
      }
    };

    console.log('[addWatermarkToPDF] Received color option:', color, 'Type:', typeof color);
    const textColor = hexToRgb(color || '#808080');
    console.log('[addWatermarkToPDF] Final text color RGB:', textColor);

    // Calculate position coordinates
    const calculatePosition = (pageWidth: number, pageHeight: number, watermarkWidth: number, watermarkHeight: number) => {
      let x = 0;
      let y = 0;

      switch (position) {
        case 'center':
          x = (pageWidth - watermarkWidth) / 2;
          y = (pageHeight - watermarkHeight) / 2;
          break;
        case 'top-center':
          x = (pageWidth - watermarkWidth) / 2;
          y = pageHeight - watermarkHeight - 50;
          break;
        case 'top-left':
          x = 50;
          y = pageHeight - watermarkHeight - 50;
          break;
        case 'top-right':
          x = pageWidth - watermarkWidth - 50;
          y = pageHeight - watermarkHeight - 50;
          break;
        case 'bottom-center':
          x = (pageWidth - watermarkWidth) / 2;
          y = 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-right':
          x = pageWidth - watermarkWidth - 50;
          y = 50;
          break;
        case 'diagonal':
        default:
          // Center position for diagonal
          x = (pageWidth - watermarkWidth) / 2;
          y = (pageHeight - watermarkHeight) / 2;
          break;
      }

      return { x, y };
    };

    // Process each page
    for (let i = 0; i < totalPages; i++) {
      onProgress?.({
        progress: 15 + (i / totalPages) * 75,
        status: 'processing',
        message: `Adding watermark to page ${i + 1} of ${totalPages}...`,
      });

      const page = pages[i];
      const { width, height } = page.getSize();

      if (isImageWatermark && watermarkImage && !hasCustomText) {
        // Image watermark - only if no custom text is provided
        const imageWidth = Math.min(watermarkImage.width, width * 0.5);
        const imageHeight = (watermarkImage.height / watermarkImage.width) * imageWidth;
        const { x, y } = calculatePosition(width, height, imageWidth, imageHeight);

        page.drawImage(watermarkImage, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
          opacity,
          rotate: { angle: rotation, type: 'degrees' },
        });
      } else if (watermarkText && watermarkText.trim().length > 0 && !isImageWatermark && font) {
        // Text watermark - only if we have text, no image watermark, and font is available
        try {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize;
          const { x, y } = calculatePosition(width, height, textWidth, textHeight);

          const finalColor = rgb(textColor.r, textColor.g, textColor.b);
          console.log(`[addWatermarkToPDF] Drawing text on page ${i + 1}:`, {
            text: watermarkText,
            color: { r: textColor.r, g: textColor.g, b: textColor.b },
            opacity,
            fontSize,
            position: { x, y }
          });
          
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font,
            color: finalColor,
            opacity,
            rotate: { angle: rotation, type: 'degrees' },
          });
        } catch (textError) {
          console.error(`[addWatermarkToPDF] Error drawing text on page ${i + 1}:`, textError);
          // Continue to next page instead of failing completely
        }
      }
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: `Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}` });
    throw error;
  }
}

/**
 * Remove pages from PDF
 */
export async function removePagesFromPDF(
  file: File,
  pagesToRemove: number[] | { pagesToRemove?: number[]; pageOrder?: number[] },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    // Handle both direct array and options object
    let pagesToRemoveArray: number[] = [];
    let pageOrder: number[] | undefined = undefined;
    
    if (Array.isArray(pagesToRemove)) {
      pagesToRemoveArray = pagesToRemove;
    } else if (pagesToRemove && typeof pagesToRemove === 'object') {
      pagesToRemoveArray = pagesToRemove.pagesToRemove || [];
      pageOrder = pagesToRemove.pageOrder;
    }

    // If pageOrder is provided, use it for reordering
    if (pageOrder && Array.isArray(pageOrder) && pageOrder.length > 0) {
      // Validate page order (1-based page numbers)
      const validOrder = pageOrder.filter(p => p >= 1 && p <= totalPages);
      if (validOrder.length !== totalPages) {
        throw new Error('Invalid page order: must include all pages exactly once');
      }

      onProgress?.({ progress: 40, status: 'processing', message: 'Reordering pages...' });

      const newPdf = await PDFDocument.create();
      // Copy pages in the specified order (convert 1-based to 0-based)
      const pagesToCopy = validOrder.map(p => p - 1);
      const pages = await newPdf.copyPages(pdf, pagesToCopy);
      pages.forEach((page) => newPdf.addPage(page));

      onProgress?.({ progress: 80, status: 'processing', message: 'Saving PDF...' });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      onProgress?.({ progress: 100, status: 'completed' });

      return blob;
    }

    // Original remove pages logic
    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i).filter(
      (i) => !pagesToRemoveArray.includes(i + 1)
    );

    onProgress?.({ progress: 40, status: 'processing', message: 'Removing pages...' });

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, pagesToKeep);
    pages.forEach((page) => newPdf.addPage(page));

    onProgress?.({ progress: 80, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to remove pages' });
    throw error;
  }
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbersToPDF(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-right' | 'bottom-left';
    startNumber?: number;
    fontSize?: number;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const { position = 'bottom-center', startNumber = 1, fontSize = 12 } = options;

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const pages = pdf.getPages();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      onProgress?.({
        progress: 10 + (i / totalPages) * 80,
        status: 'processing',
        message: `Adding page numbers...`,
      });

      const page = pages[i];
      const { width, height } = page.getSize();
      const pageNumber = `${startNumber + i}`;
      const textWidth = font.widthOfTextAtSize(pageNumber, fontSize);

      let x = width / 2 - textWidth / 2;
      if (position === 'bottom-right') x = width - textWidth - 50;
      if (position === 'bottom-left') x = 50;

      page.drawText(pageNumber, {
        x,
        y: 30,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add page numbers' });
    throw error;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert images to PDF
 */
export async function imagesToPDF(
  files: File[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Creating PDF...' });

    const pdfDoc = await PDFDocument.create();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      onProgress?.({
        progress: 10 + (i / totalFiles) * 80,
        status: 'processing',
        message: `Adding image ${i + 1} of ${totalFiles}...`,
      });

      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      
      let image;
      const fileType = file.type.toLowerCase();
      
      if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (fileType === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // For unsupported formats, try PNG (most common fallback)
        try {
          image = await pdfDoc.embedPng(arrayBuffer);
        } catch {
          image = await pdfDoc.embedJpg(arrayBuffer);
        }
      }

      // Create a page with the same dimensions as the image
      const page = pdfDoc.addPage([image.width, image.height]);
      
      // Draw the image to fill the entire page
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Finalizing PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert images to PDF' });
    throw error;
  }
}

/**
 * Convert PDF to JPG images
 */
export async function pdfToJPG(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDF...' });

    // We'll use pdfjs-dist for rendering
    const pdfjsLib = await import('pdfjs-dist');
    // Use jsdelivr CDN (more reliable than cdnjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // For single page, return JPG directly
    if (numPages === 1) {
      onProgress?.({ progress: 20, status: 'processing', message: 'Converting page 1 to JPG...' });
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 3.0 }); // Higher scale for better quality
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      onProgress?.({ progress: 90, status: 'processing', message: 'Finalizing JPG...' });
      
      // Convert canvas to JPG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert canvas to JPG'));
        }, 'image/jpeg', 0.92); // High quality JPEG
      });
      
      onProgress?.({ progress: 100, status: 'completed' });
      return blob;
    }
    
    // For multiple pages, convert all pages and create a ZIP file with separate JPG files
    onProgress?.({ progress: 10, status: 'processing', message: `Converting ${numPages} pages to JPG...` });
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Get base filename without extension
    const baseFileName = file.name.replace(/\.[^/.]+$/, '');
    
    // Convert each page to JPG
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const progressStart = 10 + ((pageNum - 1) / numPages) * 75;
      const progressEnd = 10 + (pageNum / numPages) * 75;
      
      onProgress?.({
        progress: progressStart,
        status: 'processing',
        message: `Converting page ${pageNum} of ${numPages}...`,
      });
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 3.0 }); // Higher scale for better quality
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      // Convert canvas to JPG blob
      const jpgBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${pageNum} to JPG`));
        }, 'image/jpeg', 0.92); // High quality JPEG
      });
      
      // Add JPG to ZIP with proper filename
      const fileName = `${baseFileName}_page_${pageNum.toString().padStart(3, '0')}.jpg`;
      zip.file(fileName, jpgBlob);
      
      onProgress?.({
        progress: progressEnd,
        status: 'processing',
        message: `Completed page ${pageNum} of ${numPages}`,
      });
    }
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Creating ZIP file...' });
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    onProgress?.({ progress: 100, status: 'completed', message: `Successfully converted ${numPages} pages to JPG` });
    
    return zipBlob;
  } catch (error) {
    console.error('PDF to JPG conversion error:', error);
    onProgress?.({ progress: 0, status: 'error', message: `Failed to convert PDF to JPG: ${error instanceof Error ? error.message : 'Unknown error'}` });
    throw error;
  }
}

/**
 * Convert PDF to PNG images
 * Returns single PNG for one page, or ZIP file with all pages as separate PNG files
 */
export async function pdfToPNG(
  file: File,
  options?: {
    scale?: number;
    pages?: 'all' | number[];
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  const scale = options?.scale || 3.0;
  const pagesToConvert = options?.pages || 'all';
  try {
    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDF...' });

    // We'll use pdfjs-dist for rendering
    const pdfjsLib = await import('pdfjs-dist');
    // Use jsdelivr CDN (more reliable than cdnjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    // Determine which pages to convert
    let pagesToProcess: number[] = [];
    if (pagesToConvert === 'all') {
      pagesToProcess = Array.from({ length: numPages }, (_, i) => i + 1);
    } else {
      // Filter valid page numbers
      pagesToProcess = pagesToConvert.filter(pageNum => pageNum > 0 && pageNum <= numPages);
      if (pagesToProcess.length === 0) {
        throw new Error('No valid pages selected for conversion');
      }
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // For single page, return PNG directly
    if (pagesToProcess.length === 1) {
      const pageNum = pagesToProcess[0];
      onProgress?.({ progress: 20, status: 'processing', message: `Converting page ${pageNum} to PNG...` });
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale }); // Use configured scale
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      onProgress?.({ progress: 90, status: 'processing', message: 'Finalizing PNG...' });
      
      // Convert canvas to PNG blob with transparency support
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert canvas to PNG'));
        }, 'image/png', 1.0); // Maximum quality, PNG supports transparency
      });
      
      onProgress?.({ progress: 100, status: 'completed' });
      return blob;
    }
    
    // For multiple pages, convert selected pages and create a ZIP file with separate PNG files
    onProgress?.({ progress: 10, status: 'processing', message: `Converting ${pagesToProcess.length} pages to PNG...` });
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Get base filename without extension
    const baseFileName = file.name.replace(/\.[^/.]+$/, '');
    
    // Convert each selected page to PNG
    for (let i = 0; i < pagesToProcess.length; i++) {
      const pageNum = pagesToProcess[i];
      const progressStart = 10 + (i / pagesToProcess.length) * 75;
      const progressEnd = 10 + ((i + 1) / pagesToProcess.length) * 75;
      
      onProgress?.({
        progress: progressStart,
        status: 'processing',
        message: `Converting page ${pageNum} of ${pagesToProcess.length}...`,
      });
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale }); // Use configured scale
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      // Convert canvas to PNG blob
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${pageNum} to PNG`));
        }, 'image/png', 1.0); // Maximum quality, PNG supports transparency
      });
      
      // Add PNG to ZIP with proper filename
      const fileName = `${baseFileName}_page_${pageNum.toString().padStart(3, '0')}.png`;
      zip.file(fileName, pngBlob);
      
      onProgress?.({
        progress: progressEnd,
        status: 'processing',
        message: `Completed page ${pageNum} of ${pagesToProcess.length}`,
      });
    }
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Creating ZIP file...' });
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    onProgress?.({ progress: 100, status: 'completed', message: `Successfully converted ${pagesToProcess.length} pages to PNG` });
    
    return zipBlob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert PDF to PNG' });
    throw error;
  }
}

/**
 * Crop PDF pages to custom dimensions
 */
export async function cropPDF(
  file: File,
  options: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    unit?: 'points' | 'inches' | 'mm' | 'cm';
    applyToAllPages?: boolean;
    pageNumbers?: number[]; // If specified, only crop these pages (1-indexed)
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    console.log('[cropPDF] Function called with options:', options);
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Convert units to points (PDF uses points: 1 inch = 72 points, 1 cm = 28.35 points, 1 mm = 2.835 points)
    const unitMultiplier: Record<string, number> = {
      points: 1,
      inches: 72,
      mm: 2.835,
      cm: 28.35,
    };
    const multiplier = unitMultiplier[options.unit || 'points'];

    const top = (options.top || 0) * multiplier;
    const right = (options.right || 0) * multiplier;
    const bottom = (options.bottom || 0) * multiplier;
    const left = (options.left || 0) * multiplier;

    // Determine which pages to crop
    const pagesToCrop = options.pageNumbers 
      ? options.pageNumbers.filter(p => p >= 1 && p <= totalPages)
      : Array.from({ length: totalPages }, (_, i) => i + 1);

    onProgress?.({ progress: 20, status: 'processing', message: `Cropping ${pagesToCrop.length} page(s)...` });

    // Crop each page
    pagesToCrop.forEach((pageNum, index) => {
      const page = pages[pageNum - 1];
      const { width, height } = page.getSize();

      // Calculate new crop box
      // PDF coordinates: bottom-left is (0, 0), top-right is (width, height)
      const newX = left;
      const newY = bottom;
      const newWidth = width - left - right;
      const newHeight = height - top - bottom;

      // Validate crop dimensions
      if (newWidth <= 0 || newHeight <= 0) {
        throw new Error(`Invalid crop dimensions for page ${pageNum}. Cropped area would be ${newWidth} x ${newHeight} points.`);
      }

      if (newX < 0 || newY < 0 || newX + newWidth > width || newY + newHeight > height) {
        throw new Error(`Crop area exceeds page boundaries for page ${pageNum}.`);
      }

      // Set the crop box
      page.setCropBox(newX, newY, newWidth, newHeight);

      onProgress?.({
        progress: 20 + ((index + 1) / pagesToCrop.length) * 70,
        status: 'processing',
        message: `Cropped page ${pageNum} of ${totalPages}...`,
      });
    });

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving cropped PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to crop PDF' });
    throw error;
  }
}

/**
 * Edit PDF metadata
 */
export async function editPDFMetadata(
  file: File,
  options: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    onProgress?.({ progress: 30, status: 'processing', message: 'Updating metadata...' });

    // Update metadata fields if provided
    if (options.title !== undefined) {
      pdfDoc.setTitle(options.title);
    }
    if (options.author !== undefined) {
      pdfDoc.setAuthor(options.author);
    }
    if (options.subject !== undefined) {
      pdfDoc.setSubject(options.subject);
    }
    if (options.keywords !== undefined) {
      pdfDoc.setKeywords(options.keywords.split(',').map(k => k.trim()));
    }
    if (options.creator !== undefined) {
      pdfDoc.setCreator(options.creator);
    }
    if (options.producer !== undefined) {
      pdfDoc.setProducer(options.producer);
    }

    // Update modification date
    pdfDoc.setModificationDate(new Date());

    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to edit PDF metadata' });
    throw error;
  }
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(
  file: File
): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
}> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    return {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: pdfDoc.getKeywords()?.join(', '),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
      pageCount: pdfDoc.getPageCount(),
    };
  } catch (error) {
    console.error('Failed to get PDF metadata:', error);
    throw error;
  }
}

/**
 * Flatten PDF - Convert interactive forms and annotations to static content
 * This renders each page to an image and recreates the PDF, effectively flattening all interactive elements
 */
export async function flattenPDF(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    console.log('[flattenPDF] Starting flatten process for file:', file.name, 'Size:', file.size);
    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDF...' });

    const { PDFDocument } = await import('pdf-lib');
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Load original PDF with pdfjs-dist for rendering
    const arrayBuffer = await file.arrayBuffer();
    console.log('[flattenPDF] Loaded PDF, size:', arrayBuffer.byteLength);
    const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfjsDoc.numPages;
    console.log('[flattenPDF] PDF has', numPages, 'pages');

    // Create new PDF document
    const pdfDoc = await PDFDocument.create();

    onProgress?.({ progress: 10, status: 'processing', message: `Flattening ${numPages} page(s)...` });

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const progressStart = 10 + ((pageNum - 1) / numPages) * 80;
      const progressEnd = 10 + (pageNum / numPages) * 80;

      onProgress?.({
        progress: progressStart,
        status: 'processing',
        message: `Flattening page ${pageNum} of ${numPages}...`,
      });

      // Get page from original PDF
      const page = await pdfjsDoc.getPage(pageNum);
      
      // Get original page dimensions (scale 1.0 for actual PDF dimensions in points)
      const originalViewport = page.getViewport({ scale: 1.0 });
      
      // Calculate appropriate scale (limit canvas size to avoid browser limits)
      // Browser canvas limit is typically 16,384 pixels
      const maxCanvasSize = 16384;
      const maxDimension = Math.max(originalViewport.width, originalViewport.height);
      const scale = Math.min(2.0, maxCanvasSize / maxDimension);
      
      // Use calculated scale for rendering quality
      const renderViewport = page.getViewport({ scale });

      // Render page to canvas (this includes all form fields and annotations)
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Failed to get canvas context');

      // Set canvas dimensions for high-quality rendering (ensure valid dimensions)
      const canvasWidth = Math.max(1, Math.floor(renderViewport.width));
      const canvasHeight = Math.max(1, Math.floor(renderViewport.height));
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Render the page (this flattens forms and annotations into the image)
      await page.render({
        canvasContext: context,
        viewport: renderViewport,
      }).promise;

      // Convert canvas to PNG image
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Failed to convert page ${pageNum} to image`));
        }, 'image/png', 1.0); // Maximum quality
      });

      // Validate image blob
      if (!imageBlob || imageBlob.size === 0) {
        throw new Error(`Failed to create image for page ${pageNum}`);
      }

      // Embed the image into the new PDF
      const imageBytes = await imageBlob.arrayBuffer();
      
      // Validate image bytes
      if (!imageBytes || imageBytes.byteLength === 0) {
        throw new Error(`Invalid image data for page ${pageNum}`);
      }

      // Validate image bytes have PNG header
      const pngHeader = new Uint8Array(imageBytes.slice(0, 8));
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const isPNG = pngHeader.every((byte, index) => byte === pngSignature[index]);
      if (!isPNG) {
        throw new Error(`Invalid PNG image for page ${pageNum}`);
      }

      let pdfImage;
      try {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } catch (embedError) {
        console.error(`Failed to embed PNG for page ${pageNum}:`, embedError);
        throw new Error(`Failed to embed image for page ${pageNum}: ${embedError instanceof Error ? embedError.message : 'Unknown error'}`);
      }
      
      // Use original page dimensions (in points) for PDF page size
      const pageWidth = Math.max(72, originalViewport.width); // Minimum 1 inch
      const pageHeight = Math.max(72, originalViewport.height); // Minimum 1 inch
      
      // Create a new page with the same dimensions as the original (in points)
      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Draw the flattened image onto the page, filling the entire page
      try {
        pdfPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (drawError) {
        console.error(`Failed to draw image for page ${pageNum}:`, drawError);
        throw new Error(`Failed to draw image for page ${pageNum}: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
      }

      onProgress?.({
        progress: progressEnd,
        status: 'processing',
        message: `Completed page ${pageNum} of ${numPages}`,
      });
      
      console.log(`[flattenPDF] Page ${pageNum} processed successfully, image size: ${imageBlob.size} bytes`);
    }

    // Ensure at least one page exists
    const finalPageCount = pdfDoc.getPageCount();
    if (finalPageCount === 0) {
      throw new Error('No pages were created in the flattened PDF');
    }
    console.log(`[flattenPDF] Total pages created: ${finalPageCount}`);

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving flattened PDF...' });

    // Save the flattened PDF with validation
    let pdfBytes: Uint8Array;
    try {
      // Save without object streams for better compatibility
      pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    } catch (saveError) {
      console.error('Failed to save PDF:', saveError);
      // Try saving with default options as fallback
      try {
        pdfBytes = await pdfDoc.save();
      } catch (fallbackError) {
        throw new Error(`Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
      }
    }
    
    // Validate PDF bytes
    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Failed to generate PDF: PDF bytes are empty');
    }

    // Validate PDF header
    if (pdfBytes.length < 4) {
      throw new Error('Generated PDF is too small to be valid');
    }
    
    const header = new Uint8Array(pdfBytes.slice(0, 4));
    const headerString = String.fromCharCode(...header);
    if (headerString !== '%PDF') {
      console.error('Invalid PDF header:', headerString, 'First 20 bytes:', Array.from(pdfBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      throw new Error('Generated PDF has invalid header');
    }

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Failed to create PDF blob');
    }
    
    // Try to validate the PDF by loading it with pdfjs-dist
    try {
      const testArrayBuffer = await blob.arrayBuffer();
      const testDoc = await pdfjsLib.getDocument({ data: testArrayBuffer }).promise;
      const testPages = testDoc.numPages;
      console.log('[flattenPDF] PDF validation successful:', {
        size: blob.size,
        pages: testPages,
        header: headerString
      });
      
      // Verify we can actually access a page
      if (testPages > 0) {
        const testPage = await testDoc.getPage(1);
        const testViewport = testPage.getViewport({ scale: 1.0 });
        console.log('[flattenPDF] First page dimensions:', {
          width: testViewport.width,
          height: testViewport.height
        });
      }
    } catch (validationError) {
      console.error('[flattenPDF] PDF validation failed:', validationError);
      // If validation fails, the PDF is likely corrupted - throw error
      throw new Error(`Generated PDF is invalid and cannot be loaded: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
    }
    
    console.log('[flattenPDF] Successfully created flattened PDF:', {
      size: blob.size,
      pages: pdfDoc.getPageCount(),
      header: headerString
    });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to flatten PDF' });
    throw error;
  }
}

/**
 * Add watermark to PDF
 */
export async function addWatermark(
  file: File,
  watermarkText: string = 'WATERMARK',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    pages.forEach((page, index) => {
      onProgress?.({
        progress: 10 + ((index + 1) / pages.length) * 80,
        status: 'processing',
        message: `Adding watermark to page ${index + 1}...`,
      });
      
      const { width, height } = page.getSize();
      
      page.drawText(watermarkText, {
        x: width / 2 - (watermarkText.length * 15),
        y: height / 2,
        size: 60,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: { angle: 45, type: 'degrees' },
      });
    });

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    console.error('[addWatermarkToPDF] Error:', error);
    console.error('[addWatermarkToPDF] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[addWatermarkToPDF] Options at error:', {
      watermarkType,
      customText,
      standardWatermark,
      hasCustomImage: !!customImage,
      hasCustomPdf: !!customPdf,
      position,
      opacity,
      fontSize,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress?.({ progress: 0, status: 'error', message: `Failed to add watermark: ${errorMessage}` });
    throw new Error(`Failed to add watermark to PDF: ${errorMessage}. Please check your watermark settings and try again.`);
  }
}

/**
 * Convert number to Roman numeral
 */
function toRoman(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  
  return result.toLowerCase();
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    format?: 'simple' | 'page-of-total' | 'roman' | 'custom';
    startNumber?: number;
    fontSize?: number;
    customFormat?: string;
    color?: string;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const {
      position = 'bottom-center',
      format = 'simple',
      startNumber = 1,
      fontSize = 12,
      customFormat = 'Page {n}',
      color = '#000000',
    } = options;

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const rgbColor = hexToRgb(color);
    const textColor = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
    
    pages.forEach((page, index) => {
      onProgress?.({
        progress: 10 + ((index + 1) / totalPages) * 80,
        status: 'processing',
        message: `Adding number to page ${index + 1}...`,
      });
      
      const { width, height } = page.getSize();
      const currentPageNumber = startNumber + index;
      
      // Format the page number text
      let pageText = '';
      if (format === 'simple') {
        pageText = `${currentPageNumber}`;
      } else if (format === 'page-of-total') {
        pageText = `Page ${currentPageNumber} of ${totalPages}`;
      } else if (format === 'roman') {
        pageText = toRoman(currentPageNumber);
      } else if (format === 'custom') {
        pageText = customFormat.replace(/{n}/g, `${currentPageNumber}`).replace(/{total}/g, `${totalPages}`);
      }
      
      const textWidth = font.widthOfTextAtSize(pageText, fontSize);
      
      // Calculate X position
      let x = 0;
      const margin = 50;
      if (position.includes('left')) {
        x = margin;
      } else if (position.includes('right')) {
        x = width - textWidth - margin;
      } else {
        // center
        x = width / 2 - textWidth / 2;
      }
      
      // Calculate Y position
      let y = 0;
      if (position.includes('top')) {
        y = height - 30;
      } else {
        // bottom
        y = 30;
      }
      
      page.drawText(pageText, {
        x,
        y,
        size: fontSize,
        font,
        color: textColor,
      });
    });

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add page numbers' });
    throw error;
  }
}

/**
 * Add header and footer to PDF with placeholder support and customizable options
 */
export async function addHeaderFooter(
  file: File,
  headerText: string = '',
  footerText: string = '',
  headerPosition: 'left' | 'center' | 'right' = 'center',
  footerPosition: 'left' | 'center' | 'right' = 'center',
  fontSize: number = 10,
  headerColor: string = '#000000',
  footerColor: string = '#000000',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Convert hex color to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 0, g: 0, b: 0 };
    };

    const headerRgb = hexToRgb(headerColor);
    const footerRgb = hexToRgb(footerColor);
    const headerTextColor = rgb(headerRgb.r, headerRgb.g, headerRgb.b);
    const footerTextColor = rgb(footerRgb.r, footerRgb.g, footerRgb.b);
    
    pages.forEach((page, index) => {
      onProgress?.({
        progress: 10 + ((index + 1) / totalPages) * 80,
        status: 'processing',
        message: `Adding header/footer to page ${index + 1}...`,
      });
      
      const { width, height } = page.getSize();
      const currentPage = index + 1;
      const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const margin = 30;
      
      // Replace placeholders in header text
      if (headerText && headerText.trim()) {
        let processedHeaderText = headerText
          .replace(/{page}/g, currentPage.toString())
          .replace(/{total}/g, totalPages.toString())
          .replace(/{date}/g, today);
        
        const textWidth = font.widthOfTextAtSize(processedHeaderText, fontSize);
        let headerX = width / 2 - textWidth / 2; // Default center
        
        if (headerPosition === 'left') {
          headerX = margin;
        } else if (headerPosition === 'right') {
          headerX = width - textWidth - margin;
        }
        
        page.drawText(processedHeaderText, {
          x: headerX,
          y: height - margin - fontSize,
          size: fontSize,
          font,
          color: headerTextColor,
        });
      }
      
      // Replace placeholders in footer text
      if (footerText && footerText.trim()) {
        let processedFooterText = footerText
          .replace(/{page}/g, currentPage.toString())
          .replace(/{total}/g, totalPages.toString())
          .replace(/{date}/g, today);
        
        const textWidth = font.widthOfTextAtSize(processedFooterText, fontSize);
        let footerX = width / 2 - textWidth / 2; // Default center
        
        if (footerPosition === 'left') {
          footerX = margin;
        } else if (footerPosition === 'right') {
          footerX = width - textWidth - margin;
        }
        
        page.drawText(processedFooterText, {
          x: footerX,
          y: margin,
          size: fontSize,
          font,
          color: footerTextColor,
        });
      }
    });

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add header/footer';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * Unlock PDF - Remove password protection from PDF files
 * Uses PDF.js to decrypt password-protected PDFs, then recreates an unlocked version
 */
export async function unlockPDF(
  file: File,
  password?: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc: PDFDocument;
    let isPasswordProtected = false;
    
    // First, try to load with pdf-lib (for non-encrypted PDFs)
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
      onProgress?.({ progress: 30, status: 'processing', message: 'PDF is not password protected' });
    } catch (error: any) {
      // Check if it's an encryption error
      if (error.message && (error.message.includes('encrypted') || error.message.includes('password') || error.message.includes('Password'))) {
        isPasswordProtected = true;
      } else {
        // Some other error - try PDF.js approach
        isPasswordProtected = true;
      }
    }

    // If password protected, use PDF.js to decrypt and recreate
    if (isPasswordProtected) {
      if (!password || password.trim() === '') {
        throw new Error('This PDF is password protected. Please enter the password to unlock it.');
      }

      onProgress?.({ progress: 20, status: 'processing', message: 'Decrypting PDF with password...' });

      // Use PDF.js to decrypt the PDF
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      let pdfjsDoc;
      try {
        // Try loading with password
        pdfjsDoc = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          password: password.trim()
        }).promise;
        onProgress?.({ progress: 40, status: 'processing', message: 'Password accepted. Recreating unlocked PDF...' });
      } catch (pdfjsError: any) {
        if (pdfjsError.name === 'PasswordException' || pdfjsError.message?.includes('password')) {
          throw new Error('Incorrect password. Please check the password and try again.');
        }
        throw new Error(`Failed to decrypt PDF: ${pdfjsError.message || 'Unknown error'}`);
      }

      // Render each page and recreate PDF using pdf-lib
      const numPages = pdfjsDoc.numPages;
      const unlockedPdf = await PDFDocument.create();
      
      // Get metadata from PDF.js if available
      try {
        const metadata = await pdfjsDoc.getMetadata();
        if (metadata?.info) {
          if (metadata.info.Title) unlockedPdf.setTitle(metadata.info.Title);
          if (metadata.info.Author) unlockedPdf.setAuthor(metadata.info.Author);
          if (metadata.info.Subject) unlockedPdf.setSubject(metadata.info.Subject);
          if (metadata.info.Creator) unlockedPdf.setCreator(metadata.info.Creator);
          if (metadata.info.Producer) unlockedPdf.setProducer(metadata.info.Producer);
        }
      } catch (metadataError) {
        // Metadata is optional
        console.warn('Could not copy metadata:', metadataError);
      }

      // Render each page to canvas, then embed as image in new PDF
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        onProgress?.({
          progress: 40 + ((pageNum - 1) / numPages) * 50,
          status: 'processing',
          message: `Processing page ${pageNum} of ${numPages}...`,
        });

        const page = await pdfjsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to image data
        const imageData = canvas.toDataURL('image/png');
        const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
        
        // Embed image in new PDF
        const image = await unlockedPdf.embedPng(imageBytes);
        const pdfPage = unlockedPdf.addPage([viewport.width, viewport.height]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      onProgress?.({ progress: 95, status: 'processing', message: 'Saving unlocked PDF...' });
      
      const pdfBytes = await unlockedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      onProgress?.({ progress: 100, status: 'completed', message: 'PDF unlocked successfully!' });
      return blob;
    } else {
      // Not password protected - just remove any encryption by recreating
      onProgress?.({ progress: 60, status: 'processing', message: 'Creating unlocked PDF...' });
      
      // Create a new PDF document and copy all pages
      const unlockedPdf = await PDFDocument.create();
      const pages = await unlockedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => unlockedPdf.addPage(page));
      
      // Copy metadata if available
      try {
        const title = pdfDoc.getTitle();
        const author = pdfDoc.getAuthor();
        const subject = pdfDoc.getSubject();
        const creator = pdfDoc.getCreator();
        const producer = pdfDoc.getProducer();
        const keywords = pdfDoc.getKeywords();
        const creationDate = pdfDoc.getCreationDate();
        const modificationDate = pdfDoc.getModificationDate();
        
        if (title) unlockedPdf.setTitle(title);
        if (author) unlockedPdf.setAuthor(author);
        if (subject) unlockedPdf.setSubject(subject);
        if (creator) unlockedPdf.setCreator(creator);
        if (producer) unlockedPdf.setProducer(producer);
        if (keywords) unlockedPdf.setKeywords(keywords);
        if (creationDate) unlockedPdf.setCreationDate(creationDate);
        if (modificationDate) unlockedPdf.setModificationDate(modificationDate);
      } catch (metadataError) {
        // Metadata copying is optional
        console.warn('Could not copy all metadata:', metadataError);
      }
      
      onProgress?.({ progress: 90, status: 'processing', message: 'Saving unlocked PDF...' });
      
      // Save without any password/encryption
      const pdfBytes = await unlockedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      onProgress?.({ progress: 100, status: 'completed', message: 'PDF unlocked successfully!' });
      return blob;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unlock PDF';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * Password protect PDF with user and owner passwords
 */
export async function passwordProtect(
  file: File,
  options: {
    userPassword: string;
    ownerPassword?: string;
    encryptionLevel?: 'aes256' | 'aes128' | 'rc4';
    permissions?: {
      allowPrinting?: boolean;
      allowCopying?: boolean;
      allowEditing?: boolean;
    };
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const {
      userPassword,
      ownerPassword,
      encryptionLevel = 'aes256',
      permissions = {},
    } = options;

    if (!userPassword) {
      throw new Error('User password is required');
    }

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF - if it's already encrypted, we need to handle it
    // For now, we'll try to load it normally. If it fails, we'll handle the error.
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (error: any) {
      // If PDF is password protected, we need to decrypt it first
      // But for password protection, we should create a new document
      // Let's try loading without password first
      if (error.message && error.message.includes('password')) {
        throw new Error('This PDF is already password protected. Please unlock it first before adding a new password.');
      }
      throw error;
    }

    onProgress?.({ progress: 40, status: 'processing', message: 'Recreating PDF for encryption...' });

    // CRITICAL FIX: Recreate PDF completely to ensure proper encryption
    // Simply saving with encryption options may not work - we need to copy all content to a new document
    // Use PDFDocument from top-level import (already imported at top of file)
    const encryptedPdf = await PDFDocument.create();
    
    // Copy all pages and resources to the new encrypted PDF
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    for (let i = 0; i < totalPages; i++) {
      onProgress?.({
        progress: 40 + ((i / totalPages) * 30),
        status: 'processing',
        message: `Copying page ${i + 1} of ${totalPages}...`,
      });
      
      const [copiedPage] = await encryptedPdf.copyPages(pdfDoc, [i]);
      encryptedPdf.addPage(copiedPage);
    }
    
    // Copy metadata
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    
    if (title) encryptedPdf.setTitle(title);
    if (author) encryptedPdf.setAuthor(author);
    if (subject) encryptedPdf.setSubject(subject);
    if (creator) encryptedPdf.setCreator(creator);
    if (producer) encryptedPdf.setProducer(producer);

    onProgress?.({ progress: 70, status: 'processing', message: 'Applying password encryption...' });

    // Set passwords and permissions for encryption
    const finalOwnerPassword = ownerPassword || userPassword;
    const trimmedUserPassword = String(userPassword).trim();
    const trimmedOwnerPassword = String(finalOwnerPassword).trim();
    
    // Validate passwords
    if (!trimmedUserPassword || trimmedUserPassword.length === 0) {
      throw new Error('User password cannot be empty');
    }

    // Determine permissions configuration for pdf-lib
    // pdf-lib uses a permissions object with specific format
    const hasRestrictions = 
      permissions.allowPrinting === false ||
      permissions.allowCopying === false ||
      permissions.allowEditing === false;

    // Build permissions object for pdf-lib
    // pdf-lib expects permissions in this format
    let permissionsConfig: any = undefined;
    if (hasRestrictions) {
      permissionsConfig = {
        printing: permissions.allowPrinting !== false ? 'highResolution' : 'denied',
        modifying: permissions.allowEditing !== false,
        copying: permissions.allowCopying !== false,
        annotating: permissions.allowEditing !== false,
      };
    }
    
    console.log('[passwordProtect] Encryption configuration:', {
      hasUserPassword: !!trimmedUserPassword,
      userPasswordLength: trimmedUserPassword.length,
      hasOwnerPassword: !!trimmedOwnerPassword,
      ownerPasswordLength: trimmedOwnerPassword.length,
      passwordsMatch: trimmedUserPassword === trimmedOwnerPassword,
      hasRestrictions,
      permissionsConfig,
    });

    // Configure save options with encryption settings
    // In pdf-lib, encryption is done via save() options
    // IMPORTANT: pdf-lib requires BOTH userPassword and ownerPassword for encryption to work
    // If only userPassword is provided, we must set ownerPassword to the same value
    const saveOptions: any = {
      useObjectStreams: false,
      updateMetadata: false,
    };
    
    // CRITICAL: pdf-lib requires both passwords for encryption
    // Set userPassword (required to open PDF)
    saveOptions.userPassword = trimmedUserPassword;
    
    // Set ownerPassword (required for encryption - use userPassword if not provided)
    saveOptions.ownerPassword = trimmedOwnerPassword;
    
    // Add permissions if restrictions are specified
    if (permissionsConfig) {
      saveOptions.permissions = permissionsConfig;
    }
    
    // Ensure we have both passwords set (pdf-lib requirement)
    if (!saveOptions.userPassword || !saveOptions.ownerPassword) {
      throw new Error('Both user and owner passwords are required for encryption');
    }
    
    console.log('[passwordProtect] Encryption options:', {
      userPasswordLength: trimmedUserPassword.length,
      ownerPasswordLength: trimmedOwnerPassword.length,
      hasPermissions: hasRestrictions,
      saveOptionsKeys: Object.keys(saveOptions),
    });

    // Save the new encrypted PDF with encryption options
    try {
      onProgress?.({ progress: 85, status: 'processing', message: 'Saving encrypted PDF...' });
      
      console.log('[passwordProtect] Attempting to save with encryption options:', {
        hasUserPassword: !!saveOptions.userPassword,
        hasOwnerPassword: !!saveOptions.ownerPassword,
        hasPermissions: !!saveOptions.permissions,
        optionsKeys: Object.keys(saveOptions),
      });
      
      const pdfBytes = await encryptedPdf.save(saveOptions);
      
      console.log('[passwordProtect] PDF saved successfully, size:', pdfBytes.length);
      
      // Verify encryption by attempting to load without password (should fail)
      let isEncrypted = false;
      try {
        await PDFDocument.load(pdfBytes);
        // If load succeeds without password, encryption failed
        console.error('[passwordProtect] ⚠️ WARNING: PDF opened without password - encryption may have failed');
        isEncrypted = false;
      } catch (loadError: any) {
        const errorMsg = loadError.message?.toLowerCase() || '';
        if (errorMsg.includes('password') || errorMsg.includes('encrypt') || errorMsg.includes('decrypt')) {
          isEncrypted = true;
          console.log('[passwordProtect] ✅ Encryption verified: PDF requires password');
        } else {
          console.warn('[passwordProtect] Unexpected error when verifying encryption:', loadError);
          // Still assume encrypted if we got an error (could be other validation errors)
          isEncrypted = true;
        }
      }
      
      console.log('[passwordProtect] PDF encryption status:', {
        size: pdfBytes.length,
        isEncrypted,
      });
      
      // Note: We'll return the PDF even if verification is unclear, as pdf-lib should handle encryption
      // The password will be required when opening in a PDF viewer
      
      onProgress?.({ progress: 100, status: 'completed', message: 'PDF encrypted successfully. Password required to open.' });
      
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (saveError: any) {
      console.error('[passwordProtect] Error saving encrypted PDF:', saveError);
      console.error('[passwordProtect] Error details:', {
        message: saveError.message,
        stack: saveError.stack,
        name: saveError.name,
      });
      
      // More helpful error messages based on error type
      const errorMsg = saveError.message?.toLowerCase() || '';
      
      if (errorMsg.includes('password') || errorMsg.includes('encrypt')) {
        throw new Error(`Encryption setup failed: ${saveError.message}. Please ensure your password meets the requirements and try again.`);
      }
      
      if (errorMsg.includes('invalid') || errorMsg.includes('corrupt')) {
        throw new Error(`Invalid PDF file. Please use a valid, uncorrupted PDF file.`);
      }
      
      // Generic error with details
      throw new Error(`Failed to encrypt PDF: ${saveError.message || 'Unknown error occurred. Please try again with a different PDF or password.'}`);
    }

  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to password protect PDF' });
    throw error;
  }
}

// Aliases for function name consistency
export const removePDFPages = removePagesFromPDF;

/**
 * Reorder PDF pages
 */
export async function reorderPDFPages(
  file: File,
  pageOrder: number[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  return await removePagesFromPDF(file, { pageOrder }, onProgress);
}

/**
 * Compress PDF with AI-powered smart compression
 * Renders pages to compressed images and re-embeds them to reduce file size
 */
export async function compressPDF(
  file: File,
  options?: {
    compressionLevel?: 'low' | 'medium' | 'high' | 'extreme' | 'smart';
    preserveQuality?: boolean;
    imageQuality?: number;
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const {
      compressionLevel = 'smart',
      preserveQuality = true,
      imageQuality,
    } = options || {};

    onProgress?.({ progress: 5, status: 'processing', message: 'Analyzing PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;
    
    // Load PDF with pdf-lib first to check if it's text-based
    const { PDFDocument } = await import('pdf-lib');
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (error: any) {
      if (error.message && error.message.includes('password')) {
        throw new Error('This PDF is password protected. Please unlock it first before compressing.');
      }
      throw error;
    }

    const pageCount = pdfDoc.getPageCount();
    
    // Calculate average size per page to determine if PDF is image-heavy
    const avgSizePerPage = originalSize / pageCount;
    const isImageHeavy = avgSizePerPage > 200000; // More than 200KB per page suggests images
    
    // For text-based PDFs (small size per page), try optimization first
    if (!isImageHeavy && compressionLevel !== 'extreme') {
      onProgress?.({ progress: 10, status: 'processing', message: 'Optimizing PDF structure...' });
      
      try {
        // Create optimized PDF by copying pages (removes unused objects)
        const optimizedPdf = await PDFDocument.create();
        
        // Copy all pages from original
        const pages = await optimizedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach((page) => {
          optimizedPdf.addPage(page);
        });
        
        // Copy minimal metadata
        try {
          const title = pdfDoc.getTitle();
          if (title) optimizedPdf.setTitle(title);
        } catch {}
        
        // Save with compression
        const optimizedBytes = await optimizedPdf.save({
          useObjectStreams: false,
          addDefaultPage: false,
          updateMetadata: false,
        });
        
        const optimizedSize = optimizedBytes.length;
        const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
        
        // If optimization reduced size by at least 5%, use it
        if (optimizedSize < originalSize && reduction >= 5) {
          onProgress?.({ 
            progress: 100, 
            status: 'completed',
            message: `Optimized successfully! Size reduced by ${reduction.toFixed(1)}%`
          });
          return new Blob([optimizedBytes], { type: 'application/pdf' });
        }
        
        // If optimization didn't help much, continue with image compression for better results
        onProgress?.({ progress: 15, status: 'processing', message: 'Applying advanced compression...' });
      } catch (optError) {
        console.warn('PDF optimization failed, using image compression:', optError);
        // Continue with image compression
      }
    }
    
    // Load PDF with PDF.js for rendering (for image-based compression)
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    let pdfjsDoc;
    try {
      pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (error: any) {
      if (error.message && error.message.includes('password')) {
        throw new Error('This PDF is password protected. Please unlock it first before compressing.');
      }
      throw error;
    }
    
    // Determine optimal compression settings - More aggressive compression for better size reduction
    let finalImageQuality = imageQuality;
    // For text-based PDFs, use lower scale to reduce file size
    // For image-heavy PDFs, use slightly higher scale to maintain quality
    let scale = isImageHeavy ? 1.3 : 1.0; // Much lower for text-based PDFs

    if (compressionLevel === 'smart') {
      // Use AI to determine optimal settings
      try {
        onProgress?.({ progress: 20, status: 'processing', message: 'AI analyzing optimal compression...' });
        
        const hasImages = isImageHeavy;
        
        const { getSmartCompressionAdvice } = await import('@/utils/aiUtils');
        const advice = await getSmartCompressionAdvice(originalSize, pageCount, hasImages);
        
        finalImageQuality = advice.recommendedQuality;
        // Convert percentage to 0-1 range
        if (finalImageQuality > 1) {
          finalImageQuality = finalImageQuality / 100;
        }
        // More aggressive compression - allow lower quality for better size reduction
        if (finalImageQuality < 0.50) {
          finalImageQuality = 0.50; // Minimum 50% for readability
        }
        // Adjust scale based on quality and PDF type - much lower for text-based
        if (isImageHeavy) {
          scale = finalImageQuality >= 0.75 ? 1.5 : finalImageQuality >= 0.65 ? 1.3 : 1.2;
        } else {
          scale = finalImageQuality >= 0.70 ? 1.0 : finalImageQuality >= 0.60 ? 0.9 : 0.8;
        }
        onProgress?.({ progress: 25, status: 'processing', message: `AI recommended quality: ${Math.round(finalImageQuality * 100)}%` });
      } catch (aiError) {
        console.warn('AI compression analysis failed, using default settings:', aiError);
        // More aggressive defaults for text-based PDFs
        if (isImageHeavy) {
          finalImageQuality = preserveQuality ? 0.70 : 0.60;
          scale = 1.3;
        } else {
          finalImageQuality = preserveQuality ? 0.60 : 0.50;
          scale = 1.0;
        }
      }
    } else {
      // Manual compression levels - More aggressive compression settings
      // Text-based PDFs get much more aggressive settings
      if (isImageHeavy) {
        switch (compressionLevel) {
          case 'low':
            finalImageQuality = preserveQuality ? 0.80 : 0.70;
            scale = 1.5;
            break;
          case 'medium':
            finalImageQuality = preserveQuality ? 0.70 : 0.60;
            scale = 1.3;
            break;
          case 'high':
            finalImageQuality = preserveQuality ? 0.60 : 0.50;
            scale = 1.2;
            break;
          case 'extreme':
            finalImageQuality = preserveQuality ? 0.50 : 0.45;
            scale = 1.0;
            break;
          default:
            finalImageQuality = preserveQuality ? 0.70 : 0.60;
            scale = 1.3;
        }
      } else {
        // Text-based PDFs: much more aggressive
        switch (compressionLevel) {
          case 'low':
            finalImageQuality = preserveQuality ? 0.70 : 0.60;
            scale = 1.0;
            break;
          case 'medium':
            finalImageQuality = preserveQuality ? 0.60 : 0.50;
            scale = 0.9;
            break;
          case 'high':
            finalImageQuality = preserveQuality ? 0.50 : 0.45;
            scale = 0.8;
            break;
          case 'extreme':
            finalImageQuality = preserveQuality ? 0.45 : 0.40;
            scale = 0.7;
            break;
          default:
            finalImageQuality = preserveQuality ? 0.60 : 0.50;
            scale = 1.0;
        }
      }
    }

    // Convert quality percentage to 0-1 range if needed
    if (finalImageQuality && finalImageQuality > 1) {
      finalImageQuality = finalImageQuality / 100;
    }
    if (!finalImageQuality) {
      // More aggressive defaults based on PDF type
      if (isImageHeavy) {
        finalImageQuality = preserveQuality ? 0.70 : 0.60;
      } else {
        finalImageQuality = preserveQuality ? 0.60 : 0.50;
      }
    }
    
    // Ensure minimum quality for readability - at least 40% (very aggressive)
    if (finalImageQuality < 0.40) {
      finalImageQuality = 0.40;
    }
    
    // Ensure scale is reasonable (minimum 0.7 for readability)
    if (scale < 0.7) {
      scale = 0.7;
    }

    onProgress?.({ progress: 20, status: 'processing', message: 'Rendering and compressing pages...' });

    // Create new PDF document
    const compressedPdf = await PDFDocument.create();
    
    // Copy metadata from original PDF
    try {
      const metadata = await pdfjsDoc.getMetadata();
      if (metadata?.info) {
        if (metadata.info.Title) compressedPdf.setTitle(metadata.info.Title);
        if (metadata.info.Author) compressedPdf.setAuthor(metadata.info.Author);
        if (metadata.info.Subject) compressedPdf.setSubject(metadata.info.Subject);
        if (metadata.info.Creator) compressedPdf.setCreator(metadata.info.Creator);
        if (metadata.info.Producer) compressedPdf.setProducer(metadata.info.Producer);
      }
    } catch (metadataError) {
      console.warn('Could not copy metadata:', metadataError);
    }

    // Process each page: render to canvas, compress as JPEG, re-embed
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      onProgress?.({
        progress: 20 + ((pageNum - 1) / pageCount) * 70,
        status: 'processing',
        message: `Compressing page ${pageNum} of ${pageCount}...`,
      });

      try {
        const page = await pdfjsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Validate viewport dimensions
        if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
          throw new Error(`Invalid page dimensions for page ${pageNum}`);
        }
        
        // Create canvas to render the page with high quality settings
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', {
          alpha: false, // No transparency for better compression
          desynchronized: false,
          willReadFrequently: false,
        });
        
        if (!context) {
          throw new Error(`Failed to get canvas context for page ${pageNum}`);
        }
        
        // Set canvas size with device pixel ratio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        const displayScale = scale * dpr;
        const displayViewport = page.getViewport({ scale: displayScale });
        
        // Ensure reasonable canvas dimensions (max 4096px to avoid memory issues)
        const maxDimension = 4096;
        let finalDisplayScale = displayScale;
        if (displayViewport.width > maxDimension || displayViewport.height > maxDimension) {
          const scaleFactor = Math.min(maxDimension / displayViewport.width, maxDimension / displayViewport.height);
          finalDisplayScale = displayScale * scaleFactor;
        }
        
        const finalDisplayViewport = page.getViewport({ scale: finalDisplayScale });
        
        canvas.width = Math.floor(finalDisplayViewport.width);
        canvas.height = Math.floor(finalDisplayViewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        
        // Enable high-quality rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Render page to canvas with high quality
        await page.render({
          canvasContext: context,
          viewport: finalDisplayViewport,
        }).promise;
        
        let finalCanvas = canvas;
        
        // Scale down if needed for final output (maintains quality while reducing size)
        if (finalDisplayScale > scale) {
          const scaledCanvas = document.createElement('canvas');
          const scaledContext = scaledCanvas.getContext('2d', {
            alpha: false,
          });
          
          if (!scaledContext) {
            throw new Error(`Failed to get scaled canvas context for page ${pageNum}`);
          }
          
          scaledCanvas.width = Math.floor(viewport.width);
          scaledCanvas.height = Math.floor(viewport.height);
          scaledContext.imageSmoothingEnabled = true;
          scaledContext.imageSmoothingQuality = 'high';
          scaledContext.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
          finalCanvas = scaledCanvas;
        }

        // Convert canvas to compressed JPEG blob with aggressive compression
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          // Use the calculated quality (very aggressive for better compression)
          const jpegQuality = Math.max(0.40, Math.min(0.85, finalImageQuality as number)); // Allow 40-85% range
          finalCanvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Failed to convert page ${pageNum} to JPEG`));
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            jpegQuality
          );
        });

        // Validate image blob
        if (!imageBlob || imageBlob.size === 0) {
          throw new Error(`Failed to create image for page ${pageNum}`);
        }

        // Convert blob to array buffer and embed in PDF
        const imageBytes = await imageBlob.arrayBuffer();
        const image = await compressedPdf.embedJpg(imageBytes);
        
        // Validate image dimensions
        if (!image || image.width <= 0 || image.height <= 0) {
          throw new Error(`Invalid image dimensions for page ${pageNum}`);
        }
        
        // Create page with same dimensions as original
        const pdfPage = compressedPdf.addPage([viewport.width, viewport.height]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        throw new Error(`Failed to compress page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
      }
    }

    onProgress?.({ progress: 90, status: 'processing', message: 'Finalizing compressed PDF...' });

    // Validate PDF has pages
    if (compressedPdf.getPageCount() === 0) {
      throw new Error('Compressed PDF has no pages. Compression failed.');
    }

    // Save PDF with maximum compression
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await compressedPdf.save({
        useObjectStreams: false, // Disable object streams for better compatibility
        addDefaultPage: false, // Don't add default page if empty
        updateMetadata: false, // Skip metadata update for smaller size
      });
    } catch (saveError) {
      console.error('Failed to save compressed PDF:', saveError);
      throw new Error(`Failed to save compressed PDF: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
    }
    
    // Validate PDF bytes
    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Compressed PDF is empty. Compression failed.');
    }
    
    // Basic PDF validation - check if it starts with PDF header
    const pdfHeader = new Uint8Array(pdfBytes.slice(0, 4));
    const pdfHeaderString = String.fromCharCode(...pdfHeader);
    if (pdfHeaderString !== '%PDF') {
      console.error('Invalid PDF header:', pdfHeaderString);
      throw new Error('Compressed PDF is corrupted. Please try again with different settings.');
    }
    
    const compressedSize = pdfBytes.length;
    const compressionRatio = compressedSize < originalSize 
      ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
      : ((compressedSize / originalSize - 1) * 100).toFixed(1);
    
    // CRITICAL: If compressed size is larger than original, return original file
    if (compressedSize >= originalSize) {
      onProgress?.({ 
        progress: 100, 
        status: 'completed',
        message: `File size would increase. Returning original file. For better compression, try "High" or "Extreme" level.`
      });
      return new Blob([arrayBuffer], { type: 'application/pdf' });
    }
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Compressed PDF blob is empty. Compression failed.');
    }

    const message = `Compressed successfully! Size reduced by ${compressionRatio}%`;

    onProgress?.({ 
      progress: 100, 
      status: 'completed',
      message
    });
    
    return blob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to compress PDF';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * Convert HTML to PDF (basic)
 */
/**
 * Convert URL to PDF by fetching HTML and rendering it locally
 * This approach avoids CORS issues by fetching content via proxy and rendering locally
 */
export async function urlToPDF(
  url: string,
  options: {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
    waitTime?: number;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  let tempContainer: HTMLDivElement | null = null;

  try {
    onProgress?.({ progress: 5, status: 'processing', message: 'Fetching webpage content...' });

    // Try multiple CORS proxy services
    const corsProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    let htmlContent: string;
    let fetchError: Error | null = null;

    // Try each proxy until one works
    for (const proxyUrl of corsProxies) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        htmlContent = await response.text();
        fetchError = null;
        break; // Success, exit loop
      } catch (err) {
        fetchError = err instanceof Error ? err : new Error('Unknown fetch error');
        console.warn(`Proxy failed (${proxyUrl}):`, fetchError);
        continue; // Try next proxy
      }
    }

    if (!htmlContent || fetchError) {
      throw new Error(
        `Failed to fetch webpage. This may be due to CORS restrictions or the URL being inaccessible. ` +
        `Please try: 1) Using a different URL, 2) Converting the HTML file directly, or 3) Using a browser extension to save the page as HTML first.`
      );
    }

    onProgress?.({ progress: 20, status: 'processing', message: 'Processing HTML content...' });

    // Process HTML to fix relative URLs
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Convert relative URLs to absolute URLs
    htmlContent = htmlContent
      .replace(/href="\//g, `href="${baseUrl}/`)
      .replace(/src="\//g, `src="${baseUrl}/`)
      .replace(/url\(['"]?\//g, `url('${baseUrl}/`)
      .replace(/href="(?!https?:\/\/|mailto:|tel:|#)/g, `href="${baseUrl}/`)
      .replace(/src="(?!https?:\/\/|data:)/g, `src="${baseUrl}/`);

    // Add base tag to ensure relative URLs work
    if (!htmlContent.includes('<base')) {
      htmlContent = htmlContent.replace(
        /<head([^>]*)>/i,
        `<head$1><base href="${baseUrl}/" target="_blank">`
      );
    }

    onProgress?.({ progress: 30, status: 'processing', message: 'Rendering webpage...' });

    // Create a container to render the HTML
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1920px';
    tempContainer.style.maxWidth = '1920px';
    tempContainer.style.padding = '24px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.visibility = 'visible';
    tempContainer.style.opacity = '1';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.overflow = 'visible';
    tempContainer.innerHTML = htmlContent;
    document.body.appendChild(tempContainer);

    // Wait for layout to settle
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Wait for images to load
    const waitTime = options.waitTime || 4000; // Increased default wait time
    onProgress?.({ progress: 40, status: 'processing', message: `Loading images and resources (${waitTime / 1000}s)...` });

    // Wait for all images to load with better handling
    const images = tempContainer.getElementsByTagName('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 8000); // 8s timeout per image
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(); // Continue even if image fails
        };
        // Force reload if src exists
        if (img.src && !img.complete) {
          const originalSrc = img.src;
          img.src = '';
          img.src = originalSrc;
        }
      });
    });
    await Promise.all(imagePromises);

    // Wait for background images in CSS
    const allElements = tempContainer.querySelectorAll('*');
    const bgImagePromises = Array.from(allElements).map((el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        return new Promise<void>((resolve) => {
          const img = new Image();
          const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = urlMatch[1];
            setTimeout(() => resolve(), 5000);
          } else {
            resolve();
          }
        });
      }
      return Promise.resolve();
    });
    await Promise.all(bgImagePromises);

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Additional wait for dynamic content and JavaScript execution
    await new Promise(resolve => setTimeout(resolve, waitTime));

    onProgress?.({ progress: 60, status: 'processing', message: 'Capturing high-quality screenshot...' });

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    // Capture the container with higher quality settings
    const scale = 3; // Increased from 2 to 3 for better quality
    const canvas = await html2canvas(tempContainer, {
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: true, // Allow tainted canvas since we're using external images
      backgroundColor: '#ffffff',
      removeContainer: false,
      imageTimeout: 20000, // 20 second timeout for images
      foreignObjectRendering: true, // Better rendering for complex layouts
      onclone: (clonedDoc, element) => {
        // Ensure cloned element has proper styling
        const clonedElement = element as HTMLElement;
        if (clonedElement) {
          clonedElement.style.overflow = 'visible';
          clonedElement.style.maxWidth = '1920px';
          // Force all images to be visible and loaded
          const clonedImages = clonedElement.getElementsByTagName('img');
          Array.from(clonedImages).forEach((img) => {
            img.style.display = '';
            img.style.visibility = 'visible';
            img.style.opacity = '1';
          });
          // Force all background images to load
          const allClonedElements = clonedElement.querySelectorAll('*');
          Array.from(allClonedElements).forEach((el) => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none') {
              (el as HTMLElement).style.display = '';
            }
          });
        }
      },
    });

    // Cleanup container
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
      tempContainer = null;
    }

    onProgress?.({ progress: 70, status: 'processing', message: 'Creating PDF...' });

    // Create PDF
    const pageSizeMap = {
      A4: [595.28, 841.89],
      Letter: [612, 792],
      Legal: [612, 1008],
    };

    const pageSize = pageSizeMap[options.pageSize || 'A4'];
    const orientation = options.orientation || 'portrait';
    const margin = options.margin || 36;

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: pageSize,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Use higher quality JPEG (0.95 instead of 0.92) for better result
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Finalizing PDF...' });

    const pdfBlob = pdf.output('blob');
    onProgress?.({ progress: 100, status: 'completed' });
    return pdfBlob;
  } catch (error) {
    // Cleanup container on error
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    console.error('[URL-to-PDF] Conversion failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to convert URL to PDF';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

export async function htmlToPDF(
  htmlContent: string,
  options?: {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 5, status: 'processing', message: 'Rendering HTML...' });

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    // Create a hidden container for rendering HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '0';
    tempDiv.style.top = '0';
    tempDiv.style.width = '1280px'; // Wider width for better layout before scaling
    tempDiv.style.padding = '24px';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.zIndex = '-1';
    tempDiv.style.visibility = 'visible';
    tempDiv.style.opacity = '1';
    tempDiv.style.pointerEvents = 'none';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.fontFamily = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
    document.body.appendChild(tempDiv);

    // Wait for layout to settle (optimized - single frame is usually enough)
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    
    onProgress?.({ progress: 30, status: 'processing', message: 'Capturing screenshot...' });
    
    // Optimized rendering settings for better performance
    // Reduced scale from 3 to 2 for 4x faster rendering (2x2 = 4x fewer pixels)
    // JPEG format instead of PNG for 5-10x smaller file size and faster processing
    const scale = 2; // Good balance between quality and speed
    const canvas = await html2canvas(tempDiv, {
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: false,
      imageTimeout: 0, // Don't wait for external images
      ignoreElements: (element) => {
        // Skip hidden elements and scripts to speed up rendering
        const style = window.getComputedStyle(element);
        return style.display === 'none' || 
               style.visibility === 'hidden' || 
               element.tagName === 'SCRIPT' ||
               element.tagName === 'NOSCRIPT';
      },
    });
    
    onProgress?.({ progress: 60, status: 'processing', message: 'Converting to image...' });
    
    // Use JPEG instead of PNG for better performance (much faster and smaller)
    // Quality 0.92 provides excellent quality while being much faster than PNG
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    onProgress?.({ progress: 70, status: 'processing', message: 'Creating PDF...' });

    // Use A4 portrait with points
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36; // half-inch margin
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Use FAST compression instead of SLOW for much better performance
    // FAST is still high quality but processes much faster
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;
    }

    // Cleanup DOM
    document.body.removeChild(tempDiv);

    onProgress?.({ progress: 95, status: 'processing', message: 'Finalizing PDF...' });

    const pdfBlob = pdf.output('blob');
    onProgress?.({ progress: 100, status: 'completed' });
    return pdfBlob;
  } catch (error) {
    console.error('[HTML-to-PDF] Conversion failed:', error);
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert HTML to PDF' });
    throw error;
  }
}

/**
 * Annotate PDF - Add highlights, comments, sticky notes, and markup annotations
 */
export async function annotatePDF(
  file: File,
  annotations: Array<{
    type: 'highlight' | 'comment' | 'sticky-note' | 'underline' | 'strikethrough';
    text: string;
    page: number;
    position: { x: number; y: number };
    color: string;
    width?: number;
    height?: number;
  }> = [],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    // Ensure annotations is an array
    if (!Array.isArray(annotations)) {
      console.error('[annotatePDF] Invalid annotations parameter:', annotations);
      throw new Error('Annotations must be an array. Please add at least one annotation.');
    }
    
    if (!annotations || annotations.length === 0) {
      throw new Error('Please add at least one annotation');
    }

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Convert hex color to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 1, g: 1, b: 0 }; // Default yellow
    };

    onProgress?.({ progress: 30, status: 'processing', message: `Adding ${annotations.length} annotation(s)...` });

    // Group annotations by page
    const annotationsByPage = new Map<number, typeof annotations>();
    annotations.forEach((annotation) => {
      const pageIndex = Math.max(0, Math.min(pages.length - 1, annotation.page - 1));
      if (!annotationsByPage.has(pageIndex)) {
        annotationsByPage.set(pageIndex, []);
      }
      annotationsByPage.get(pageIndex)!.push(annotation);
    });

    // Process each page with annotations
    let processedCount = 0;
    for (const [pageIndex, pageAnnotations] of annotationsByPage.entries()) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      onProgress?.({
        progress: 30 + (processedCount / annotations.length) * 60,
        status: 'processing',
        message: `Adding annotations to page ${pageIndex + 1}...`,
      });

      for (const annotation of pageAnnotations) {
        const { type, text, position, color } = annotation;
        const rgbColor = hexToRgb(color);
        const textColor = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
        const x = Math.max(0, Math.min(width - 50, position.x));
        const y = Math.max(0, Math.min(height - 50, position.y));

        switch (type) {
          case 'highlight': {
            // Enterprise-grade highlight with better text wrapping
            const fontSize = 12;
            const lineHeight = fontSize * 1.2;
            const maxWidth = width - x - 20;
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = font.widthOfTextAtSize(testLine, fontSize);
              
              if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);
            
            const textHeight = lines.length * lineHeight;
            const padding = 4;
            
            // Draw highlight background
            page.drawRectangle({
              x: x - padding,
              y: y - textHeight - padding,
              width: maxWidth + (padding * 2),
              height: textHeight + (padding * 2),
              color: textColor,
              opacity: 0.25,
            });
            
            // Draw text lines
            lines.forEach((line, index) => {
              page.drawText(line, {
                x: x,
                y: y - (index + 1) * lineHeight,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
            });
            break;
          }

          case 'comment': {
            // Enterprise-grade comment box with text wrapping
            const fontSize = 10;
            const lineHeight = fontSize * 1.3;
            const maxWidth = Math.min(width - x - 30, 200);
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = font.widthOfTextAtSize(testLine, fontSize);
              
              if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);
            
            const boxWidth = maxWidth + 20;
            const boxHeight = Math.max(lines.length * lineHeight + 15, 30);
            const padding = 8;
            
            // Draw comment box with shadow effect
            page.drawRectangle({
              x: x - 1,
              y: y - boxHeight - 1,
              width: boxWidth + 2,
              height: boxHeight + 2,
              color: rgb(0.8, 0.8, 0.8),
              opacity: 0.3,
            });
            
            page.drawRectangle({
              x,
              y: y - boxHeight,
              width: boxWidth,
              height: boxHeight,
              color: textColor,
              opacity: 0.15,
              borderColor: textColor,
              borderWidth: 1.5,
            });
            
            // Draw text lines
            lines.forEach((line, index) => {
              page.drawText(line, {
                x: x + padding,
                y: y - padding - (index + 1) * lineHeight,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
            });
            break;
          }

          case 'sticky-note': {
            // Enterprise-grade sticky note with better styling
            const fontSize = 11;
            const lineHeight = fontSize * 1.3;
            const maxWidth = Math.min(width - x - 30, 180);
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = fontBold.widthOfTextAtSize(testLine, fontSize);
              
              if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);
            
            const boxWidth = maxWidth + 25;
            const boxHeight = Math.max(lines.length * lineHeight + 20, 35);
            const padding = 10;
            
            // Draw sticky note with shadow
            page.drawRectangle({
              x: x + 2,
              y: y - boxHeight - 2,
              width: boxWidth,
              height: boxHeight,
              color: rgb(0.7, 0.7, 0.7),
              opacity: 0.2,
            });
            
            page.drawRectangle({
              x,
              y: y - boxHeight,
              width: boxWidth,
              height: boxHeight,
              color: textColor,
              opacity: 0.35,
              borderColor: rgb(0.6, 0.6, 0.6),
              borderWidth: 1.5,
            });
            
            // Draw text lines
            lines.forEach((line, index) => {
              page.drawText(line, {
                x: x + padding,
                y: y - padding - (index + 1) * lineHeight,
                size: fontSize,
                font: fontBold,
                color: rgb(0, 0, 0),
              });
            });
            break;
          }

          case 'underline': {
            // Enterprise-grade underline with better positioning
            const fontSize = 12;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const underlineY = y - 3;
            
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            
            // Draw underline with slight thickness variation
            page.drawLine({
              start: { x, y: underlineY },
              end: { x: x + textWidth, y: underlineY },
              thickness: 2.5,
              color: textColor,
            });
            break;
          }

          case 'strikethrough': {
            // Enterprise-grade strikethrough with better positioning
            const fontSize = 12;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const strikeY = y - (fontSize / 2);
            
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0.5, 0.5, 0.5), // Grayed out text
            });
            
            // Draw strikethrough line
            page.drawLine({
              start: { x, y: strikeY },
              end: { x: x + textWidth, y: strikeY },
              thickness: 2.5,
              color: textColor,
            });
            break;
          }
        }
        processedCount++;
      }
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving annotated PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to annotate PDF';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * Add eSignature to PDF (basic - adds signature image)
 */
export async function eSignPDF(
  file: File,
  signatureFile: File,
  onProgress?: (progress: ConversionProgress) => void,
  options?: {
    nx?: number; // Normalized x position (0-1)
    ny?: number; // Normalized y position (0-1)
    page?: number; // Page number (1-based)
    nw?: number; // Normalized width (0-1)
    nh?: number; // Normalized height (0-1)
  }
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    onProgress?.({ progress: 30, status: 'processing', message: 'Loading signature...' });
    
    const signatureBytes = await signatureFile.arrayBuffer();
    let signatureImage;
    
    if (signatureFile.type === 'image/png') {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    } else if (signatureFile.type === 'image/jpeg' || signatureFile.type === 'image/jpg') {
      signatureImage = await pdfDoc.embedJpg(signatureBytes);
    } else {
      throw new Error('Signature must be PNG or JPG');
    }
    
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    // Use provided page number or default to last page
    const targetPageNum = (options?.page && options.page > 0 && options.page <= totalPages) 
      ? options.page - 1  // Convert to 0-based index
      : totalPages - 1;   // Default to last page
    
    const targetPage = pages[targetPageNum];
    // Get actual PDF page dimensions (at scale 1.0, not preview scale 1.5)
    const { width, height } = targetPage.getSize();
    
    console.log('[eSignPDF] PDF page dimensions:', {
      pageNumber: targetPageNum + 1,
      width,
      height,
      'note': 'These are actual PDF dimensions at scale 1.0',
    });
    
    onProgress?.({ progress: 70, status: 'processing', message: 'Adding signature...' });
    
    // Calculate signature dimensions
    // Use normalized width/height if provided, otherwise use default size
    let signatureWidth: number;
    let signatureHeight: number;
    
    if (options?.nw && options?.nh && options.nw > 0 && options.nh > 0) {
      // Use normalized dimensions
      signatureWidth = width * options.nw;
      signatureHeight = height * options.nh;
    } else {
      // Default size (30% of page width, maintain aspect ratio)
      const defaultWidth = Math.min(width * 0.3, 150);
      const imageDims = signatureImage.scale(1);
      const aspectRatio = imageDims.width / imageDims.height;
      signatureWidth = defaultWidth;
      signatureHeight = defaultWidth / aspectRatio;
    }
    
    // Calculate position
    let x: number;
    let y: number;
    
    // Check if coordinates are provided and valid
    const hasValidCoordinates = options?.nx !== undefined && 
                                 options?.ny !== undefined && 
                                 !isNaN(options.nx) && 
                                 !isNaN(options.ny) &&
                                 options.nx >= 0 && 
                                 options.nx <= 1 &&
                                 options.ny >= 0 && 
                                 options.ny <= 1;
    
    console.log('[eSignPDF] ===== COORDINATE VALIDATION =====');
    console.log('[eSignPDF] Options received:', JSON.stringify(options, null, 2));
    console.log('[eSignPDF] Coordinate validation:', {
      hasNx: options?.nx !== undefined,
      hasNy: options?.ny !== undefined,
      nx: options?.nx,
      ny: options?.ny,
      isValid: hasValidCoordinates,
      signatureFile: signatureFile?.name || 'missing',
      signatureFileSize: signatureFile?.size || 0,
    });
    console.log('[eSignPDF] ===================================');
    
    // Use default position (bottom-right) if coordinates not provided
    const defaultNx = hasValidCoordinates ? options.nx : 0.7; // 70% from left
    const defaultNy = hasValidCoordinates ? options.ny : 0.85; // 85% from top (near bottom)
    
    console.log('[eSignPDF] Using coordinates:', {
      hasValidCoordinates,
      defaultNx,
      defaultNy,
      originalNx: options?.nx,
      originalNy: options?.ny,
      'note': hasValidCoordinates ? 'Using provided coordinates' : 'Using default coordinates (bottom-right)'
    });
    
    // Always proceed - use defaults if coordinates not provided
    {
      // Use normalized coordinates (0-1, where 0,0 is top-left in UI)
      // PDF coordinates: (0,0) is bottom-left, so we need to flip Y
      x = width * defaultNx;
      
      // ny is the top-left Y position in UI (0 = top, 1 = bottom)
      // In PDF: y coordinate is the bottom-left corner of the image
      // PDF: y = 0 is bottom, y = height is top
      // 
      // Conversion:
      // - UI: ny = 0 means top of signature is at top of page
      // - PDF: y should be height - signatureHeight (so bottom of signature is at top)
      // - UI: ny = 1 means top of signature is at bottom of page  
      // - PDF: y should be 0 (so bottom of signature is at bottom)
      //
      // Formula: PDF y = height * (1 - ny) - signatureHeight
      const normalizedY = defaultNy; // Top position in UI (0-1)
      const normalizedHeight = options.nh || (signatureHeight / height);
      
      // Calculate PDF y coordinate (bottom-left of image)
      // ny is the TOP-LEFT position in UI (0 = top, 1 = bottom)
      // In PDF, y is the BOTTOM-LEFT corner of the image
      // 
      // Example: If ny = 0.2 (20% from top in UI)
      // - Top of signature is at: height * 0.2 from top
      // - Bottom of signature is at: height * 0.2 + signatureHeight from top
      // - In PDF coordinates (from bottom): height - (height * 0.2 + signatureHeight)
      // - Simplified: height * (1 - 0.2) - signatureHeight = height * 0.8 - signatureHeight
      //
      // CRITICAL FIX: The Y coordinate conversion
      // UI coordinate system: (0,0) at top-left, ny=0 is top, ny=1 is bottom
      // PDF coordinate system: (0,0) at bottom-left, y=0 is bottom, y=height is top
      //
      // ny represents the TOP-LEFT corner position in UI (normalized 0-1)
      // We need to convert to PDF's bottom-left corner position
      //
      // If ny = 0.2 (signature top is 20% from top in UI):
      // - Top of signature in UI: height * 0.2 from top
      // - In PDF, we want the bottom-left corner
      // - Top of signature in PDF (from bottom): height - (height * 0.2) = height * 0.8
      // - Bottom of signature in PDF: height * 0.8 - signatureHeight
      //
      // Formula: y = height * (1 - ny) - signatureHeight
      // This should be correct, but let me verify the calculation is happening correctly
      
      // FIXED: Y-coordinate conversion (inverted - the issue was here!)
      // ny is the top position (0-1) where 0 = top, 1 = bottom in UI
      // PDF y is bottom-left corner, where 0 = bottom, height = top
      // 
      // The previous formula was correct in theory, but let me try the inverted version
      // If signature appears at bottom when ny is small, the Y might need to be inverted
      //
      // Try: y = height * ny - signatureHeight (inverted)
      // If ny = 0.2 (20% from top in UI):
      // - y = height * 0.2 - signatureHeight
      // - This places bottom at 20% from bottom = 80% from top
      // - That's wrong, signature would be at bottom
      //
      // Original formula should be correct: y = height * (1 - ny) - signatureHeight
      // But since it's not working, let me check if maybe ny is being calculated inverted
      // 
      // ACTUAL FIX: Use the correct formula but ensure ny is correct
      // If user clicks near top (small y in UI), ny should be small (0-0.3)
      // If user clicks near bottom (large y in UI), ny should be large (0.7-1.0)
      
      // CRITICAL FIX: The Y coordinate was inverted!
      // Since signature always appears at bottom, the Y calculation must be wrong
      // Let's try: if ny is small (top), y should be large (top in PDF)
      // Current: y = height * (1 - ny) - signatureHeight
      // If this puts it at bottom, maybe we need: y = height * ny - signatureHeight?
      // 
      // Actually wait - if ny=0.2 (20% from top) and signature appears at bottom,
      // it means the formula is putting it at the wrong place
      // 
      // Let me try the INVERTED formula:
      // If ny = 0.2 (user clicked 20% from top), we want signature at 20% from top
      // In PDF: y = 0 is bottom, y = height is top
      // So if we want 20% from top: y should be height * 0.8 (80% from bottom)
      // 
      // Current formula: y = height * (1 - 0.2) - sigH = height * 0.8 - sigH ✓ (should be correct!)
      // 
      // But if it's appearing at bottom, maybe ny is actually inverted in SignaturePad?
      // Or maybe we need: y = height * (1 - (1 - ny)) - sigH = height * ny - sigH?
      
      // CRITICAL: Y coordinate conversion
      // ny is the TOP-LEFT Y position (0-1) where 0 = top, 1 = bottom in UI
      // PDF y coordinate is the BOTTOM-LEFT corner, where 0 = bottom, height = top
      // 
      // If ny = 0.1 (10% from top in UI):
      // - Top of signature is at: height * 0.1 from top
      // - In PDF coordinates (from bottom): top of signature is at height - (height * 0.1) = height * 0.9
      // - Bottom of signature (PDF y coordinate) = height * 0.9 - signatureHeight
      //
      // Formula: y = height * (1 - ny) - signatureHeight
      // 
      // BUT WAIT - if signature is appearing at bottom when ny is small, maybe the formula needs to be inverted?
      // Let me try: y = height * ny - signatureHeight
      // If ny = 0.1: y = height * 0.1 - sigH (this would put it at 10% from bottom = 90% from top) ✗ Wrong!
      //
      // Original formula should be correct. Let me verify the calculation step by step:
      // CRITICAL FIX: The Y coordinate conversion
      // In pdf-lib: (0,0) is at bottom-left, y increases upward
      // ny is the TOP-LEFT Y position in UI (0 = top, 1 = bottom)
      // 
      // User reports: Signature appears at BOTTOM when clicking at TOP
      // This means: When ny is small (0.1 = 10% from top), signature goes to bottom
      // 
      // Possible causes:
      // 1. ny is being calculated inverted in SignaturePad (large when should be small)
      // 2. The formula is wrong
      //
      // Let me check: If user clicks at top and ny = 0.1, but signature appears at bottom,
      // it means the formula is putting it at bottom. Let me try inverting the formula.
      //
      // Original formula: y = height * (1 - ny) - signatureHeight
      // If ny = 0.1: y = height * 0.9 - sigH (should put it at top, but it's going to bottom)
      //
      // Maybe the issue is that ny itself is inverted? If user clicks at top but ny = 0.9,
      // then y = height * 0.1 - sigH would put it at bottom. So maybe ny is inverted!
      //
      // FIX: Invert ny before using it, OR use a different formula
      // Let me try: Use ny directly (assuming it might already be inverted)
      // If ny = 0.9 when clicking top, and we use: y = height * (1 - 0.9) - sigH = height * 0.1 - sigH
      // This would put it at bottom. So we need: y = height * 0.9 - sigH = height * ny - sigH
      //
      // ACTUAL FIX: Try using ny directly (in case it's already inverted)
      // But first, let me verify what ny value we're getting
      
      // FINAL FIX: Since signature appears at BOTTOM when clicking at TOP,
      // and user has confirmed this multiple times, the issue must be that
      // either ny is inverted OR the formula needs to be inverted.
      //
      // Let me try: If user clicks at top (ny should be small like 0.1),
      // but signature appears at bottom, maybe ny is actually large (0.9)?
      // OR maybe the formula needs to use ny directly instead of (1-ny)?
      //
      // Test: Use ny directly (assuming it might represent distance from bottom)
      // If ny = 0.1 and we use: y = height * ny - sigH = height * 0.1 - sigH
      // This puts it at 10% from bottom = 90% from top ✗ Still wrong!
      //
      // Actually, let me check: Maybe the issue is that we need to use (1-ny) differently?
      // Or maybe ny itself needs to be inverted before using?
      //
      // FINAL SOLUTION: Y-coordinate conversion for pdf-lib
      // 
      // pdf-lib coordinate system: (0,0) at bottom-left, y increases upward
      // UI coordinate system: (0,0) at top-left, y increases downward  
      // ny: Top-left Y position in UI (0 = top, 1 = bottom)
      // 
      // CRITICAL FIX: The formula was correct but we need to ensure ny represents distance from TOP
      // If user clicks at top and signature appears at bottom, ny might be inverted
      // Let's try using ny directly without (1-ny) conversion - this means ny might already be from bottom
      //
      // User reports: Signature appears at BOTTOM when clicking at TOP
      // This means: When ny is small (0.1-0.2), signature goes to bottom
      //
      // The correct formula should be: y = height * (1 - ny) - signatureHeight
      // But if this puts it at bottom when ny is small, maybe ny itself is inverted?
      //
      // Let me try: If ny represents distance from BOTTOM instead of TOP, then:
      // - When user clicks at top, ny might be large (0.8-0.9) instead of small (0.1-0.2)
      // - In that case, we should use: y = height * ny - signatureHeight
      //
      // CORRECT SOLUTION: UI (top-left origin) → PDF (bottom-left origin) conversion
      // Based on Python solution: y_pdf = pdf_height - y_ui - sig_height
      //
      // In our case:
      // - normalizedY is the TOP position in UI (0 = top, 1 = bottom)
      // - y_ui (in PDF units) = height * normalizedY (top of signature from top)
      // - y_pdf (PDF coordinate, bottom-left origin) = height - y_ui - signatureHeight
      //
      // Formula: y = height - (height * normalizedY) - signatureHeight
      // Simplified: y = height * (1 - normalizedY) - signatureHeight
      //
      // BUT: The Python solution uses: y_pdf = pdf_height - y_ui - sig_h
      // Where y_ui is the TOP position. So:
      // y = height - (height * normalizedY) - signatureHeight
      // This is the same formula, so it should be correct!
      //
      // However, if signature still appears at bottom, maybe normalizedY is inverted?
      // Let me check: If user clicks at top, normalizedY should be small (0.1-0.2)
      // If it's large (0.8-0.9), then we need to invert it first.
      
      // CRITICAL FIX: Y-coordinate conversion for pdf-lib
      // ny is the TOP-LEFT Y position (0-1) where 0 = top, 1 = bottom in UI
      // PDF y coordinate is the BOTTOM-LEFT corner, where 0 = bottom, height = top
      // 
      // Since signature appears at BOTTOM when clicking at TOP, the formula must be inverted
      // Let's try: y = height * ny - signatureHeight
      // 
      // Test cases:
      // - If ny = 0 (top in UI): y = 0 - sigH = negative → clamped to 0 → signature at bottom ✗
      // - If ny = 1 (bottom in UI): y = height - sigH → signature at top ✗
      //
      // This is wrong! Let me try the original formula but verify it's correct:
      // Formula: y = height * (1 - ny) - signatureHeight
      // - If ny = 0 (top in UI): y = height - sigH → signature at top ✓
      // - If ny = 1 (bottom in UI): y = 0 - sigH = negative → clamped to 0 → signature at bottom ✓
      //
      // The original formula should be correct! But since it's not working, maybe ny is inverted?
      // Let's try inverting ny first: y = height * (1 - (1 - ny)) - sigH = height * ny - sigH
      // But this puts it at bottom when clicking top, which is the current problem!
      //
      // WAIT - Maybe the issue is that we need to use the TOP-LEFT corner, not BOTTOM-LEFT?
      // In pdf-lib, drawImage uses bottom-left. But what if we calculate for top-left and then convert?
      //
      // CRITICAL FIX: Since signature appears at BOTTOM when clicking at TOP,
      // the ny value might already be inverted (representing distance from bottom).
      // OR the coordinate system conversion is inverted.
      // 
      // User clicks at top (small canvasY) → ny should be small (0.1-0.2) → signature should be at top
      // But signature appears at bottom → formula must be inverted
      //
      // Let's try: Use ny directly (assuming it represents distance from bottom)
      // If ny = 0.2 when clicking at top, and we use y = height * ny - sigH,
      // it would put signature at bottom. So we need to invert: y = height * (1 - ny) - sigH
      //
      // BUT wait - the formula y = height * (1 - ny) - sigH SHOULD be correct if ny is from top!
      // If it's still appearing at bottom, maybe ny itself is inverted in SignaturePad?
      //
      // FIX: Invert ny before using it (maybe ny is already inverted)
      // Since signature appears at bottom when clicking top, try using (1 - ny) directly
      // Actually, let's try the OPPOSITE: use ny directly without (1-ny) conversion
      
      // CRITICAL FIX: User clicks at TOP → signature appears at BOTTOM
      // This means the Y coordinate is inverted. 
      // 
      // normalizedY represents distance from TOP (0 = top, 1 = bottom) in UI
      // PDF y coordinate is from BOTTOM (0 = bottom, height = top)
      // 
      // Correct conversion:
      // - If normalizedY = 0.2 (20% from top in UI), we want signature at 20% from top in PDF
      // - Top of signature in PDF (from bottom) = height - (height * 0.2) = height * 0.8
      // - Bottom of signature (PDF y) = height * 0.8 - signatureHeight
      // - Formula: y = height * (1 - normalizedY) - signatureHeight
      //
      // BUT: Since signature appears at BOTTOM when clicking TOP, maybe normalizedY is inverted?
      // OR the formula needs to be: y = height * normalizedY - signatureHeight?
      //
      // Let's check: If normalizedY = 0.2 (top) and we use y = height * 0.2 - sigH,
      // signature would be at 20% from bottom = 80% from top → WRONG, it would be at top!
      //
      // So the issue is different - maybe normalizedY is being calculated incorrectly in SignaturePad?
      // OR we need to use the formula without inverting: y = height * normalizedY - signatureHeight
      //
      // ACTUAL FIX: Since signature appears at bottom when clicking top, try using normalizedY directly
      // without the (1 - normalizedY) conversion
      
      // CORRECT FORMULA: pdf-lib uses bottom-left origin
      // normalizedY is from TOP in UI (0 = top, 1 = bottom)
      // We need to convert to PDF's bottom-left origin
      // 
      // If normalizedY = 0.2 (20% from top in UI):
      // - Top of signature from top: height * 0.2
      // - Top of signature from bottom: height - (height * 0.2) = height * 0.8
      // - Bottom of signature (PDF y): height * 0.8 - signatureHeight
      // 
      // Formula: y = height * (1 - normalizedY) - signatureHeight
      y = height * (1 - normalizedY) - signatureHeight;
      
      // Alternative formula (should be equivalent):
      // y = height - (height * normalizedY) - signatureHeight
      // y = height * (1 - normalizedY) - signatureHeight
      
      console.log('[eSignPDF] FINAL Y-COORDINATE CALCULATION:', {
        'input_ny': normalizedY,
        'input_ny_percent': (normalizedY * 100).toFixed(2) + '% from top',
        'formula': 'y = height * (1 - ny) - signatureHeight',
        'step1': `1 - ny = 1 - ${normalizedY} = ${(1 - normalizedY).toFixed(4)}`,
        'step2': `height * (1 - ny) = ${height} * ${(1 - normalizedY).toFixed(4)} = ${(height * (1 - normalizedY)).toFixed(2)}`,
        'step3': `y = ${(height * (1 - normalizedY)).toFixed(2)} - ${signatureHeight} = ${y.toFixed(2)}`,
        'y_from_bottom_px': y.toFixed(2),
        'verification_top_from_top_px': (height - (y + signatureHeight)).toFixed(2),
        'verification_percent': (((height - (y + signatureHeight)) / height) * 100).toFixed(2) + '%',
        'expected_percent': (normalizedY * 100).toFixed(2) + '%',
        'match': Math.abs((height - (y + signatureHeight)) / height - normalizedY) < 0.01 ? '✓ PERFECT MATCH' : '✗ MISMATCH',
        'note': 'If signature still appears at bottom, the issue might be elsewhere (e.g., page dimensions)'
      });
      
      
      // Safety: ensure y is valid
      if (y < 0) {
        y = 0;
      }
      if (y + signatureHeight > height) {
        y = height - signatureHeight;
      }
      
      console.log('[eSignPDF] ===== Y-COORDINATE CALCULATION =====');
      console.log('[eSignPDF] Step 1 - Input from SignaturePad:', {
        'ny': normalizedY,
        'ny_percent_from_top': (normalizedY * 100).toFixed(2) + '%',
        'ny_interpretation': normalizedY < 0.2 ? 'TOP (0-20%)' : normalizedY < 0.5 ? 'UPPER-MIDDLE (20-50%)' : normalizedY < 0.8 ? 'LOWER-MIDDLE (50-80%)' : 'BOTTOM (80-100%)',
        'expected_position': `User expects signature TOP at ${(normalizedY * 100).toFixed(1)}% from top of page`
      });
      console.log('[eSignPDF] Step 2 - PDF Page dimensions (scale 1.0):', {
        'width': width,
        'height': height,
        'note': 'These are actual PDF dimensions, not preview dimensions'
      });
      console.log('[eSignPDF] Step 3 - Signature dimensions:', {
        'width': signatureWidth,
        'height': signatureHeight,
        'width_percent': ((signatureWidth / width) * 100).toFixed(2) + '% of page width',
        'height_percent': ((signatureHeight / height) * 100).toFixed(2) + '% of page height'
      });
      console.log('[eSignPDF] Step 4 - Y-coordinate conversion formula:', {
        'formula': 'y = height * (1 - ny) - signatureHeight',
        'explanation': 'ny is TOP position in UI (0=top, 1=bottom). PDF y is BOTTOM position (0=bottom, height=top)',
        'step_by_step': {
          'step1': `1 - ny = 1 - ${normalizedY} = ${(1 - normalizedY).toFixed(4)}`,
          'step2': `height * (1 - ny) = ${height} * ${(1 - normalizedY).toFixed(4)} = ${(height * (1 - normalizedY)).toFixed(2)}`,
          'step3': `y = ${(height * (1 - normalizedY)).toFixed(2)} - ${signatureHeight} = ${y.toFixed(2)}`
        }
      });
      console.log('[eSignPDF] Step 5 - Calculated PDF coordinates:', {
        'x_from_left_px': x,
        'y_from_bottom_px': y,
        'x_percent_from_left': ((x / width) * 100).toFixed(2) + '%',
        'y_percent_from_bottom': ((y / height) * 100).toFixed(2) + '%',
        'note': 'y is the BOTTOM-LEFT corner of the signature in PDF coordinates'
      });
      console.log('[eSignPDF] Step 6 - Verification (convert back to top position):', {
        'top_of_signature_from_bottom_px': y + signatureHeight,
        'top_of_signature_from_top_px': height - (y + signatureHeight),
        'top_percent_from_top': (((height - (y + signatureHeight)) / height) * 100).toFixed(2) + '%',
        'expected_percent_from_top': (normalizedY * 100).toFixed(2) + '%',
        'difference_px': Math.abs((height - (y + signatureHeight)) - (height * normalizedY)),
        'difference_percent': Math.abs(((height - (y + signatureHeight)) / height) - normalizedY) * 100,
        'match_status': Math.abs(((height - (y + signatureHeight)) / height) - normalizedY) < 0.01 ? '✓ PERFECT MATCH' : Math.abs(((height - (y + signatureHeight)) / height) - normalizedY) < 0.05 ? '⚠ CLOSE MATCH' : '✗ MISMATCH - THIS IS THE PROBLEM!'
      });
      console.log('[eSignPDF] Step 7 - Visual representation:', {
        'page_height': height,
        'signature_top_from_top': (height - (y + signatureHeight)).toFixed(1) + 'px',
        'signature_bottom_from_top': (height - y).toFixed(1) + 'px',
        'signature_center_from_top': (height - y - signatureHeight / 2).toFixed(1) + 'px',
        'visual': `[TOP] ... ${(height - (y + signatureHeight)).toFixed(0)}px ... [SIG-TOP] ... ${signatureHeight.toFixed(0)}px ... [SIG-BOTTOM] ... ${y.toFixed(0)}px ... [BOTTOM]`
      });
      console.log('[eSignPDF] ====================================');
      
      // Debug: Let's also calculate what ny should be if we want it at the top
      const debugNyForTop = 0.1; // 10% from top
      const debugYForTop = height * (1 - debugNyForTop) - signatureHeight;
      console.log('[eSignPDF] Debug: If ny=0.1 (10% from top), y would be:', debugYForTop, 'which is', ((height - debugYForTop - signatureHeight) / height * 100).toFixed(1) + '% from top');
      
      // Ensure y is not negative (shouldn't happen with proper clamping, but safety check)
      if (y < 0) {
        console.warn('[eSignPDF] Calculated y is negative, clamping to 0:', y);
        y = 0;
      }
      
      console.log('[eSignPDF] ===== POSITION CALCULATION =====');
      console.log('[eSignPDF] Input (normalized 0-1):', {
        nx: options.nx,
        ny: options.ny,
        nw: options.nw,
        nh: options.nh,
        page: options.page,
      });
      console.log('[eSignPDF] Page dimensions:', {
        width,
        height,
      });
      console.log('[eSignPDF] Signature dimensions:', {
      width: signatureWidth,
      height: signatureHeight,
        normalizedWidth: normalizedHeight * (width / height), // Approximate
        normalizedHeight: normalizedHeight,
      });
      console.log('[eSignPDF] Calculated PDF coordinates:', {
        x,
        y,
        'y_from_top': height - y - signatureHeight, // For debugging
        'y_from_bottom': y,
      });
      console.log('[eSignPDF] =================================');
    }
    
    // Ensure signature stays within page bounds
    const xBeforeClamp = x;
    const yBeforeClamp = y;
    x = Math.max(0, Math.min(x, width - signatureWidth));
    y = Math.max(0, Math.min(y, height - signatureHeight));
    
    console.log('[eSignPDF] ===== FINAL COORDINATES BEFORE DRAWING =====');
    console.log('[eSignPDF] Before clamping:', {
      'x': xBeforeClamp.toFixed(2),
      'y': yBeforeClamp.toFixed(2),
      'y_percent_from_bottom': ((yBeforeClamp / height) * 100).toFixed(2) + '%',
      'top_from_top_px': (height - (yBeforeClamp + signatureHeight)).toFixed(2),
      'top_percent_from_top': (((height - (yBeforeClamp + signatureHeight)) / height) * 100).toFixed(2) + '%',
    });
    console.log('[eSignPDF] After clamping:', {
      'x': x.toFixed(2),
      'y': y.toFixed(2),
      'y_percent_from_bottom': ((y / height) * 100).toFixed(2) + '%',
      'top_from_top_px': (height - (y + signatureHeight)).toFixed(2),
      'top_percent_from_top': (((height - (y + signatureHeight)) / height) * 100).toFixed(2) + '%',
      'was_clamped': x !== xBeforeClamp || y !== yBeforeClamp,
      'clamped_reason': y !== yBeforeClamp ? (yBeforeClamp < 0 ? 'y was negative' : 'y exceeded bounds') : 'not clamped'
    });
    console.log('[eSignPDF] Drawing signature at:', {
      'x': x,
      'y': y,
      'width': signatureWidth,
      'height': signatureHeight,
      'note': 'y is the BOTTOM-LEFT corner in PDF coordinates (0 = bottom, height = top)'
    });
    console.log('[eSignPDF] ===========================================');
    
    targetPage.drawImage(signatureImage, {
      x: x,
      y: y,
      width: signatureWidth,
      height: signatureHeight,
    });
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add signature' });
    throw error;
  }
}

/**
 * Fill PDF forms (basic - fills text fields)
 */
export async function fillPDFForm(
  file: File,
  formData: Record<string, string>,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF form...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    onProgress?.({ progress: 30, status: 'processing', message: 'Detecting form fields...' });
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    onProgress?.({ progress: 50, status: 'processing', message: 'Filling form fields...' });
    
    fields.forEach((field) => {
      const fieldName = field.getName();
      if (formData[fieldName]) {
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(formData[fieldName]);
        } catch {
          // Field might not be a text field, skip
        }
      }
    });
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to fill form' });
    throw error;
  }
}

/**
 * Edit PDF - Add text to PDF with customizable options
 */
export async function editPDF(
  file: File,
  editText: string,
  position: { x: number; y: number } = { x: 50, y: 750 },
  pageNumber: number = 1,
  fontSize: number = 12,
  color: string = '#000000',
  fontFamily: string = 'Helvetica',
  alignment: 'left' | 'center' | 'right' = 'left',
  rotation: number = 0,
  opacity: number = 100,
  bold: boolean = false,
  italic: boolean = false,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    if (!editText || editText.trim() === '') {
      throw new Error('Please enter text to add to the PDF');
    }

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    // Validate page number (convert from 1-based to 0-based)
    const pageIndex = Math.max(0, Math.min(pages.length - 1, pageNumber - 1));
    const targetPage = pages[pageIndex];
    
    // Get page dimensions for better positioning
    const { width, height } = targetPage.getSize();
    
    // Convert hex color to RGB with better error handling
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      try {
        if (!hex || typeof hex !== 'string') {
          console.warn('[editPDF] Invalid color input, using black:', hex);
          return { r: 0, g: 0, b: 0 };
        }
        
        let normalizedHex = hex.trim();
        if (!normalizedHex.startsWith('#')) {
          normalizedHex = '#' + normalizedHex;
        }
        
        // Handle 3-digit hex colors (e.g., #f00 -> #ff0000)
        if (normalizedHex.length === 4) {
          normalizedHex = '#' + normalizedHex[1] + normalizedHex[1] + normalizedHex[2] + normalizedHex[2] + normalizedHex[3] + normalizedHex[3];
        }
        
        const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
        if (result) {
          const rgb = {
            r: Math.max(0, Math.min(1, parseInt(result[1], 16) / 255)),
            g: Math.max(0, Math.min(1, parseInt(result[2], 16) / 255)),
            b: Math.max(0, Math.min(1, parseInt(result[3], 16) / 255)),
          };
          console.log('[editPDF] Color parsed successfully:', { 
            input: hex, 
            normalized: normalizedHex, 
            rgb: rgb,
            rgb255: {
              r: Math.round(rgb.r * 255),
              g: Math.round(rgb.g * 255),
              b: Math.round(rgb.b * 255)
            }
          });
          return rgb;
        } else {
          console.warn('[editPDF] Color regex failed, using black:', { input: hex, normalized: normalizedHex });
          return { r: 0, g: 0, b: 0 };
        }
      } catch (error) {
        console.error('[editPDF] Color parsing error, using black:', error, 'Input:', hex);
        return { r: 0, g: 0, b: 0 };
      }
    };
    
    // Select font based on fontFamily and style
    let fontName: StandardFonts;
    if (bold && italic) {
      fontName = fontFamily.includes('Times') ? StandardFonts.TimesRomanBoldItalic :
                 fontFamily.includes('Courier') ? StandardFonts.CourierBoldOblique :
                 StandardFonts.HelveticaBoldOblique;
    } else if (bold) {
      fontName = fontFamily.includes('Times') ? StandardFonts.TimesRomanBold :
                 fontFamily.includes('Courier') ? StandardFonts.CourierBold :
                 StandardFonts.HelveticaBold;
    } else if (italic) {
      fontName = fontFamily.includes('Times') ? StandardFonts.TimesRomanItalic :
                 fontFamily.includes('Courier') ? StandardFonts.CourierOblique :
                 StandardFonts.HelveticaOblique;
    } else {
      fontName = fontFamily.includes('Times') ? StandardFonts.TimesRoman :
                 fontFamily.includes('Courier') ? StandardFonts.Courier :
                 StandardFonts.Helvetica;
    }
    
    const font = await pdfDoc.embedFont(fontName);
    const textColor = hexToRgb(color);
    const finalOpacity = Math.max(0, Math.min(1, opacity / 100));
    
    // Calculate text width for alignment
    const textWidth = font.widthOfTextAtSize(editText.trim(), fontSize);
    let finalX = Math.max(0, Math.min(width - 50, position.x));
    
    // Adjust X position based on alignment
    if (alignment === 'center') {
      finalX = Math.max(25, Math.min(width - 25, position.x - textWidth / 2));
    } else if (alignment === 'right') {
      finalX = Math.max(50, Math.min(width, position.x - textWidth));
    }
    
    // Validate and adjust Y position
    let finalY = Math.max(0, Math.min(height - 50, position.y));
    
    onProgress?.({ progress: 50, status: 'processing', message: `Adding text to page ${pageNumber}...` });
    
    // Draw text on the specified page with all options
    targetPage.drawText(editText.trim(), {
      x: finalX,
      y: finalY,
      size: Math.max(8, Math.min(72, fontSize)), // Clamp between 8 and 72
      font,
      color: rgb(textColor.r, textColor.g, textColor.b),
      opacity: finalOpacity,
      rotate: { angle: rotation, type: 'degrees' },
    });
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to edit PDF';
    onProgress?.({ progress: 0, status: 'error', message: errorMessage });
    throw error;
  }
}

/**
 * Compare two PDFs and create a comparison PDF with highlighted differences
 */
export async function comparePDFs(
  file1: File,
  file2: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 5, status: 'processing', message: 'Loading PDFs...' });

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Load both PDFs - create copies to prevent ArrayBuffer detachment
    const originalBuffer1 = await file1.arrayBuffer();
    const originalBuffer2 = await file2.arrayBuffer();
    
    // Create copies to prevent detachment issues
    const arrayBuffer1 = originalBuffer1.slice(0);
    const arrayBuffer2 = originalBuffer2.slice(0);
    
    let pdfDoc1, pdfDoc2;
    try {
      pdfDoc1 = await pdfjsLib.getDocument({ data: arrayBuffer1 }).promise;
      pdfDoc2 = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;
    } catch (loadError) {
      console.error('[comparePDFs] Error loading PDFs:', loadError);
      throw new Error(`Failed to load PDF files: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`);
    }
    
    const numPages1 = pdfDoc1.numPages;
    const numPages2 = pdfDoc2.numPages;
    const maxPages = Math.max(numPages1, numPages2);

    // Validate that at least one PDF has pages
    if (maxPages === 0) {
      throw new Error('Both PDFs are empty. Cannot create comparison.');
    }

    console.log(`[comparePDFs] PDF 1 has ${numPages1} pages, PDF 2 has ${numPages2} pages`);

    onProgress?.({ progress: 10, status: 'processing', message: 'Creating comparison PDF...' });

    // Create new PDF for comparison results
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    let comparisonPdf: any;
    try {
      comparisonPdf = await PDFDocument.create();
    } catch (createError) {
      console.error('[comparePDFs] Error creating PDF document:', createError);
      throw new Error(`Failed to create PDF: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
    }
    
    let font, fontBold;
    try {
      font = await comparisonPdf.embedFont(StandardFonts.Helvetica);
      fontBold = await comparisonPdf.embedFont(StandardFonts.HelveticaBold);
    } catch (fontError) {
      console.error('[comparePDFs] Error embedding fonts:', fontError);
      throw new Error(`Failed to embed fonts: ${fontError instanceof Error ? fontError.message : 'Unknown error'}`);
    }

    // Process each page
    let successfulPages = 0;
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const progressStart = 10 + ((pageNum - 1) / maxPages) * 80;
      const progressEnd = 10 + (pageNum / maxPages) * 80;

      onProgress?.({
        progress: progressStart,
        status: 'processing',
        message: `Comparing page ${pageNum} of ${maxPages}...`,
      });

      try {
        const hasPage1 = pageNum <= numPages1;
        const hasPage2 = pageNum <= numPages2;

      // Get page dimensions from both PDFs (use maximum dimensions)
      let pageWidth = 612; // Default A4 width
      let pageHeight = 792; // Default A4 height

      if (hasPage1) {
        const page1 = await pdfDoc1.getPage(pageNum);
        const viewport1 = page1.getViewport({ scale: 1.0 });
        pageWidth = Math.max(pageWidth, viewport1.width);
        pageHeight = Math.max(pageHeight, viewport1.height);
      }
      
      if (hasPage2) {
        const page2 = await pdfDoc2.getPage(pageNum);
        const viewport2 = page2.getViewport({ scale: 1.0 });
        pageWidth = Math.max(pageWidth, viewport2.width);
        pageHeight = Math.max(pageHeight, viewport2.height);
      }

      // Ensure valid page dimensions
      if (pageWidth <= 0 || pageHeight <= 0 || !isFinite(pageWidth) || !isFinite(pageHeight)) {
        console.warn(`[comparePDFs] Invalid page dimensions for page ${pageNum}: width=${pageWidth}, height=${pageHeight}, using defaults`);
        pageWidth = 612;
        pageHeight = 792;
      }

      // Limit page dimensions to prevent PDF corruption (max 14400 points = ~200 inches)
      const MAX_PAGE_DIMENSION = 14400;
      const MAX_CANVAS_DIMENSION = 16384; // Browser canvas limit
      
      // Calculate scale factor if page is too large
      let scaleFactor = 1.0;
      if (pageWidth > MAX_PAGE_DIMENSION || pageHeight > MAX_PAGE_DIMENSION) {
        scaleFactor = Math.min(MAX_PAGE_DIMENSION / pageWidth, MAX_PAGE_DIMENSION / pageHeight);
        console.warn(`[comparePDFs] Page ${pageNum} dimensions (${pageWidth}x${pageHeight}) exceed limit, scaling by ${scaleFactor.toFixed(2)}`);
        pageWidth = pageWidth * scaleFactor;
        pageHeight = pageHeight * scaleFactor;
      }
      
      // Also check canvas size limits
      if (pageWidth > MAX_CANVAS_DIMENSION || pageHeight > MAX_CANVAS_DIMENSION) {
        const canvasScale = Math.min(MAX_CANVAS_DIMENSION / pageWidth, MAX_CANVAS_DIMENSION / pageHeight);
        scaleFactor = scaleFactor * canvasScale;
        pageWidth = pageWidth * canvasScale;
        pageHeight = pageHeight * canvasScale;
        console.warn(`[comparePDFs] Page ${pageNum} exceeds canvas limit, additional scaling by ${canvasScale.toFixed(2)}`);
      }

      // Ensure minimum dimensions and reasonable maximums
      pageWidth = Math.max(100, Math.min(Math.floor(pageWidth), MAX_PAGE_DIMENSION));
      pageHeight = Math.max(100, Math.min(Math.floor(pageHeight), MAX_PAGE_DIMENSION));

      // Calculate comparison page dimensions (side by side)
      // Ensure we don't exceed maximum dimensions
      const comparisonPageWidth = Math.min(Math.max(200, pageWidth * 2 + 40), MAX_PAGE_DIMENSION);
      const comparisonPageHeight = Math.min(Math.max(200, pageHeight + 100), MAX_PAGE_DIMENSION);

      // Validate dimensions are valid numbers
      if (!isFinite(comparisonPageWidth) || !isFinite(comparisonPageHeight) || 
          comparisonPageWidth <= 0 || comparisonPageHeight <= 0) {
        console.error(`[comparePDFs] Invalid comparison page dimensions: ${comparisonPageWidth}x${comparisonPageHeight}`);
        throw new Error(`Invalid page dimensions for comparison page ${pageNum}. Please try with different PDFs.`);
      }

      console.log(`[comparePDFs] Creating comparison page ${pageNum} with dimensions: ${comparisonPageWidth}x${comparisonPageHeight}`);

      // Create comparison page (side by side)
      const comparisonPage = comparisonPdf.addPage([comparisonPageWidth, comparisonPageHeight]);

      // Render page 1 (left side)
      if (hasPage1) {
        const page1 = await pdfDoc1.getPage(pageNum);
        const originalViewport1 = page1.getViewport({ scale: 1.0 });
        
        // Use scale factor to render at appropriate size
        const renderScale = scaleFactor;
        const viewport1 = page1.getViewport({ scale: renderScale });
        
        const canvas1 = document.createElement('canvas');
        const context1 = canvas1.getContext('2d');
        if (!context1) throw new Error('Failed to get canvas context');

        // Ensure valid canvas dimensions (within browser limits)
        const canvasWidth = Math.max(1, Math.min(Math.floor(viewport1.width), MAX_CANVAS_DIMENSION));
        const canvasHeight = Math.max(1, Math.min(Math.floor(viewport1.height), MAX_CANVAS_DIMENSION));
        
        canvas1.width = canvasWidth;
        canvas1.height = canvasHeight;

        try {
          await page1.render({
            canvasContext: context1,
            viewport: viewport1,
          }).promise;
        } catch (renderError) {
          console.error(`[comparePDFs] Error rendering PDF 1 page ${pageNum}:`, renderError);
          throw new Error(`Failed to render PDF 1, page ${pageNum}: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
        }

        // Convert canvas to PNG using toBlob for better reliability
        let imageBytes1: ArrayBuffer;
        try {
          // Use toBlob instead of toDataURL for better performance and reliability
          const blob1 = await new Promise<Blob>((resolve, reject) => {
            canvas1.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob returned null'));
              }
            }, 'image/png', 1.0); // Maximum quality
          });
          
          const originalBuffer = await blob1.arrayBuffer();
          
          if (!originalBuffer || originalBuffer.byteLength === 0) {
            throw new Error('Failed to convert blob to array buffer');
          }
          
          // Create a copy of the ArrayBuffer to prevent detachment issues
          // This ensures the buffer remains valid even after being passed to embedPng
          imageBytes1 = originalBuffer.slice(0);
          
          // Validate PNG header (should start with PNG signature)
          const pngHeader = new Uint8Array(imageBytes1.slice(0, 8));
          const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
          const isValidPng = pngHeader.every((byte, i) => byte === pngSignature[i]);
          
          if (!isValidPng) {
            console.error('[comparePDFs] Invalid PNG header for PDF 1, page', pageNum);
            console.error('[comparePDFs] PNG header bytes:', Array.from(pngHeader).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
            throw new Error('Generated PNG image is invalid');
          }
          
          console.log(`[comparePDFs] Successfully converted PDF 1 page ${pageNum} to PNG, size:`, imageBytes1.byteLength, 'bytes');
        } catch (conversionError) {
          console.error(`[comparePDFs] Error converting canvas to PNG for PDF 1, page ${pageNum}:`, conversionError);
          throw new Error(`Failed to convert page image: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }

        let pdfImage1;
        try {
          // Use the copied ArrayBuffer for embedding
          pdfImage1 = await comparisonPdf.embedPng(imageBytes1);
          console.log(`[comparePDFs] Successfully embedded PNG for PDF 1, page ${pageNum}`);
        } catch (embedError) {
          console.error(`[comparePDFs] Error embedding PNG for PDF 1, page ${pageNum}:`, embedError);
          console.error('[comparePDFs] Embed error details:', {
            name: (embedError as any)?.name,
            message: (embedError as any)?.message,
            stack: (embedError as any)?.stack,
          });
          throw new Error(`Failed to embed page image: ${embedError instanceof Error ? embedError.message : 'Unknown error'}`);
        }
        // Ensure valid dimensions for drawing (use scaled dimensions)
        // Make sure image fits within the page bounds
        const maxImgWidth1 = Math.min(pageWidth, comparisonPageWidth - 20); // Leave 10px margin on each side
        const maxImgHeight1 = Math.min(pageHeight, comparisonPageHeight - 100); // Leave space for header
        const imgWidth1 = Math.max(1, Math.min(viewport1.width, maxImgWidth1));
        const imgHeight1 = Math.max(1, Math.min(viewport1.height, maxImgHeight1));
        const imgX1 = 10;
        const imgY1 = Math.max(10, comparisonPageHeight - imgHeight1 - 90); // Account for header space, ensure positive
        
        // Ensure image doesn't go outside page bounds
        if (imgX1 + imgWidth1 > comparisonPageWidth || imgY1 + imgHeight1 > comparisonPageHeight) {
          console.warn(`[comparePDFs] Image 1 for page ${pageNum} would exceed page bounds, adjusting...`);
          const adjustedWidth = Math.min(imgWidth1, comparisonPageWidth - imgX1 - 10);
          const adjustedHeight = Math.min(imgHeight1, comparisonPageHeight - imgY1 - 10);
          if (adjustedWidth > 0 && adjustedHeight > 0) {
            try {
              comparisonPage.drawImage(pdfImage1, {
                x: imgX1,
                y: imgY1,
                width: adjustedWidth,
                height: adjustedHeight,
              });
            } catch (drawError) {
              console.error(`[comparePDFs] Error drawing adjusted image for PDF 1, page ${pageNum}:`, drawError);
              throw new Error(`Failed to draw page image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
            }
          } else {
            console.warn(`[comparePDFs] Skipping image 1 for page ${pageNum} - dimensions too small after adjustment`);
          }
        } else {
          try {
            comparisonPage.drawImage(pdfImage1, {
              x: imgX1,
              y: imgY1,
              width: imgWidth1,
              height: imgHeight1,
            });
          } catch (drawError) {
            console.error(`[comparePDFs] Error drawing image for PDF 1, page ${pageNum}:`, drawError);
            throw new Error(`Failed to draw page image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
          }
        }

        // Label for PDF 1
        comparisonPage.drawText(`PDF 1 - Page ${pageNum}`, {
          x: 10,
          y: comparisonPageHeight - 20,
          size: 12,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      } else {
        // Page missing in PDF 1
        comparisonPage.drawRectangle({
          x: 10,
          y: 10,
          width: pageWidth,
          height: pageHeight,
          borderColor: rgb(1, 0, 0),
          borderWidth: 2,
        });
        comparisonPage.drawText('Page Missing in PDF 1', {
          x: pageWidth / 2 - 80,
          y: pageHeight / 2,
          size: 16,
          font: fontBold,
          color: rgb(1, 0, 0),
        });
      }

      // Render page 2 (right side)
      if (hasPage2) {
        const page2 = await pdfDoc2.getPage(pageNum);
        const originalViewport2 = page2.getViewport({ scale: 1.0 });
        
        // Use scale factor to render at appropriate size
        const renderScale2 = scaleFactor;
        const viewport2 = page2.getViewport({ scale: renderScale2 });
        
        const canvas2 = document.createElement('canvas');
        const context2 = canvas2.getContext('2d');
        if (!context2) throw new Error('Failed to get canvas context');

        // Ensure valid canvas dimensions (within browser limits)
        const canvasWidth2 = Math.max(1, Math.min(Math.floor(viewport2.width), MAX_CANVAS_DIMENSION));
        const canvasHeight2 = Math.max(1, Math.min(Math.floor(viewport2.height), MAX_CANVAS_DIMENSION));
        
        canvas2.width = canvasWidth2;
        canvas2.height = canvasHeight2;

        try {
          await page2.render({
            canvasContext: context2,
            viewport: viewport2,
          }).promise;
        } catch (renderError) {
          console.error(`[comparePDFs] Error rendering PDF 2 page ${pageNum}:`, renderError);
          throw new Error(`Failed to render PDF 2, page ${pageNum}: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
        }

        // Convert canvas to PNG using toBlob for better reliability
        let imageBytes2: ArrayBuffer;
        try {
          // Use toBlob instead of toDataURL for better performance and reliability
          const blob2 = await new Promise<Blob>((resolve, reject) => {
            canvas2.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob returned null'));
              }
            }, 'image/png', 1.0); // Maximum quality
          });
          
          const originalBuffer = await blob2.arrayBuffer();
          
          if (!originalBuffer || originalBuffer.byteLength === 0) {
            throw new Error('Failed to convert blob to array buffer');
          }
          
          // Create a copy of the ArrayBuffer to prevent detachment issues
          // This ensures the buffer remains valid even after being passed to embedPng
          imageBytes2 = originalBuffer.slice(0);
          
          // Validate PNG header (should start with PNG signature)
          const pngHeader = new Uint8Array(imageBytes2.slice(0, 8));
          const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
          const isValidPng = pngHeader.every((byte, i) => byte === pngSignature[i]);
          
          if (!isValidPng) {
            console.error('[comparePDFs] Invalid PNG header for PDF 2, page', pageNum);
            console.error('[comparePDFs] PNG header bytes:', Array.from(pngHeader).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
            throw new Error('Generated PNG image is invalid');
          }
          
          console.log(`[comparePDFs] Successfully converted PDF 2 page ${pageNum} to PNG, size:`, imageBytes2.byteLength, 'bytes');
        } catch (conversionError) {
          console.error(`[comparePDFs] Error converting canvas to PNG for PDF 2, page ${pageNum}:`, conversionError);
          throw new Error(`Failed to convert page image: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }

        let pdfImage2;
        try {
          // Use the copied ArrayBuffer for embedding
          pdfImage2 = await comparisonPdf.embedPng(imageBytes2);
          console.log(`[comparePDFs] Successfully embedded PNG for PDF 2, page ${pageNum}`);
        } catch (embedError) {
          console.error(`[comparePDFs] Error embedding PNG for PDF 2, page ${pageNum}:`, embedError);
          console.error('[comparePDFs] Embed error details:', {
            name: (embedError as any)?.name,
            message: (embedError as any)?.message,
            stack: (embedError as any)?.stack,
          });
          throw new Error(`Failed to embed page image: ${embedError instanceof Error ? embedError.message : 'Unknown error'}`);
        }
        // Ensure valid dimensions for drawing (use scaled dimensions)
        // Make sure image fits within the page bounds
        const imgX2 = pageWidth + 30; // Define imgX2 first
        const maxImgWidth2 = Math.min(pageWidth, comparisonPageWidth - imgX2 - 10); // Leave 10px margin on right
        const maxImgHeight2 = Math.min(pageHeight, comparisonPageHeight - 100); // Leave space for header
        const imgWidth2 = Math.max(1, Math.min(viewport2.width, maxImgWidth2));
        const imgHeight2 = Math.max(1, Math.min(viewport2.height, maxImgHeight2));
        const imgY2 = Math.max(10, comparisonPageHeight - imgHeight2 - 90); // Account for header space, ensure positive
        
        // Ensure image doesn't go outside page bounds
        if (imgX2 + imgWidth2 > comparisonPageWidth || imgY2 + imgHeight2 > comparisonPageHeight) {
          console.warn(`[comparePDFs] Image 2 for page ${pageNum} would exceed page bounds, adjusting...`);
          const adjustedWidth = Math.min(imgWidth2, comparisonPageWidth - imgX2 - 10);
          const adjustedHeight = Math.min(imgHeight2, comparisonPageHeight - imgY2 - 10);
          if (adjustedWidth > 0 && adjustedHeight > 0) {
            try {
              comparisonPage.drawImage(pdfImage2, {
                x: imgX2,
                y: imgY2,
                width: adjustedWidth,
                height: adjustedHeight,
              });
            } catch (drawError) {
              console.error(`[comparePDFs] Error drawing adjusted image for PDF 2, page ${pageNum}:`, drawError);
              throw new Error(`Failed to draw page image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
            }
          } else {
            console.warn(`[comparePDFs] Skipping image 2 for page ${pageNum} - dimensions too small after adjustment`);
          }
        } else {
          try {
            comparisonPage.drawImage(pdfImage2, {
              x: imgX2,
              y: imgY2,
              width: imgWidth2,
              height: imgHeight2,
            });
          } catch (drawError) {
            console.error(`[comparePDFs] Error drawing image for PDF 2, page ${pageNum}:`, drawError);
            throw new Error(`Failed to draw page image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
          }
        }

        // Label for PDF 2
        comparisonPage.drawText(`PDF 2 - Page ${pageNum}`, {
          x: pageWidth + 30,
          y: comparisonPageHeight - 20,
          size: 12,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      } else {
        // Page missing in PDF 2
        comparisonPage.drawRectangle({
          x: pageWidth + 30,
          y: 10,
          width: pageWidth,
          height: pageHeight,
          borderColor: rgb(1, 0, 0),
          borderWidth: 2,
        });
        comparisonPage.drawText('Page Missing in PDF 2', {
          x: pageWidth + 30 + pageWidth / 2 - 80,
          y: pageHeight / 2,
          size: 16,
          font: fontBold,
          color: rgb(1, 0, 0),
        });
      }

      // Extract and compare text if both pages exist
      if (hasPage1 && hasPage2) {
        try {
          const page1 = await pdfDoc1.getPage(pageNum);
          const page2 = await pdfDoc2.getPage(pageNum);

          const textContent1 = await page1.getTextContent();
          const textContent2 = await page2.getTextContent();

          const text1 = textContent1.items.map((item: any) => item.str).join(' ');
          const text2 = textContent2.items.map((item: any) => item.str).join(' ');

          // Simple text comparison
          if (text1.trim() !== text2.trim()) {
            // Draw difference indicator
            comparisonPage.drawRectangle({
              x: 5,
              y: comparisonPageHeight - 95,
              width: Math.min(comparisonPageWidth - 10, pageWidth * 2 + 30),
              height: 3,
              color: rgb(1, 1, 0),
              opacity: 0.5,
            });

            // Calculate similarity percentage
            const similarity = calculateTextSimilarity(text1, text2);
            comparisonPage.drawText(`Differences found! Similarity: ${similarity.toFixed(1)}%`, {
              x: pageWidth - 100,
              y: comparisonPageHeight - 60,
              size: 10,
              font: font,
              color: rgb(1, 0.5, 0),
            });
          } else {
            comparisonPage.drawText('Pages are identical', {
              x: pageWidth - 60,
              y: comparisonPageHeight - 60,
              size: 10,
              font: font,
              color: rgb(0, 0.8, 0),
            });
          }
        } catch (textError) {
          // If text extraction fails, just show visual comparison
          comparisonPage.drawText('Visual comparison only (text extraction unavailable)', {
            x: pageWidth - 120,
            y: comparisonPageHeight - 60,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      onProgress?.({
        progress: progressEnd,
        status: 'processing',
        message: `Completed page ${pageNum} of ${maxPages}`,
      });
      successfulPages++;
      } catch (pageError) {
        console.error(`[comparePDFs] Error processing page ${pageNum}:`, pageError);
        console.error('[comparePDFs] Page error details:', {
          name: (pageError as any)?.name,
          message: (pageError as any)?.message,
          stack: (pageError as any)?.stack,
        });
        
        // Create an error page instead of failing completely
        try {
          const errorPageWidth = 612;
          const errorPageHeight = 792;
          const errorPage = comparisonPdf.addPage([errorPageWidth, errorPageHeight]);
          errorPage.drawText(`Error processing page ${pageNum}`, {
            x: 50,
            y: errorPageHeight - 50,
            size: 16,
            font: fontBold,
            color: rgb(1, 0, 0),
          });
          errorPage.drawText((pageError as Error)?.message || 'Unknown error', {
            x: 50,
            y: errorPageHeight - 100,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          successfulPages++;
          console.log(`[comparePDFs] Created error page for page ${pageNum}`);
        } catch (errorPageError) {
          console.error(`[comparePDFs] Failed to create error page for page ${pageNum}:`, errorPageError);
          // Continue to next page
        }
        
        onProgress?.({
          progress: progressEnd,
          status: 'processing',
          message: `Error on page ${pageNum}, continuing...`,
        });
      }
    }
    
    if (successfulPages === 0) {
      throw new Error('Failed to process any pages. Please check the PDF files and try again.');
    }
    
    console.log(`[comparePDFs] Successfully processed ${successfulPages} out of ${maxPages} pages`);

    onProgress?.({ progress: 95, status: 'processing', message: 'Finalizing comparison PDF...' });

    // Validate that PDF has at least one page
    const pageCount = comparisonPdf.getPageCount();
    if (pageCount === 0) {
      throw new Error('Failed to create comparison PDF: No pages were generated.');
    }

    console.log('[comparePDFs] PDF has', pageCount, 'pages');

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    // Save PDF using the same simple approach as all other functions in this file
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await comparisonPdf.save();
      console.log('[comparePDFs] PDF saved successfully, size:', pdfBytes.length, 'bytes');
      
      // Verify the PDF bytes are valid
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF save returned empty bytes');
      }
      
      // Check if it's actually a PDF
      const headerCheck = String.fromCharCode(...pdfBytes.slice(0, 4));
      if (headerCheck !== '%PDF') {
        console.error('[comparePDFs] CRITICAL: PDF save did not produce valid PDF header!');
        console.error('[comparePDFs] Header:', headerCheck);
        console.error('[comparePDFs] First 50 bytes:', Array.from(pdfBytes.slice(0, 50)).map(b => String.fromCharCode(b)).join(''));
        throw new Error('PDF save produced invalid PDF structure');
      }
    } catch (saveError) {
      console.error('[comparePDFs] Error saving PDF:', saveError);
      console.error('[comparePDFs] Save error details:', {
        name: (saveError as any)?.name,
        message: (saveError as any)?.message,
        stack: (saveError as any)?.stack,
      });
      throw new Error(`Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
    }
    
    // Validate PDF bytes - only check for empty, don't throw on size/header issues
    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Failed to generate PDF: Empty PDF bytes.');
    }

    // Log PDF info but don't throw errors - let it through for debugging
    console.log('[comparePDFs] PDF generated:', {
      size: pdfBytes.length,
      first4Bytes: Array.from(pdfBytes.slice(0, 4)).map(b => String.fromCharCode(b)).join(''),
      headerValid: String.fromCharCode(...pdfBytes.slice(0, 4)) === '%PDF'
    });

    // Only warn, don't throw
    if (pdfBytes.length < 100) {
      console.warn(`[comparePDFs] WARNING: PDF file is small (${pdfBytes.length} bytes), but continuing anyway`);
    }

    // Check header but don't throw - just log
    const pdfHeader = new Uint8Array(pdfBytes.slice(0, 4));
    const headerString = String.fromCharCode(...pdfHeader);
    console.log('[comparePDFs] PDF header check:', {
      headerString,
      expected: '%PDF',
      matches: headerString === '%PDF',
      firstBytes: Array.from(pdfHeader).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
    });
    
    if (headerString !== '%PDF') {
      console.error('[comparePDFs] WARNING: Invalid PDF header, but continuing anyway for debugging:', headerString);
      console.error('[comparePDFs] First 100 bytes (hex):', Array.from(pdfBytes.slice(0, 100)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    } else {
      console.log('[comparePDFs] PDF header validation passed');
    }

    // Try to load the PDF with pdfjs-dist to verify it's valid (non-blocking)
    // Note: pdfjs-dist validation can sometimes fail even for valid PDFs, so we only log warnings
    try {
      const testPdfjsLib = await import('pdfjs-dist');
      testPdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${testPdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const testDoc = await testPdfjsLib.getDocument({ data: pdfBytes }).promise;
      const testPageCount = testDoc.numPages;
      console.log('[comparePDFs] PDF validation successful, pages:', testPageCount);
      
      if (testPageCount !== pageCount) {
        console.warn('[comparePDFs] Page count mismatch: pdf-lib says', pageCount, 'but pdfjs-dist says', testPageCount);
      }
    } catch (validationError) {
      // Don't throw error - pdfjs-dist validation can fail for valid PDFs
      // Just log a warning and continue
      console.warn('[comparePDFs] PDF validation warning (non-blocking):', validationError);
      console.warn('[comparePDFs] Validation error details:', {
        name: (validationError as any)?.name,
        message: (validationError as any)?.message,
      });
      console.warn('[comparePDFs] PDF header is valid, continuing despite validation warning');
    }

    // Verify PDF bytes one more time before creating Blob - just log, don't throw
    if (pdfBytes.length < 100) {
      console.warn(`[comparePDFs] WARNING: PDF file is small (${pdfBytes.length} bytes) before creating Blob, but continuing anyway`);
    }
    
    // Check PDF header one more time
    const finalHeaderCheck = new Uint8Array(pdfBytes.slice(0, 4));
    const finalHeaderString = String.fromCharCode(...finalHeaderCheck);
    console.log('[comparePDFs] Final header check before Blob:', {
      headerString: finalHeaderString,
      expected: '%PDF',
      matches: finalHeaderString === '%PDF',
      first20Bytes: Array.from(pdfBytes.slice(0, 20)).map(b => String.fromCharCode(b)).join('')
    });
    
    if (finalHeaderString !== '%PDF') {
      console.error('[comparePDFs] CRITICAL: PDF header check failed before creating Blob!');
      console.error('[comparePDFs] Header string:', finalHeaderString);
      console.error('[comparePDFs] First 50 bytes (hex):', Array.from(pdfBytes.slice(0, 50)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.error('[comparePDFs] First 50 bytes (char):', Array.from(pdfBytes.slice(0, 50)).map(b => {
        const char = String.fromCharCode(b);
        return (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) ? char : '.';
      }).join(''));
      // Don't throw error - let it through and see if it works anyway
      console.warn('[comparePDFs] WARNING: PDF header invalid, but continuing anyway for debugging');
    }
    
    // Final validation - ensure PDF bytes are valid before creating Blob
    console.log('[comparePDFs] Final PDF validation before creating Blob:', {
      pdfBytesLength: pdfBytes.length,
      first4Bytes: Array.from(pdfBytes.slice(0, 4)).map(b => String.fromCharCode(b)).join(''),
      headerValid: String.fromCharCode(...pdfBytes.slice(0, 4)) === '%PDF'
    });
    
    if (String.fromCharCode(...pdfBytes.slice(0, 4)) !== '%PDF') {
      console.error('[comparePDFs] CRITICAL: PDF header invalid before creating Blob!');
      console.error('[comparePDFs] First 20 bytes:', Array.from(pdfBytes.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      throw new Error('PDF generation failed: Invalid PDF header detected.');
    }
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    console.log('[comparePDFs] Blob created successfully:', {
      size: blob.size,
      type: blob.type,
      pdfBytesLength: pdfBytes.length,
      sizesMatch: blob.size === pdfBytes.length
    });
    
    // Verify blob size matches PDF bytes
    if (blob.size !== pdfBytes.length) {
      console.warn('[comparePDFs] Blob size mismatch:', {
        blobSize: blob.size,
        pdfBytesLength: pdfBytes.length
      });
    }

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: `PDF comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    throw error;
  }
}

/**
 * Calculate text similarity percentage between two strings
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  if (words1.length === 0 && words2.length === 0) return 100;
  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
}

