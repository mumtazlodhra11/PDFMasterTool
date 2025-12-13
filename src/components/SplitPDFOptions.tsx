import React, { useState, useEffect } from 'react';

interface SplitPDFOptionsProps {
  file: File;
  onOptionsChange: (options: { ranges: { start: number; end: number }[] }) => void;
}

export const SplitPDFOptions: React.FC<SplitPDFOptionsProps> = ({ file, onOptionsChange }) => {
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<{ index: number; dataUrl: string }[]>([]);
  const [splitMethod, setSplitMethod] = useState<string>('all');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageInput, setPageInput] = useState<string>('');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [pagesPerFile, setPagesPerFile] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDFPages();
  }, [file]);

  useEffect(() => {
    updateSplitRanges();
  }, [splitMethod, selectedPages, startPage, endPage, pagesPerFile, totalPages]);

  const loadPDFPages = async () => {
    try {
      setLoading(true);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      setTotalPages(total);
      setEndPage(total);
      setPagesPerFile(1);

      const thumbnails: { index: number; dataUrl: string }[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });

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
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
          pages.push(pageNum);
        }
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const updateSplitRanges = () => {
    let ranges: { start: number; end: number }[] = [];

    if (splitMethod === 'all') {
      // Split all pages individually
      ranges = Array.from({ length: totalPages }, (_, i) => ({
        start: i + 1,
        end: i + 1,
      }));
    } else if (splitMethod === 'range') {
      // Split by page range
      const start = Math.max(1, Math.min(startPage, totalPages));
      const end = Math.max(start, Math.min(endPage, totalPages));
      ranges = [{ start, end }];
    } else if (splitMethod === 'pages-per-file') {
      // Split by pages per file
      let currentPage = 1;
      while (currentPage <= totalPages) {
        const end = Math.min(currentPage + pagesPerFile - 1, totalPages);
        ranges.push({ start: currentPage, end });
        currentPage = end + 1;
      }
    } else if (splitMethod === 'custom') {
      // Split by selected pages
      if (selectedPages.size > 0) {
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
        
        // Group consecutive pages into ranges
        let rangeStart = sortedPages[0];
        let rangeEnd = sortedPages[0];
        
        for (let i = 1; i < sortedPages.length; i++) {
          if (sortedPages[i] === rangeEnd + 1) {
            rangeEnd = sortedPages[i];
          } else {
            ranges.push({ start: rangeStart, end: rangeEnd });
            rangeStart = sortedPages[i];
            rangeEnd = sortedPages[i];
          }
        }
        ranges.push({ start: rangeStart, end: rangeEnd });
      }
    }

    onOptionsChange({ ranges });
  };

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    const pages = parsePageInput(value);
    setSelectedPages(new Set(pages));
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
    
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
            Split Method
          </label>
          <select
            value={splitMethod}
            onChange={(e) => setSplitMethod(e.target.value)}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Split all pages (each page becomes a separate PDF)</option>
            <option value="range">Split by page range</option>
            <option value="pages-per-file">Split by pages per file</option>
            <option value="custom">Select specific pages</option>
          </select>
        </div>

        {splitMethod === 'range' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Start Page
              </label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={startPage}
                onChange={(e) => setStartPage(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages)))}
                className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                End Page
              </label>
              <input
                type="number"
                min={startPage}
                max={totalPages}
                value={endPage}
                onChange={(e) => setEndPage(Math.max(startPage, Math.min(parseInt(e.target.value) || startPage, totalPages)))}
                className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {splitMethod === 'pages-per-file' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Pages per File
            </label>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pagesPerFile}
              onChange={(e) => setPagesPerFile(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages)))}
              className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This will create {Math.ceil(totalPages / pagesPerFile)} PDF file(s)
            </p>
          </div>
        )}

        {splitMethod === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Page Numbers to Split
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              placeholder="e.g., 1, 3, 5-8, 10"
              className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Enter page numbers separated by commas. Use ranges like "5-8" for consecutive pages.
            </p>
          </div>
        )}

        {splitMethod === 'all' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Will create {totalPages} separate PDF files, one for each page.
            </p>
          </div>
        )}

        {splitMethod === 'range' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              Will create 1 PDF file containing pages {startPage} to {endPage}.
            </p>
          </div>
        )}

        {splitMethod === 'custom' && selectedPages.size > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>{selectedPages.size}</strong> page(s) selected: {Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
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
            const isSelected = splitMethod === 'custom' && selectedPages.has(thumbnail.index);
            const isInRange = splitMethod === 'range' && thumbnail.index >= startPage && thumbnail.index <= endPage;
            const showHighlight = isSelected || isInRange;
            
            return (
              <div
                key={thumbnail.index}
                onClick={() => splitMethod === 'custom' && togglePageSelection(thumbnail.index)}
                className={`
                  relative p-2 rounded-lg border-2 transition-all
                  ${splitMethod === 'custom' ? 'cursor-pointer' : ''}
                  ${showHighlight 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' 
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
                  showHighlight ? 'bg-primary-600' : 'bg-gray-600'
                }`}>
                  {thumbnail.index}
                </div>
                {isSelected && (
                  <div className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ✓
                  </div>
                )}
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {splitMethod === 'all' && 'Will split'}
                  {splitMethod === 'range' && (isInRange ? 'In range' : 'Not in range')}
                  {splitMethod === 'pages-per-file' && 'Will split'}
                  {splitMethod === 'custom' && (isSelected ? 'Selected' : 'Not selected')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};













