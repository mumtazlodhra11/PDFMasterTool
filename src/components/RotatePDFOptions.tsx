import React, { useState, useEffect } from 'react';

interface RotatePDFOptionsProps {
  onOptionsChange: (options: {
    angle: 90 | 180 | 270;
    pages: number[] | 'all' | 'odd' | 'even';
  }) => void;
  file?: File | null;
}

export const RotatePDFOptions: React.FC<RotatePDFOptionsProps> = ({ 
  onOptionsChange,
  file 
}) => {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (file) {
      loadPDFInfo();
    }
  }, [file]);

  useEffect(() => {
    let pages: number[] | 'all' | 'odd' | 'even' = 'all';
    
    if (pageSelection === 'all') {
      pages = 'all';
    } else if (pageSelection === 'odd') {
      pages = 'odd';
    } else if (pageSelection === 'even') {
      pages = 'even';
    } else if (pageSelection === 'custom' && customPages.trim()) {
      // Parse custom pages (e.g., "1,3,5-7,10")
      const pageNumbers: number[] = [];
      const parts = customPages.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          // Range like "5-7"
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
          if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i <= totalPages) pageNumbers.push(i);
            }
          }
        } else {
          // Single page number
          const num = parseInt(trimmed);
          if (!isNaN(num) && num > 0 && num <= totalPages) {
            pageNumbers.push(num);
          }
        }
      }
      
      // Remove duplicates and sort
      pages = [...new Set(pageNumbers)].sort((a, b) => a - b);
      
      // Only send if we have valid pages
      if (pages.length === 0) {
        return; // Don't send invalid options
      }
    } else if (pageSelection === 'custom' && !customPages.trim()) {
      // Custom selected but no pages entered yet
      return; // Don't send options until pages are entered
    }
    
    // Always send options when we have valid data
    onOptionsChange({ angle, pages });
  }, [angle, pageSelection, customPages, totalPages, onOptionsChange]);

  const loadPDFInfo = async () => {
    try {
      const arrayBuffer = await file!.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
    } catch (error) {
      console.error('Failed to load PDF info:', error);
    }
  };

  const getPagesPreview = () => {
    if (pageSelection === 'all') {
      return `All ${totalPages} pages`;
    } else if (pageSelection === 'odd') {
      const oddPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 1);
      return `Pages: ${oddPages.join(', ')}`;
    } else if (pageSelection === 'even') {
      const evenPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
      return `Pages: ${evenPages.join(', ')}`;
    } else if (pageSelection === 'custom' && customPages.trim()) {
      return `Custom pages`;
    }
    return '';
  };

  return (
    <div className="space-y-6 glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rotation Options</h3>
        {totalPages > 0 && (
          <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            {totalPages} Page{totalPages !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Rotation Angle
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setAngle(90)}
            className={`px-4 py-4 glass border-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center space-y-2 ${
              angle === 90
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200/50 dark:border-gray-700/50 hover:border-primary-400 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>90° Right</span>
            <span className="text-xs opacity-75">Clockwise</span>
          </button>
          <button
            type="button"
            onClick={() => setAngle(180)}
            className={`px-4 py-4 glass border-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center space-y-2 ${
              angle === 180
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200/50 dark:border-gray-700/50 hover:border-primary-400 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>180°</span>
            <span className="text-xs opacity-75">Upside Down</span>
          </button>
          <button
            type="button"
            onClick={() => setAngle(270)}
            className={`px-4 py-4 glass border-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center space-y-2 ${
              angle === 270
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200/50 dark:border-gray-700/50 hover:border-primary-400 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>90° Left</span>
            <span className="text-xs opacity-75">Counter-clockwise</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Apply To
        </label>
        <select
          value={pageSelection}
          onChange={(e) => setPageSelection(e.target.value as any)}
          className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Pages ({totalPages} pages)</option>
          <option value="odd">Odd Pages Only</option>
          <option value="even">Even Pages Only</option>
          <option value="custom">Custom Pages</option>
        </select>
        {getPagesPreview() && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {getPagesPreview()}
          </p>
        )}
      </div>

      {pageSelection === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Custom Pages
          </label>
          <input
            type="text"
            value={customPages}
            onChange={(e) => setCustomPages(e.target.value)}
            placeholder="e.g., 1,3,5-7,10 (page numbers or ranges)"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Enter page numbers separated by commas. Use ranges like "5-7" for multiple pages. Example: 1,3,5-7,10
          </p>
        </div>
      )}

      <div className="glass p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Rotation Info</p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
              Selected: {angle}° rotation on {pageSelection === 'all' ? 'all pages' : pageSelection === 'odd' ? 'odd pages' : pageSelection === 'even' ? 'even pages' : 'custom pages'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
















