import React, { useState, useEffect } from 'react';

interface PDFToExcelOptionsProps {
  file: File;
  onOptionsChange: (options: {
    tableDetection?: 'auto' | 'manual';
    pageRange?: 'all' | 'custom';
    customPages?: string;
    includeImages?: boolean;
    preserveFormatting?: boolean;
    mergeTables?: boolean;
    ocrEnabled?: boolean;
    ocrLanguage?: string;
  }) => void;
}

export const PDFToExcelOptions: React.FC<PDFToExcelOptionsProps> = ({ file, onOptionsChange }) => {
  const [tableDetection, setTableDetection] = useState<'auto' | 'manual'>('auto');
  const [pageRange, setPageRange] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('');
  const [includeImages, setIncludeImages] = useState<boolean>(false);
  const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);
  const [mergeTables, setMergeTables] = useState<boolean>(false);
  const [ocrEnabled, setOcrEnabled] = useState<boolean>(false);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    // Load PDF info to get page count
    const loadPDFInfo = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Try to read PDF to get page count
        // This is a simplified version - in production, you'd use pdf-lib or pdfjs-dist
        // For now, we'll assume the PDF has pages
        setTotalPages(1); // Default to 1, can be enhanced
      } catch (error) {
        console.warn('Could not load PDF info:', error);
      }
    };
    loadPDFInfo();
  }, [file]);

  useEffect(() => {
    const options = {
      tableDetection,
      pageRange,
      customPages: pageRange === 'custom' ? customPages : undefined,
      includeImages,
      preserveFormatting,
      mergeTables,
      ocrEnabled,
      ocrLanguage: ocrEnabled ? ocrLanguage : undefined,
    };
    onOptionsChange(options);
  }, [
    tableDetection,
    pageRange,
    customPages,
    includeImages,
    preserveFormatting,
    mergeTables,
    ocrEnabled,
    ocrLanguage,
    onOptionsChange,
  ]);

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Conversion Options
        </label>

        {/* Table Detection Mode */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Table Detection Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTableDetection('auto')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                tableDetection === 'auto'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">Auto Detect</span>
                <span className="text-xs text-gray-500">Recommended</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTableDetection('manual')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                tableDetection === 'manual'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span className="text-xs font-medium">Manual</span>
                <span className="text-xs text-gray-500">Advanced</span>
              </div>
            </button>
          </div>
        </div>

        {/* Page Range */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Page Range
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => setPageRange('all')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                pageRange === 'all'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Pages
            </button>
            <button
              type="button"
              onClick={() => setPageRange('custom')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                pageRange === 'custom'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Custom Range
            </button>
          </div>
          {pageRange === 'custom' && (
            <input
              type="text"
              value={customPages}
              onChange={(e) => setCustomPages(e.target.value)}
              placeholder="e.g., 1-5, 8, 10-12"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preserveFormatting}
              onChange={(e) => setPreserveFormatting(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Preserve Formatting (fonts, colors, styles)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include Images from PDF
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeTables}
              onChange={(e) => setMergeTables(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Merge Multiple Tables (if detected)
            </span>
          </label>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={ocrEnabled}
                onChange={(e) => setOcrEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable OCR (for scanned PDFs)
              </span>
            </label>
            {ocrEnabled && (
              <select
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="ara">Arabic</option>
                <option value="hin">Hindi</option>
                <option value="urd">Urdu</option>
              </select>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                💡 Best Results Tips
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Use PDFs with clear table structures</li>
                <li>Enable OCR for scanned PDFs</li>
                <li>One table per page works best</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

