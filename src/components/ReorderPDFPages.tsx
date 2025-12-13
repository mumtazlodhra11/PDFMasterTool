import React, { useState, useEffect, useRef } from 'react';

interface ReorderPDFPagesProps {
  file: File;
  onOrderChange: (pageOrder: number[]) => void;
}

export const ReorderPDFPages: React.FC<ReorderPDFPagesProps> = ({ file, onOrderChange }) => {
  const [pageThumbnails, setPageThumbnails] = useState<{ index: number; dataUrl: string }[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      const totalPages = pdf.numPages;

      const thumbnails: { index: number; dataUrl: string }[] = [];
      const order: number[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // Smaller scale for thumbnails

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
        order.push(i);
      }

      setPageThumbnails(thumbnails);
      setPageOrder(order);
      onOrderChange(order);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF pages:', error);
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;

    const newOrder = [...pageOrder];
    const draggedPage = newOrder[draggedIndex];
    
    // Remove from old position
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedPage);
    
    setPageOrder(newOrder);
    onOrderChange(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Drag and drop pages to reorder ({pageThumbnails.length} pages)
        </h3>
        <button
          onClick={() => {
            const reversed = [...pageOrder].reverse();
            setPageOrder(reversed);
            onOrderChange(reversed);
          }}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reverse Order
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pageOrder.map((pageNum, displayIndex) => {
          const thumbnail = pageThumbnails.find(t => t.index === pageNum);
          const isDragging = draggedIndex === displayIndex;
          const isDragOver = dragOverIndex === displayIndex;

          return (
            <div
              key={`${pageNum}-${displayIndex}`}
              draggable
              onDragStart={() => handleDragStart(displayIndex)}
              onDragOver={(e) => handleDragOver(e, displayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, displayIndex)}
              onDragEnd={handleDragEnd}
              className={`
                relative cursor-move p-2 rounded-lg border-2 transition-all
                ${isDragging ? 'opacity-50 scale-95 border-primary-500' : ''}
                ${isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105' : 'border-gray-300 dark:border-gray-600'}
                hover:border-primary-400 dark:hover:border-primary-500
                bg-white dark:bg-gray-800
              `}
            >
              {thumbnail && (
                <>
                  <img
                    src={thumbnail.dataUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-auto rounded border border-gray-200 dark:border-gray-700 mb-2"
                  />
                  <div className="absolute top-3 right-3 bg-primary-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {pageNum}
                  </div>
                  <div className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Position: {displayIndex + 1}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


















