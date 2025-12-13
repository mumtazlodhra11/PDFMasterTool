import React, { useState, useEffect } from 'react';

interface PNGOptionsProps {
  onOptionsChange: (options: {
    scale?: number;
    pages?: 'all' | number[];
  }) => void;
}

export const PNGOptions: React.FC<PNGOptionsProps> = ({ onOptionsChange }) => {
  const [scale, setScale] = useState<number>(3.0);
  const [pageSelection, setPageSelection] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('');

  useEffect(() => {
    let pages: 'all' | number[] = 'all';
    
    if (pageSelection === 'custom' && customPages.trim()) {
      // Parse page numbers (e.g., "1,3,5" or "1-5" or "1,3-5,10")
      const pageNumbers: number[] = [];
      const parts = customPages.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          // Range (e.g., "1-5")
          const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
            for (let i = start; i <= end; i++) {
              if (!pageNumbers.includes(i)) {
                pageNumbers.push(i);
              }
            }
          }
        } else {
          // Single page number
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum > 0 && !pageNumbers.includes(pageNum)) {
            pageNumbers.push(pageNum);
          }
        }
      }
      
      if (pageNumbers.length > 0) {
        pages = pageNumbers.sort((a, b) => a - b);
      }
    }
    
    onOptionsChange({
      scale,
      pages,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, pageSelection, customPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">PNG Conversion Options</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure quality and page selection for PNG conversion
          </p>
        </div>
      </div>

      {/* Quality/Scale Selection */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Image Quality (DPI)
        </label>
        <select
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <option value={1.0}>Low (72 DPI) - Fast, smaller files</option>
          <option value={2.0}>Medium (150 DPI) - Balanced</option>
          <option value={3.0}>High (300 DPI) - Best quality (Recommended)</option>
          <option value={4.0}>Very High (400 DPI) - Maximum quality</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Higher DPI means better quality but larger file sizes. 300 DPI is recommended for most uses.
        </p>
      </div>

      {/* Page Selection */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Page Selection
        </label>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="allPages"
              name="pageSelection"
              value="all"
              checked={pageSelection === 'all'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="allPages" className="text-sm font-medium text-gray-900 dark:text-white">
              Convert all pages
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="customPages"
              name="pageSelection"
              value="custom"
              checked={pageSelection === 'custom'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="customPages" className="text-sm font-medium text-gray-900 dark:text-white">
              Convert specific pages
            </label>
          </div>
          
          {pageSelection === 'custom' && (
            <div className="ml-8">
              <input
                type="text"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                placeholder="e.g., 1,3,5 or 1-5 or 1,3-5,10"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter page numbers separated by commas, or use ranges (e.g., 1-5). Examples: "1,3,5" or "1-5" or "1,3-5,10"
              </p>
            </div>
          )}
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
              PNG Conversion
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              PNG format supports transparency, making it perfect for graphics and images with transparent backgrounds. 
              For single page PDFs, you'll get a PNG file. For multiple pages, all selected pages will be converted and packaged in a ZIP file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


