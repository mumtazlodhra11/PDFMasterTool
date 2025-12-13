import React, { useState, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { ProgressBar } from './ProgressBar';
import { ResultModal } from './ResultModal';
import { ErrorToast } from './ErrorToast';
import { formatFileSize } from '@/utils/pdfUtils';
import type { ConversionProgress } from '@/utils/pdfUtils';
import { SplitPDFOptions } from './SplitPDFOptions';
import { RemovePDFPages } from './RemovePDFPages';
import { AddPageNumbers } from './AddPageNumbers';
import { ReorderPDFPages } from './ReorderPDFPages';
import { PasswordProtect } from './PasswordProtect';
import { UnlockPDFOptions } from './UnlockPDFOptions';
import { WatermarkOptions } from './WatermarkOptions';
import { EditPDFOptions } from './EditPDFOptions';
import { AnnotatePDFOptions } from './AnnotatePDFOptions';
import { RotatePDFOptions } from './RotatePDFOptions';
import { HeaderFooterOptions } from './HeaderFooterOptions';
import { OCROptions } from './OCROptions';
import { SignaturePad } from './SignaturePad';
import { PNGOptions } from './PNGOptions';
import { CropPDFOptions } from './CropPDFOptions';
import { MetadataOptions } from './MetadataOptions';
import { FlattenPDFOptions } from './FlattenPDFOptions';
import { HTMLToPDFOptions } from './HTMLToPDFOptions';
import { ExcelToPDFOptions } from './ExcelToPDFOptions';
import { PDFToExcelOptions } from './PDFToExcelOptions';
import { MobileScanner } from './MobileScanner';
import { callCloudRunConverter } from '@/utils/awsClient';

interface ToolTemplateProps {
  toolName: string;
  toolDescription: string;
  toolIcon: string;
  acceptedFormats: string[];
  maxFileSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  children?: React.ReactNode;
  toolType?: string; // NEW: tool identifier for internal processing
  onProcess?: (files: File[], options?: any) => Promise<Blob | Blob[]>;
  options?: React.ReactNode;
  outputFileName?: string | ((inputName: string) => string);
}

export const ToolTemplate: React.FC<ToolTemplateProps> = ({
  toolName,
  toolDescription,
  toolIcon,
  acceptedFormats,
  maxFileSize = 150,
  maxFiles = 10,
  multiple = true,
  children,
  toolType,
  onProcess,
  options,
  outputFileName,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [urlToConvert, setUrlToConvert] = useState<string>('');
  const [progress, setProgress] = useState<ConversionProgress>({
    progress: 0,
    status: 'uploading',
  });
  const [result, setResult] = useState<{
    isOpen: boolean;
    blob?: Blob;
    fileName: string;
    fileSize: string;
    processingTime?: string;
  }>({
    isOpen: false,
    fileName: '',
    fileSize: '',
  });
  const [error, setError] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false,
  });
  const [processingOptions, setProcessingOptions] = useState<any>({});

  const handleFilesSelected = useCallback((files: File[]) => {
    if (!files || files.length === 0) {
      setError({ message: 'No files were selected. Please try again.', isVisible: true });
      return;
    }
    setSelectedFiles(prev => {
      const newFiles = multiple ? [...prev, ...files] : files;
      return newFiles.slice(0, maxFiles);
    });
    setError({ message: '', isVisible: false });
  }, [multiple, maxFiles]);

  const handleProcess = async () => {
    // For html-to-pdf, allow URL conversion without files
    if (toolType === 'html-to-pdf' && (urlToConvert || processingOptions?.url)) {
      // URL conversion - continue processing
    } else if (selectedFiles.length === 0) {
      setError({ message: 'Please select files first or enter a URL', isVisible: true });
      return;
    }

    setProcessing(true);
    setProgress({ progress: 0, status: 'processing' });
    const startTime = Date.now();

    try {
      let resultBlob: Blob | Blob[];
      
      // Use toolType for internal processing or onProcess callback
      if (toolType) {
        resultBlob = await processWithToolType(toolType, selectedFiles, processingOptions);
      } else if (onProcess) {
        resultBlob = await onProcess(selectedFiles, processingOptions);
      } else {
        throw new Error('No processing method defined');
      }
      
      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;

      // Handle split PDF which returns array of blobs
      let finalBlob: Blob;
      let fileName: string;
      
      if (toolType === 'split-pdf' && Array.isArray(resultBlob)) {
        // For split PDF, create a ZIP file with all split PDFs
        if (resultBlob.length === 0) {
          throw new Error('No PDF files were created. Please check your split options.');
        }
        
        // If only one file, return it directly
        if (resultBlob.length === 1) {
          finalBlob = resultBlob[0];
          const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
          fileName = `${baseName}_page_1.pdf`;
        } else {
          // Multiple files - create ZIP
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
          
          resultBlob.forEach((blob, index) => {
            const pdfFileName = `${baseName}_part_${(index + 1).toString().padStart(3, '0')}.pdf`;
            zip.file(pdfFileName, blob);
          });
          
          finalBlob = await zip.generateAsync({ type: 'blob' });
          fileName = `${baseName}_split.zip`;
        }
      } else {
        finalBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
        // Handle URL conversion for html-to-pdf
        if (toolType === 'html-to-pdf' && (urlToConvert || processingOptions?.url)) {
          const url = urlToConvert || processingOptions?.url || '';
          try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            const pathname = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_') || 'page';
            fileName = `${hostname}_${pathname}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
          } catch {
            fileName = 'webpage.pdf';
          }
        } else {
          fileName = outputFileName
          ? (typeof outputFileName === 'function' 
             ? outputFileName(selectedFiles[0]?.name || selectedFiles[0]?.name || 'file')
             : outputFileName)
          : (selectedFiles[0]?.name || 'file');
        }
      }
      
      // Validate finalBlob exists
      if (!finalBlob) {
        throw new Error('Conversion failed: No output file was created.');
      }
      
      // Ensure filename has correct extension based on blob type and tool
      if (toolType === 'html-to-pdf' || toolType === 'htm-to-pdf') {
        // Force .pdf extension for HTML to PDF conversions
        if (!fileName.toLowerCase().endsWith('.pdf')) {
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          fileName = `${baseName}.pdf`;
        }
        // Ensure blob has correct MIME type
        if (finalBlob.type !== 'application/pdf') {
          finalBlob = new Blob([finalBlob], { type: 'application/pdf' });
        }
      } else if (toolType === 'pdf-ocr-extract') {
        // Force .txt extension for text extraction
        if (!fileName.toLowerCase().endsWith('.txt')) {
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          fileName = `${baseName}.txt`;
        }
        // Ensure blob has correct MIME type for text
        if (!finalBlob.type.startsWith('text/')) {
          finalBlob = new Blob([finalBlob], { type: 'text/plain;charset=utf-8' });
        }
      } else if (toolType === 'image-to-pdf' || toolType === 'mobile-scanner') {
        // Force .pdf extension for image to PDF conversions
        if (!fileName.toLowerCase().endsWith('.pdf')) {
          const baseName = selectedFiles.length > 1 
            ? 'scanned_documents' 
            : selectedFiles[0].name.replace(/\.(jpg|jpeg|png)$/i, '');
          fileName = `${baseName}.pdf`;
        }
        // Ensure blob has correct MIME type
        if (finalBlob.type !== 'application/pdf') {
          finalBlob = new Blob([finalBlob], { type: 'application/pdf' });
        }
      } else if (toolType === 'pdf-to-word') {
        // Force .docx extension for PDF to Word conversions
        if (!fileName.toLowerCase().endsWith('.docx')) {
          const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '');
          fileName = `${baseName}.docx`;
        }
        // Ensure blob has correct MIME type for DOCX
        const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (finalBlob.type !== docxMimeType) {
          finalBlob = new Blob([finalBlob], { type: docxMimeType });
        }
      } else if (toolType === 'pdf-to-excel') {
        // Force .xlsx extension for PDF to Excel conversions
        if (!fileName.toLowerCase().endsWith('.xlsx')) {
          const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '');
          fileName = `${baseName}.xlsx`;
        }
      } else if (toolType === 'pdf-to-ppt' || toolType === 'pdf-to-powerpoint') {
        // Force .pptx extension for PDF to PPT conversions
        if (!fileName.toLowerCase().endsWith('.pptx')) {
          const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '');
          fileName = `${baseName}.pptx`;
        }
      } else if (toolType === 'pdf-to-jpg') {
        // PDF to JPG: Single page = .jpg, Multiple pages = .zip
        const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
        if (finalBlob.type === 'application/zip' || finalBlob.type === 'application/x-zip-compressed') {
          // Multiple pages - ZIP file
          if (!fileName.toLowerCase().endsWith('.zip')) {
            fileName = `${baseName}_pages.zip`;
          }
        } else if (finalBlob.type.startsWith('image/')) {
          // Single page - JPG file
          if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
            fileName = `${baseName}_page_1.jpg`;
          }
          // Ensure blob has correct MIME type
          if (finalBlob.type !== 'image/jpeg') {
            finalBlob = new Blob([finalBlob], { type: 'image/jpeg' });
          }
        }
      } else if (toolType === 'pdf-to-png') {
        // PDF to PNG: Single page = .png, Multiple pages = .zip
        const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
        if (finalBlob.type === 'application/zip' || finalBlob.type === 'application/x-zip-compressed') {
          // Multiple pages - ZIP file
          if (!fileName.toLowerCase().endsWith('.zip')) {
            fileName = `${baseName}_pages.zip`;
          }
        } else if (finalBlob.type.startsWith('image/')) {
          // Single page - PNG file
          if (!fileName.toLowerCase().endsWith('.png')) {
            fileName = `${baseName}.png`;
          }
          // Ensure blob has correct MIME type
          if (finalBlob.type !== 'image/png') {
            finalBlob = new Blob([finalBlob], { type: 'image/png' });
          }
        }
      }

      setResult({
        isOpen: true,
        blob: finalBlob,
        fileName,
        fileSize: formatFileSize(finalBlob.size),
        processingTime: `${(processingTimeMs / 1000).toFixed(2)}s`,
      });

      setProgress({ progress: 100, status: 'completed' });
    } catch (err) {
      console.error('Processing error:', err);
      setError({
        message: err instanceof Error ? err.message : 'Processing failed. Please try again.',
        isVisible: true,
      });
      setProgress({ progress: 0, status: 'error' });
    } finally {
      setProcessing(false);
    }
  };
  
  // Internal processing based on tool type
  const processWithToolType = async (type: string, files: File[], options: any): Promise<Blob> => {
    const { 
      mergePDFs, 
      splitPDF, 
      compressPDF, 
      rotatePDF,
      removePDFPages,
      reorderPDFPages,
      imagesToPDF,
      pdfToJPG,
      pdfToPNG,
      addWatermark,
      addPageNumbers,
      addHeaderFooter,
      unlockPDF,
      passwordProtect,
      htmlToPDF,
      annotatePDF,
      eSignPDF,
      fillPDFForm,
      editPDF
    } = await import('@/utils/pdfUtils');
    
    switch (type) {
      case 'merge-pdf':
        return await mergePDFs(files);
      
      case 'split-pdf':
        // splitPDF expects ranges array, not options object
        const ranges = options?.ranges || [];
        if (!ranges || ranges.length === 0) {
          throw new Error('Please select pages to split. Use the options below to choose how to split your PDF.');
        }
        // Create progress callback
        const progressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await splitPDF(files[0], ranges, progressCallback);
      
      case 'compress-pdf':
        // Create progress callback
        const compressProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await compressPDF(files[0], options, compressProgressCallback);
      
      case 'rotate-pdf':
        // Create progress callback
        const rotateProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Extract angle and pages from options
        const rotationAngle = options?.angle || 90;
        const pagesToRotate = options?.pages || 'all';
        if (!options || (!options.pages && pagesToRotate === 'all' && (!Array.isArray(pagesToRotate) || pagesToRotate.length === 0))) {
          throw new Error('Please select pages to rotate');
        }
        return await rotatePDF(files[0], rotationAngle, pagesToRotate, rotateProgressCallback);
      
      case 'remove-pages':
        // Create progress callback
        const removeProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await removePDFPages(files[0], options, removeProgressCallback);
      
      case 'reorder-pdf':
        // Create progress callback
        const reorderProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        const pageOrder = options?.pageOrder || [];
        if (!pageOrder || pageOrder.length === 0) {
          throw new Error('Please reorder pages by dragging and dropping them.');
        }
        return await reorderPDFPages(files[0], pageOrder, reorderProgressCallback);
      
      case 'image-to-pdf':
      case 'mobile-scanner':
        // Both image-to-pdf and mobile-scanner convert images to PDF
        const imageToPDFProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await imagesToPDF(files, imageToPDFProgressCallback);
      
      case 'pdf-to-jpg':
        // Create progress callback
        const jpgProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await pdfToJPG(files[0], jpgProgressCallback);
      
      case 'pdf-to-png':
        // Create progress callback
        const pngProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await pdfToPNG(files[0], options, pngProgressCallback);
      
      case 'crop-pdf':
        // Create progress callback
        const cropProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        const { cropPDF } = await import('@/utils/pdfUtils');
        return await cropPDF(files[0], options, cropProgressCallback);
      
      case 'pdf-metadata':
        // Create progress callback
        const metadataProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        const { editPDFMetadata } = await import('@/utils/pdfUtils');
        return await editPDFMetadata(files[0], options, metadataProgressCallback);
      
      case 'flatten-pdf':
        // Create progress callback
        const flattenProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        const { flattenPDF } = await import('@/utils/pdfUtils');
        return await flattenPDF(files[0], flattenProgressCallback);
      
      case 'watermark-pdf':
        // Create progress callback
        const watermarkProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use addWatermarkToPDF with full options support
        const { addWatermarkToPDF } = await import('@/utils/pdfUtils');
        return await addWatermarkToPDF(files[0], options || {}, watermarkProgressCallback);
      
      case 'add-page-numbers':
        // Create progress callback
        const pageNumberProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await addPageNumbers(files[0], options, pageNumberProgressCallback);
      
      case 'header-footer':
        // Create progress callback
        const headerFooterProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use addHeaderFooter with all options
        return await addHeaderFooter(
          files[0],
          options?.headerText || '',
          options?.footerText || '',
          options?.headerPosition || 'center',
          options?.footerPosition || 'center',
          options?.fontSize || 10,
          options?.headerColor || '#000000',
          options?.footerColor || '#000000',
          headerFooterProgressCallback
        );
      
      case 'unlock-pdf':
        // Create progress callback
        const unlockProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await unlockPDF(files[0], options?.password, unlockProgressCallback);
      
      case 'html-to-pdf':
        // Check if URL conversion is requested
        if (options?.url) {
          const urlToPDFProgressCallback = (progress: ConversionProgress) => {
            setProgress(progress);
          };
          const { urlToPDF } = await import('@/utils/pdfUtils');
          return await urlToPDF(options.url, options, urlToPDFProgressCallback);
        }
        // Use backend conversion if file is provided
        if (files && files.length > 0) {
          // Create progress callback for Cloud Run conversions
          const htmlProgressCallback = (progress: ConversionProgress) => {
            setProgress(progress);
          };
          return await callCloudRunConverter('html-to-pdf', files[0], options, htmlProgressCallback);
        } else {
          // Client-side HTML content conversion
          const htmlToPDFProgressCallback = (progress: ConversionProgress) => {
            setProgress(progress);
          };
          return await htmlToPDF(options?.htmlContent || '<h1>Sample HTML</h1>', options, htmlToPDFProgressCallback);
        }
      
      case 'annotate-pdf':
        // Create progress callback
        const annotateProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use annotatePDF with annotations array
        const annotations = options?.annotations || [];
        if (!Array.isArray(annotations)) {
          throw new Error('Annotations must be an array. Please add at least one annotation.');
        }
        return await annotatePDF(files[0], annotations, annotateProgressCallback);
      
      case 'esign-pdf':
        // Create progress callback
        const eSignProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Validate signature file
        if (!options?.signatureFile) {
          throw new Error('Please create a signature first (draw, type, or upload) before processing');
        }
        // Use eSignPDF with all options (signature file and position)
        return await eSignPDF(
          files[0],
          options.signatureFile,
          eSignProgressCallback,
          {
            page: options.page || 1,
            nx: options.nx,
            ny: options.ny,
            nw: options.nw,
            nh: options.nh,
          }
        );
      
      case 'fill-forms':
        return await fillPDFForm(files[0], options?.formData || {});
      
      case 'ai-ocr':
        // Create progress callback
        const ocrProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use createSearchablePDF from aiUtils for OCR
        const { createSearchablePDF } = await import('@/utils/aiUtils');
        const language = options?.language || 'eng';
        
        // Return searchable PDF
        return await createSearchablePDF(files[0], language, ocrProgressCallback);
      
      case 'pdf-compare':
        // Create progress callback
        const compareProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Validate that exactly 2 files are provided
        if (!files || files.length !== 2) {
          throw new Error('PDF Comparison requires exactly 2 PDF files. Please upload 2 files to compare.');
        }
        const { comparePDFs } = await import('@/utils/pdfUtils');
        return await comparePDFs(files[0], files[1], compareProgressCallback);
      
      case 'pdf-ocr-extract':
        // Create progress callback
        const extractProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use extractTextFromPDFWithOCR from aiUtils to extract text
        const { extractTextFromPDFWithOCR: extractTextOCR } = await import('@/utils/aiUtils');
        const extractLanguage = options?.language || 'eng';
        
        // Extract text using OCR
        let extractedText = '';
        try {
          extractedText = await extractTextOCR(files[0], extractLanguage, extractProgressCallback);
        } catch (extractError) {
          console.error('Text extraction failed:', extractError);
          throw new Error('Failed to extract text from PDF. Please try again.');
        }
        
        // Return extracted text as Blob
        extractProgressCallback({ progress: 100, status: 'completed' });
        return new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
      
      case 'edit-pdf':
        // Create progress callback
        const editProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        // Use editPDF with full options support
        return await editPDF(
          files[0], 
          options?.editText || 'Edit text', 
          options?.position || { x: 50, y: 750 },
          options?.page || 1,
          options?.fontSize || 12,
          options?.color || '#000000',
          options?.fontFamily || 'Helvetica',
          options?.alignment || 'left',
          options?.rotation || 0,
          options?.opacity || 100,
          options?.bold || false,
          options?.italic || false,
          editProgressCallback
        );
      
      case 'password-protect':
        // Use server-side encryption (more reliable than client-side)
        // Validate password is provided
        if (!options?.userPassword || options.userPassword.trim() === '') {
          throw new Error('Please enter a user password to protect the PDF.');
        }
        if (!toolType) {
          throw new Error('Tool type is required');
        }
        // Create progress callback for password-protect
        const passwordProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await callCloudRunConverter(toolType, files[0], options, passwordProgressCallback);
      
      // Server-side tools using Cloud Run
      case 'pdf-to-word':
      case 'word-to-pdf':
      case 'pdf-to-excel':
      case 'pdf-to-ppt':
      case 'pdf-to-powerpoint':
      case 'powerpoint-to-pdf':
      case 'ppt-to-pdf':
      case 'excel-to-pdf':
        // CRITICAL: Pass processingOptions for excel-to-pdf to send chart split prevention settings
        // Normalize pdf-to-powerpoint to pdf-to-ppt for backend
        const normalizedType = type === 'pdf-to-powerpoint' ? 'pdf-to-ppt' : type;
        // Create progress callback for Cloud Run conversions
        const cloudRunProgressCallback = (progress: ConversionProgress) => {
          setProgress(progress);
        };
        return await callCloudRunConverter(normalizedType, files[0], processingOptions, cloudRunProgressCallback);
      
      default:
        throw new Error(`"${type}" tool requires AWS Lambda for server-side processing. Please run: cd aws && npm run deploy`);
    }
  };

  const handleDownload = () => {
    if (result.blob) {
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Ensure filename has correct extension based on blob type
      let downloadFileName = result.fileName;
      
      // Validate and fix filename extension based on blob MIME type
      if (result.blob.type.includes('wordprocessingml')) {
        // DOCX file
        if (!downloadFileName.toLowerCase().endsWith('.docx')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '') + '.docx';
        }
      } else if (result.blob.type.includes('spreadsheetml')) {
        // XLSX file
        if (!downloadFileName.toLowerCase().endsWith('.xlsx')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '') + '.xlsx';
        }
      } else if (result.blob.type.includes('presentationml')) {
        // PPTX file
        if (!downloadFileName.toLowerCase().endsWith('.pptx')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '').replace(/\.pdf$/i, '') + '.pptx';
        }
      } else if (result.blob.type === 'application/pdf') {
        // PDF file
        if (!downloadFileName.toLowerCase().endsWith('.pdf')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '') + '.pdf';
        }
      } else if (result.blob.type.startsWith('image/')) {
        // Image file (JPG, PNG, etc.)
        if (result.blob.type === 'image/jpeg' && !downloadFileName.toLowerCase().endsWith('.jpg') && !downloadFileName.toLowerCase().endsWith('.jpeg')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '') + '.jpg';
        } else if (result.blob.type === 'image/png' && !downloadFileName.toLowerCase().endsWith('.png')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '') + '.png';
        }
      } else if (result.blob.type === 'application/zip' || result.blob.type === 'application/x-zip-compressed') {
        // ZIP file (multiple pages)
        if (!downloadFileName.toLowerCase().endsWith('.zip')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '') + '.zip';
        }
      } else if (result.blob.type === 'text/plain' || result.blob.type.startsWith('text/')) {
        // Text file (TXT, etc.)
        if (!downloadFileName.toLowerCase().endsWith('.txt')) {
          downloadFileName = downloadFileName.replace(/\.[^/.]+$/, '') + '.txt';
        }
      }
      
      link.download = downloadFileName;
      link.setAttribute('type', result.blob.type);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleConvertAnother = () => {
    setResult({ ...result, isOpen: false });
    setSelectedFiles([]);
    setProgress({ progress: 0, status: 'uploading' });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl md:text-5xl mb-3">{toolIcon}</div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            <span className="gradient-text">{toolName}</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {toolDescription}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Mobile Scanner - Show camera option for mobile-scanner tool */}
          {toolType === 'mobile-scanner' && !processing && (
            <div className="mb-8">
              <MobileScanner
                onImageCapture={(file) => {
                  // Add scanned file to existing files (allow multiple scans)
                  setSelectedFiles(prev => {
                    const newFiles = [...prev, file];
                    // Limit to maxFiles
                    return newFiles.slice(0, maxFiles);
                  });
                }}
                onFileSelected={(file) => {
                  // Add scanned file to existing files (allow multiple scans)
                  setSelectedFiles(prev => {
                    const newFiles = [...prev, file];
                    // Limit to maxFiles
                    return newFiles.slice(0, maxFiles);
                  });
                }}
              />
              {selectedFiles.length === 0 && (
                <div className="mt-6 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        OR
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Uploader - Show when no files selected or allow adding more files */}
          {!processing && !(toolType === 'html-to-pdf' && (urlToConvert || processingOptions?.url)) && (
            <div className="mb-8">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                acceptedFormats={acceptedFormats}
                maxFiles={maxFiles}
                maxFileSize={maxFileSize}
                multiple={multiple}
              />
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && !processing && (
            <div className="mb-8 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Selected Files ({selectedFiles.length})
              </h3>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between glass p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <svg className="w-10 h-10 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Options - Show immediately for html-to-pdf, otherwise show after file selection */}
          {/* Only show Options section if there are actual options to display */}
          {((selectedFiles.length > 0) || (toolType === 'html-to-pdf' || toolType === 'htm-to-pdf')) && !processing && toolType !== 'mobile-scanner' && (
            (() => {
              // Check if this toolType has options
              const hasOptions = toolType === 'split-pdf' || toolType === 'remove-pages' || toolType === 'reorder-pdf' || 
                                toolType === 'add-page-numbers' || toolType === 'password-protect' || toolType === 'unlock-pdf' ||
                                toolType === 'watermark-pdf' || toolType === 'edit-pdf' || toolType === 'annotate-pdf' ||
                                toolType === 'rotate-pdf' || toolType === 'header-footer' || toolType === 'ai-ocr' ||
                                toolType === 'pdf-ocr-extract' || toolType === 'pdf-to-png' || toolType === 'crop-pdf' ||
                                toolType === 'pdf-metadata' || toolType === 'excel-to-pdf' || toolType === 'pdf-to-excel' ||
                                toolType === 'flatten-pdf' || toolType === 'html-to-pdf' || toolType === 'htm-to-pdf' ||
                                toolType === 'esign-pdf' || options;
              
              if (!hasOptions) return null;
              
              return (
                <div className={`mb-8 ${(toolType === 'html-to-pdf' || toolType === 'htm-to-pdf') ? '' : 'glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50'}`}>
                  {(toolType !== 'html-to-pdf' && toolType !== 'htm-to-pdf') && (
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Options</h3>
                  )}
              {toolType === 'split-pdf' ? (
                <SplitPDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'remove-pages' ? (
                <RemovePDFPages
                  file={selectedFiles[0]}
                  onPagesToRemoveChange={(pagesToRemove) => {
                    // For remove-pages, pass pagesToRemove directly
                    setProcessingOptions({ pagesToRemove });
                  }}
                />
              ) : toolType === 'reorder-pdf' ? (
                <ReorderPDFPages
                  file={selectedFiles[0]}
                  onOrderChange={(pageOrder) => {
                    // For reorder-pdf, pass pageOrder
                    setProcessingOptions({ pageOrder });
                  }}
                />
              ) : toolType === 'add-page-numbers' ? (
                <AddPageNumbers
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'password-protect' ? (
                <PasswordProtect
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'unlock-pdf' ? (
                <UnlockPDFOptions
                  file={selectedFiles[0]}
                  onPasswordChange={(password) => {
                    setProcessingOptions({ password });
                  }}
                />
              ) : toolType === 'watermark-pdf' ? (
                <WatermarkOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'edit-pdf' ? (
                <EditPDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts: any) => setProcessingOptions(opts)}
                />
              ) : toolType === 'annotate-pdf' ? (
                <AnnotatePDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts: any) => setProcessingOptions(opts)}
                />
              ) : toolType === 'rotate-pdf' ? (
                <RotatePDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts: any) => setProcessingOptions(opts)}
                />
              ) : toolType === 'header-footer' ? (
                <HeaderFooterOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts: any) => setProcessingOptions(opts)}
                />
              ) : toolType === 'ai-ocr' ? (
                <OCROptions
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'pdf-ocr-extract' ? (
                <OCROptions
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'pdf-to-png' ? (
                <PNGOptions
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'crop-pdf' ? (
                <CropPDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'pdf-metadata' ? (
                <MetadataOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'excel-to-pdf' ? (
                <ExcelToPDFOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'pdf-to-excel' ? (
                <PDFToExcelOptions
                  file={selectedFiles[0]}
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'flatten-pdf' ? (
                <FlattenPDFOptions
                  onOptionsChange={(opts) => setProcessingOptions(opts)}
                />
              ) : toolType === 'html-to-pdf' || toolType === 'htm-to-pdf' ? (
                <div>
                  <HTMLToPDFOptions
                    onOptionsChange={(opts) => {
                      setProcessingOptions(opts);
                      if (opts.url) {
                        setUrlToConvert(opts.url);
                      }
                    }}
                    onUrlSubmit={(url) => {
                      setUrlToConvert(url);
                      setProcessingOptions((prev) => ({ ...prev, url }));
                    }}
                  />
                </div>
              ) : toolType === 'esign-pdf' ? (
                <div className="glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create & Place Signature</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Draw, type, or upload your signature and place it on your PDF document
                      </p>
                    </div>
                    {processingOptions?.signatureFile && (
                      <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                        ✓ Signature Ready
                      </div>
                    )}
                  </div>
                  <SignaturePad
                    pdfFile={selectedFiles[0]}
                    onSignatureChange={(signatureFile) => {
                      setProcessingOptions((prev: any) => ({
                        ...prev,
                        signatureFile,
                      }));
                    }}
                    onPositionChange={(nx, ny, page, nw, nh) => {
                      // SignaturePad passes normalized coordinates (nx, ny, nw, nh) where:
                      // nx, ny = normalized position (0-1) - top-left corner in UI
                      // nw, nh = normalized width/height (0-1)
                      // These are what eSignPDF expects
                      setProcessingOptions((prev: any) => ({
                        ...prev,
                        page: page || 1,
                        nx: nx, // Normalized X (0-1)
                        ny: ny, // Normalized Y (0-1) - from top in UI
                        nw: nw, // Normalized width (0-1)
                        nh: nh, // Normalized height (0-1)
                      }));
                    }}
                  />
                </div>
              ) : options ? (
                options
              ) : null}
                </div>
              );
            })()
          )}

          {/* Process Button */}
          {((selectedFiles.length > 0) || (toolType === 'html-to-pdf' && (urlToConvert || processingOptions?.url))) && !processing && (
            <div className="mb-8">
              <button
                onClick={handleProcess}
                className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>{toolType === 'html-to-pdf' && (urlToConvert || processingOptions?.url) ? 'Convert URL to PDF' : 'Process Files'}</span>
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {processing && (
            <div className="mb-8">
              <ProgressBar
                progress={progress.progress}
                status={progress.status}
                fileName={selectedFiles[0]?.name}
                message={progress.message}
              />
            </div>
          )}

          {/* Additional Content */}
          {children && <div className="mt-12">{children}</div>}

          {/* Features List */}
          <div className="mt-12 glass p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Fast Processing</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convert files in seconds</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">100% Secure</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All processing is client-side</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">High Quality</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maintains original quality</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">No Limits</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Process unlimited files</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={result.isOpen}
        onClose={() => setResult({ ...result, isOpen: false })}
        onDownload={handleDownload}
        onConvertAnother={handleConvertAnother}
        fileName={result.fileName}
        fileSize={result.fileSize}
        processingTime={result.processingTime}
      />

      {/* Error Toast */}
      <ErrorToast
        message={error.message}
        isVisible={error.isVisible}
        onClose={() => setError({ ...error, isVisible: false })}
        type="error"
      />
    </div>
  );
};

export default ToolTemplate;


