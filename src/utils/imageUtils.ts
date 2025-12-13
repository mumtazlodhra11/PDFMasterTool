import { PDFDocument } from 'pdf-lib';
import type { ConversionProgress } from './pdfUtils';

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
    const totalImages = files.length;

    for (let i = 0; i < totalImages; i++) {
      onProgress?.({
        progress: 10 + (i / totalImages) * 80,
        status: 'processing',
        message: `Adding image ${i + 1} of ${totalImages}...`,
      });

      const arrayBuffer = await files[i].arrayBuffer();
      const fileType = files[i].type;

      let image;
      if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (fileType === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // Convert other formats to PNG first
        const imgElement = await loadImageFromFile(files[i]);
        const pngDataUrl = convertImageToPNG(imgElement);
        const pngBytes = await fetch(pngDataUrl).then(r => r.arrayBuffer());
        image = await pdfDoc.embedPng(pngBytes);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
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
 * Convert PDF to images
 */
export async function pdfToImages(
  file: File,
  options: {
    format?: 'jpeg' | 'png';
    quality?: number;
    scale?: number;
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob[]> {
  const { format = 'jpeg', quality = 0.92, scale = 2 } = options;

  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    // This requires pdf.js worker - we'll use it via dynamic import
    const pdfjsLib = await import('pdfjs-dist');
    // Use jsdelivr CDN (more reliable than cdnjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const images: Blob[] = [];

    for (let i = 1; i <= numPages; i++) {
      onProgress?.({
        progress: 10 + (i / numPages) * 85,
        status: 'processing',
        message: `Converting page ${i} of ${numPages}...`,
      });

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          format === 'jpeg' ? 'image/jpeg' : 'image/png',
          quality
        );
      });

      images.push(blob);
    }

    onProgress?.({ progress: 100, status: 'completed' });

    return images;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert PDF to images' });
    throw error;
  }
}

/**
 * Load image from file
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Convert image to PNG data URL
 */
function convertImageToPNG(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  return canvas.toDataURL('image/png');
}

/**
 * Compress image
 */
export async function compressImage(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/jpeg',
      quality
    );
  });
}














