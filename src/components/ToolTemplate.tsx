import React, { useState, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { ProgressBar } from './ProgressBar';
import { ResultModal } from './ResultModal';
import { ErrorToast } from './ErrorToast';
import { formatFileSize } from '@/utils/pdfUtils';
import type { ConversionProgress } from '@/utils/pdfUtils';

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
    setSelectedFiles(files);
    setError({ message: '', isVisible: false });
  }, []);

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      setError({ message: 'Please select files first', isVisible: true });
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

      const finalBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
      const fileName = outputFileName
        ? (typeof outputFileName === 'function' 
           ? outputFileName(selectedFiles[0].name)
           : outputFileName)
        : `converted_${selectedFiles[0].name}`;

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
      imagesToPDF,
      pdfToJPG,
      addWatermark,
      addPageNumbers,
      addHeaderFooter,
      unlockPDF,
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
        return await splitPDF(files[0], options);
      
      case 'compress-pdf':
        return await compressPDF(files[0], options);
      
      case 'rotate-pdf':
        return await rotatePDF(files[0], options);
      
      case 'remove-pages':
        return await removePDFPages(files[0], options);
      
      case 'reorder-pdf':
        return await removePDFPages(files[0], options); // Reuses same logic
      
      case 'image-to-pdf':
        return await imagesToPDF(files);
      
      case 'pdf-to-jpg':
        return await pdfToJPG(files[0]);
      
      case 'watermark-pdf':
        return await addWatermark(files[0], options?.watermarkText || 'WATERMARK');
      
      case 'add-page-numbers':
        return await addPageNumbers(files[0]);
      
      case 'header-footer':
        return await addHeaderFooter(files[0], options?.headerText, options?.footerText);
      
      case 'unlock-pdf':
        return await unlockPDF(files[0], options?.password);
      
      case 'html-to-pdf':
        return await htmlToPDF(options?.htmlContent || '<h1>Sample HTML</h1>');
      
      case 'annotate-pdf':
        return await annotatePDF(files[0], options?.annotationText || 'Annotation');
      
      case 'esign-pdf':
        if (!options?.signatureFile) {
          throw new Error('Signature image required for eSign');
        }
        return await eSignPDF(files[0], options.signatureFile);
      
      case 'fill-forms':
        return await fillPDFForm(files[0], options?.formData || {});
      
      case 'edit-pdf':
        return await editPDF(files[0], options?.editText || 'Edit text', options?.position);
      
      case 'password-protect':
        // Client-side password protection (basic)
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Server-side tools using AWS Lambda
      case 'pdf-to-word':
      case 'word-to-pdf':
      case 'pdf-to-excel':
      case 'pdf-to-ppt':
      case 'powerpoint-to-pdf':
        const { callLambdaConverter } = await import('@/utils/awsClient');
        return await callLambdaConverter(type, files[0]);
      
      default:
        throw new Error(`"${type}" tool requires AWS Lambda for server-side processing. Please run: cd aws && npm run deploy`);
    }
  };

  const handleDownload = () => {
    if (result.blob) {
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{toolIcon}</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <span className="gradient-text">{toolName}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {toolDescription}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* File Uploader */}
          {!processing && selectedFiles.length === 0 && (
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

          {/* Options */}
          {options && selectedFiles.length > 0 && !processing && (
            <div className="mb-8 glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Options</h3>
              {options}
            </div>
          )}

          {/* Process Button */}
          {selectedFiles.length > 0 && !processing && (
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
                <span>Process Files</span>
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


