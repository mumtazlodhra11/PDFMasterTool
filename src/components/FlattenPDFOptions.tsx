import React, { useState, useEffect } from 'react';

interface FlattenPDFOptionsProps {
  onOptionsChange: (options: {
    flattenMode?: 'all' | 'forms' | 'annotations';
    pageSelection?: 'all' | number[];
  }) => void;
}

export const FlattenPDFOptions: React.FC<FlattenPDFOptionsProps> = ({ onOptionsChange }) => {
  const [flattenMode, setFlattenMode] = useState<'all' | 'forms' | 'annotations'>('all');
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
      flattenMode,
      pageSelection: pages,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flattenMode, pageSelection, customPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Flatten Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure how to flatten interactive elements in your PDF
          </p>
        </div>
      </div>

      {/* Flatten Mode */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Flatten Mode
        </label>
        <select
          value={flattenMode}
          onChange={(e) => setFlattenMode(e.target.value as 'all' | 'forms' | 'annotations')}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <option value="all">Flatten All (Forms + Annotations)</option>
          <option value="forms">Flatten Forms Only</option>
          <option value="annotations">Flatten Annotations Only</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Choose what to flatten. "All" will flatten both interactive form fields and annotations into static content.
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
              id="allPagesFlatten"
              name="pageSelectionFlatten"
              value="all"
              checked={pageSelection === 'all'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="allPagesFlatten" className="text-sm font-medium text-gray-900 dark:text-white">
              Flatten all pages
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="customPagesFlatten"
              name="pageSelectionFlatten"
              value="custom"
              checked={pageSelection === 'custom'}
              onChange={(e) => setPageSelection(e.target.value as 'all' | 'custom')}
              className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="customPagesFlatten" className="text-sm font-medium text-gray-900 dark:text-white">
              Flatten specific pages
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

      {/* Info Cards */}
      <div className="space-y-4">
        <div className="glass p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                What is Flattening?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Flattening converts interactive PDF elements (form fields, annotations, comments) into static content. 
                This makes the PDF non-editable and ensures all content is visible when printing or viewing.
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                Important Note
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Flattening is irreversible. Once flattened, form fields and annotations cannot be edited. 
                Make sure to keep a backup of your original PDF if you need to edit it later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

