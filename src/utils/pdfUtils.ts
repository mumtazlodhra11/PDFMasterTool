import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * PDF Utility Functions for client-side processing
 */

export interface ConversionProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

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
  pages: number[] | 'all',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const pagesToRotate = pages === 'all' ? Array.from({ length: totalPages }, (_, i) => i) : pages.map(p => p - 1);

    onProgress?.({ progress: 40, status: 'processing', message: 'Rotating pages...' });

    pagesToRotate.forEach((pageIndex) => {
      if (pageIndex >= 0 && pageIndex < totalPages) {
        const page = pdf.getPage(pageIndex);
        page.setRotation({ angle: rotation, type: 'degrees' });
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
 * Add watermark to PDF
 */
export async function addWatermarkToPDF(
  file: File,
  watermarkText: string,
  options: {
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    position?: 'center' | 'top' | 'bottom';
  } = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    const { fontSize = 48, opacity = 0.3, rotation = -45, position = 'center' } = options;

    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pages = pdf.getPages();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      onProgress?.({
        progress: 10 + (i / totalPages) * 80,
        status: 'processing',
        message: `Adding watermark to page ${i + 1}...`,
      });

      const page = pages[i];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = fontSize;

      let x = width / 2 - textWidth / 2;
      let y = height / 2;

      if (position === 'top') {
        y = height - 100;
      } else if (position === 'bottom') {
        y = 100;
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: { angle: rotation, type: 'degrees' },
      });
    }

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });

    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add watermark' });
    throw error;
  }
}

/**
 * Remove pages from PDF
 */
export async function removePagesFromPDF(
  file: File,
  pagesToRemove: number[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i).filter(
      (i) => !pagesToRemove.includes(i + 1)
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
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    // We'll use pdfjs-dist for rendering
    const pdfjsLib = await import('pdfjs-dist');
    // Use jsdelivr CDN (more reliable than cdnjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // For now, convert first page only (can be extended)
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    onProgress?.({ progress: 80, status: 'processing', message: 'Converting to JPG...' });
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
    });
    
    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert PDF to JPG' });
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
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add watermark' });
    throw error;
  }
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    pages.forEach((page, index) => {
      onProgress?.({
        progress: 10 + ((index + 1) / pages.length) * 80,
        status: 'processing',
        message: `Adding number to page ${index + 1}...`,
      });
      
      const { width, height } = page.getSize();
      const pageNumber = `${index + 1}`;
      
      page.drawText(pageNumber, {
        x: width / 2 - 10,
        y: 20,
        size: 12,
        font,
        color: rgb(0, 0, 0),
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
 * Add header and footer to PDF
 */
export async function addHeaderFooter(
  file: File,
  headerText: string = '',
  footerText: string = '',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    pages.forEach((page, index) => {
      onProgress?.({
        progress: 10 + ((index + 1) / pages.length) * 80,
        status: 'processing',
        message: `Adding header/footer to page ${index + 1}...`,
      });
      
      const { width, height } = page.getSize();
      
      if (headerText) {
        page.drawText(headerText, {
          x: 50,
          y: height - 30,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      }
      
      if (footerText) {
        page.drawText(footerText, {
          x: 50,
          y: 20,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      }
    });

    onProgress?.({ progress: 95, status: 'processing', message: 'Saving PDF...' });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add header/footer' });
    throw error;
  }
}

/**
 * Unlock PDF (basic - removes user password if no owner password)
 */
export async function unlockPDF(
  file: File,
  password?: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Attempting to unlock PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      onProgress?.({ progress: 90, status: 'processing', message: 'Saving unlocked PDF...' });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      onProgress?.({ progress: 100, status: 'completed' });
      return blob;
    } catch {
      throw new Error('PDF is password protected. Client-side unlock has limitations.');
    }
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to unlock PDF' });
    throw error;
  }
}

/**
 * Convert HTML to PDF (basic)
 */
export async function htmlToPDF(
  htmlContent: string,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Converting HTML to PDF...' });

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');
    
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);
    
    onProgress?.({ progress: 50, status: 'processing', message: 'Rendering HTML...' });
    
    const canvas = await html2canvas(tempDiv);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBlob = pdf.output('blob');
    
    onProgress?.({ progress: 100, status: 'completed' });
    return pdfBlob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to convert HTML to PDF' });
    throw error;
  }
}

/**
 * Add annotation to PDF (basic - adds text comment)
 */
export async function annotatePDF(
  file: File,
  annotationText: string = 'Annotation',
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = firstPage.getSize();
    
    onProgress?.({ progress: 50, status: 'processing', message: 'Adding annotation...' });
    
    // Add annotation as text on first page
    firstPage.drawText(annotationText, {
      x: 50,
      y: height - 50,
      size: 10,
      font,
      color: rgb(1, 0, 0), // Red color
    });
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to add annotation' });
    throw error;
  }
}

/**
 * Add eSignature to PDF (basic - adds signature image)
 */
export async function eSignPDF(
  file: File,
  signatureFile: File,
  onProgress?: (progress: ConversionProgress) => void
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
    const lastPage = pages[pages.length - 1];
    const { width } = lastPage.getSize();
    
    onProgress?.({ progress: 70, status: 'processing', message: 'Adding signature...' });
    
    // Add signature to bottom right
    const signatureWidth = 150;
    const signatureHeight = 50;
    
    lastPage.drawImage(signatureImage, {
      x: width - signatureWidth - 50,
      y: 50,
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
 * Edit PDF (basic - adds text overlay)
 */
export async function editPDF(
  file: File,
  editText: string,
  position: { x: number; y: number } = { x: 50, y: 750 },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  try {
    onProgress?.({ progress: 10, status: 'processing', message: 'Loading PDF...' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    onProgress?.({ progress: 50, status: 'processing', message: 'Adding text...' });
    
    firstPage.drawText(editText, {
      x: position.x,
      y: position.y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    
    onProgress?.({ progress: 90, status: 'processing', message: 'Saving PDF...' });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({ progress: 100, status: 'completed' });
    return blob;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: 'Failed to edit PDF' });
    throw error;
  }
}

