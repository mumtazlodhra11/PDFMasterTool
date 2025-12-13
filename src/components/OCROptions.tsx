import React, { useEffect } from 'react';

interface OCROptionsProps {
  onOptionsChange: (options: {
    language: string;
  }) => void;
}

export const OCROptions: React.FC<OCROptionsProps> = ({ onOptionsChange }) => {
  useEffect(() => {
    // Always use English for OCR
    onOptionsChange({
      language: 'eng',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">OCR Options</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure OCR settings for optimal text recognition
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              OCR Processing
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              <strong>OCR (Optical Character Recognition)</strong> extracts text from scanned documents and images. 
              Processing time depends on document size and complexity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

