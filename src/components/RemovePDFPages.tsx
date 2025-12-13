import React, { useState, useEffect } from 'react';

interface RemovePDFPagesProps {
  file: File;
  onPagesToRemoveChange: (pagesToRemove: number[]) => void;
}

export const RemovePDFPages: React.FC<RemovePDFPagesProps> = ({ file, onPagesToRemoveChange }) => {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<{ index: number; dataUrl: string }[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageInput, setPageInput] = useState<string>('');
  const [removeMethod, setRemoveMethod] = useState<string>('select');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDFPages();
  }, [file]);

  const loadPDFPages = async () => {
    try {
      setLoading(true);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      setTotalPages(total);

      const thumbnails: { index: number; dataUrl: string }[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 }); // Smaller scale for thumbnails

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL('image/png');
        thumbnails.push({ index: i, dataUrl });
      }

      setPageThumbnails(thumbnails);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF pages:', error);
      setLoading(false);
    }
  };

  const parsePageInput = (input: string): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "5-8"
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
          const rangeStart = Math.min(start, end);
          const rangeEnd = Math.max(start, end);
          for (let i = rangeStart; i <= rangeEnd; i++) {
            if (i <= totalPages) {
              pages.push(i);
            }
          }
        }
      } else {
        // Single page number
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
          pages.push(pageNum);
        }
      }
    }

    return [...new Set(pages)]; // Remove duplicates
  };

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    const pages = parsePageInput(value);
    setSelectedPages(new Set(pages));
    onPagesToRemoveChange(pages);
  };

  const handleRemoveMethodChange = (method: string) => {
    setRemoveMethod(method);
    let pages: number[] = [];

    if (method === 'odd') {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 1);
    } else if (method === 'even') {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
    } else if (method === 'range' && pageInput) {
      pages = parsePageInput(pageInput);
    }

    setSelectedPages(new Set(pages));
    onPagesToRemoveChange(pages);
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
    onPagesToRemoveChange(Array.from(newSelected).sort((a, b) => a - b));
    
    // Update input field
    const sorted = Array.from(newSelected).sort((a, b) => a - b);
    setPageInput(sorted.join(', '));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading PDF pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Remove Method
          </label>
          <select
            value={removeMethod}
            onChange={(e) => handleRemoveMethodChange(e.target.value)}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="select">Select specific pages</option>
            <option value="range">Remove page range</option>
            <option value="odd">Remove all odd pages</option>
            <option value="even">Remove all even pages</option>
          </select>
        </div>

        {removeMethod === 'select' || removeMethod === 'range' ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Page Numbers to Remove
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              placeholder="e.g., 1, 3, 5-8, 10"
              className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Enter page numbers separated by commas. Use ranges like "5-8" for multiple consecutive pages.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {removeMethod === 'odd' 
                ? `Will remove all odd pages (1, 3, 5, 7, ...) - ${Math.ceil(totalPages / 2)} pages`
                : `Will remove all even pages (2, 4, 6, 8, ...) - ${Math.floor(totalPages / 2)} pages`}
            </p>
          </div>
        )}

        {selectedPages.size > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>{selectedPages.size}</strong> page(s) will be removed: {Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview Pages ({totalPages} total)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pageThumbnails.map((thumbnail) => {
            const isSelected = selectedPages.has(thumbnail.index);
            return (
              <div
                key={thumbnail.index}
                onClick={() => togglePageSelection(thumbnail.index)}
                className={`
                  relative cursor-pointer p-2 rounded-lg border-2 transition-all
                  ${isSelected 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'}
                  bg-white dark:bg-gray-800
                `}
              >
                <img
                  src={thumbnail.dataUrl}
                  alt={`Page ${thumbnail.index}`}
                  className="w-full h-auto rounded border border-gray-200 dark:border-gray-700 mb-2"
                />
                <div className={`absolute top-3 right-3 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                  isSelected ? 'bg-red-600' : 'bg-primary-600'
                }`}>
                  {thumbnail.index}
                </div>
                {isSelected && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ✕
                  </div>
                )}
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {isSelected ? 'Will remove' : 'Keep'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


















