import React, { useState, useEffect, useRef } from 'react';

interface CropPDFOptionsProps {
  file?: File;
  onOptionsChange: (options: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    unit?: 'points' | 'inches' | 'mm' | 'cm';
    applyToAllPages?: boolean;
    pageNumbers?: number[];
  }) => void;
}

export const CropPDFOptions: React.FC<CropPDFOptionsProps> = ({ file, onOptionsChange }) => {
  const [top, setTop] = useState<number>(0);
  const [right, setRight] = useState<number>(0);
  const [bottom, setBottom] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);
  const [unit, setUnit] = useState<'points' | 'inches' | 'mm' | 'cm'>('points');
  const [pageSelection, setPageSelection] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    let pageNumbers: number[] | undefined = undefined;
    
    if (pageSelection === 'custom' && customPages.trim()) {
      // Parse page numbers (e.g., "1,3,5" or "1-5" or "1,3-5,10")
      const parsedPages: number[] = [];
      const parts = customPages.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          // Range (e.g., "1-5")
          const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
            for (let i = start; i <= end; i++) {
              if (!parsedPages.includes(i)) {
                parsedPages.push(i);
              }
            }
          }
        } else {
          // Single page number
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum > 0 && !parsedPages.includes(pageNum)) {
            parsedPages.push(pageNum);
          }
        }
      }
      
      if (parsedPages.length > 0) {
        pageNumbers = parsedPages.sort((a, b) => a - b);
      }
    }
    
    onOptionsChange({
      top,
      right,
      bottom,
      left,
      unit,
      applyToAllPages: pageSelection === 'all',
      pageNumbers: pageSelection === 'custom' ? pageNumbers : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, right, bottom, left, unit, pageSelection, customPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Crop Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set margins to crop from each side of the PDF pages. Red areas show what will be cropped.
          </p>
        </div>
      </div>

      {/* PDF Preview with Crop Guides */}
      {file && (
        <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
              Preview (Page {previewPage} of {totalPages})
            </label>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewPage(prev => Math.max(1, prev - 1))}
                  disabled={previewPage === 1}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={previewPage === totalPages}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[500px] flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-200 dark:border-gray-700 rounded shadow-lg"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            <span className="inline-block w-4 h-4 bg-red-500/30 border-2 border-red-500 rounded mr-2"></span>
            Red areas indicate content that will be removed. The white area in the center is what will remain.
          </p>
        </div>
      )}

      {/* Unit Selection */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Measurement Unit
        </label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as 'points' | 'inches' | 'mm' | 'cm')}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <option value="points">Points (pt) - PDF default</option>
          <option value="inches">Inches (in)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="mm">Millimeters (mm)</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Select the unit for margin measurements. 1 inch = 72 points = 2.54 cm = 25.4 mm
        </p>
      </div>

      {/* Crop Margins */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Crop Margins
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Top */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={top}
              onChange={(e) => setTop(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Right */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Right Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={right}
              onChange={(e) => setRight(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Bottom */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bottom Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={bottom}
              onChange={(e) => setBottom(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Left */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Left Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={left}
              onChange={(e) => setLeft(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Enter the amount to crop from each side. The values will be removed from the specified edges.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setTop(0);
              setRight(0);
              setBottom(0);
              setLeft(0);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={() => {
              const value = unit === 'points' ? 10 : unit === 'inches' ? 0.14 : unit === 'cm' ? 0.35 : 3.5;
              setTop(value);
              setRight(value);
              setBottom(value);
              setLeft(value);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            Equal Margins
          </button>
        </div>
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
              id="allPagesCrop"
              name="pageSelectionCrop"
              value="all"
              checked={pageSelection === 'all'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="allPagesCrop" className="text-sm font-medium text-gray-900 dark:text-white">
              Apply to all pages
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="customPagesCrop"
              name="pageSelectionCrop"
              value="custom"
              checked={pageSelection === 'custom'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="customPagesCrop" className="text-sm font-medium text-gray-900 dark:text-white">
              Apply to specific pages
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
              Crop PDF
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Cropping removes content from the edges of your PDF pages. Make sure the crop values don't exceed the page dimensions. 
              The cropped area will be permanently removed from the PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

