import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  acceptedFormats,
  maxFiles = 10,
  maxFileSize = 150,
  multiple = true,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure component only renders on client to prevent hydration errors
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check dark mode
  React.useEffect(() => {
    if (!mounted) return;
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark') || 
                window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mounted]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File size must be less than ${maxFileSize}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(`Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`);
        } else {
          setError(`File upload failed: ${rejection.errors[0]?.message || 'Please try again.'}`);
        }
        return;
      }

      if (acceptedFiles.length === 0) {
        setError('No files were selected. Please try again.');
        return;
      }

      if (acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      try {
        onFilesSelected(acceptedFiles);
      } catch (error) {
        setError('Failed to process files. Please try again.');
      }
    },
    [onFilesSelected, acceptedFormats, maxFiles, maxFileSize]
  );

  // Build accept object for dropzone
  const acceptObject = React.useMemo(() => {
    const mimeTypes: Record<string, string[]> = {
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.xls': ['application/vnd.ms-excel'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.ppt': ['application/vnd.ms-powerpoint'],
      '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.webp': ['image/webp'],
      '.heic': ['image/heic'],
      '.html': ['text/html'],
      '.htm': ['text/html'],
      '.txt': ['text/plain'],
    };
    
    const accept: Record<string, string[]> = {};
    acceptedFormats.forEach(format => {
      const mime = mimeTypes[format] || [];
      mime.forEach(m => {
        accept[m] = [];
      });
    });
    
    return accept;
  }, [acceptedFormats]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    onDrop,
    accept: acceptObject,
    multiple,
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles,
    noClick: false,
    noKeyboard: false,
    disabled: false,
  });
  

  // CRITICAL FIX for production: Call getRootProps/getInputProps directly in render
  // This ensures event handlers are properly attached during hydration
  const rootProps = getRootProps();
  const inputProps = getInputProps();

  return (
    <div className="w-full">
      <div {...rootProps} className="cursor-pointer">
        <input {...inputProps} />
        <div
          className={`
            relative rounded-2xl p-6 md:p-8 text-center
            transition-all duration-300 glass hover:glass-hover
            border-2 border-dashed
            ${isDragReject ? '!border-red-500 bg-red-50/50 dark:bg-red-900/20' : isDragActive ? '!border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 scale-105' : '!border-red-400 dark:!border-red-500'}
          `}
          style={{
            borderColor: isDragReject 
              ? '#ef4444' 
              : isDragActive 
              ? '#3b82f6' 
              : isDark 
              ? '#ef4444' 
              : '#f87171'
          }}
        >
          {mounted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Upload Icon */}
              <motion.div
                animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isDragActive ? Infinity : 0, duration: 1.5 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </motion.div>

              {/* Text */}
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse from your computer
                </p>
              </div>

              {/* File Info */}
              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{acceptedFormats.join(', ')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Max {maxFileSize}MB</span>
                </span>
                {multiple && (
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Up to {maxFiles} files</span>
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {/* Upload Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
                <svg
                  className={`w-8 h-8 text-gray-400`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Drag & drop files here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse from your computer
                </p>
              </div>

              {/* File Info */}
              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{acceptedFormats.join(', ')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Max {maxFileSize}MB</span>
                </span>
                {multiple && (
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Up to {maxFiles} files</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Visible click button as fallback */}
          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                open();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Or Click Here to Browse Files
            </button>
          </div>

          {/* Animated Background */}
          {mounted && isDragActive && (
            <motion.div
              className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
