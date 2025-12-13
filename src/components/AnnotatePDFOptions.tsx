import React, { useState, useEffect } from 'react';

interface Annotation {
  type: 'highlight' | 'comment' | 'sticky-note' | 'underline' | 'strikethrough';
  text: string;
  page: number;
  position: { x: number; y: number };
  color: string;
  width?: number;
  height?: number;
}

interface AnnotatePDFOptionsProps {
  onOptionsChange: (options: {
    annotations: Annotation[];
  }) => void;
  file?: File | null;
}

export const AnnotatePDFOptions: React.FC<AnnotatePDFOptionsProps> = ({ 
  onOptionsChange,
  file 
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation>>({
    type: 'comment',
    text: '',
    page: 1,
    position: { x: 50, y: 750 },
    color: '#FFFF00', // Yellow for highlights
  });
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pagePreview, setPagePreview] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 612, height: 792 });
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [previewScale, setPreviewScale] = useState<number>(0.5);

  useEffect(() => {
    if (file) {
      loadPDFInfo();
    }
  }, [file]);

  useEffect(() => {
    onOptionsChange({ annotations });
  }, [annotations, onOptionsChange]);

  const loadPDFInfo = async () => {
    try {
      const arrayBuffer = await file!.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
      
      // Get page dimensions
      const firstPage = pdfDoc.getPage(0);
      const { width, height } = firstPage.getSize();
      setPageDimensions({ width, height });
      setCurrentAnnotation(prev => ({
        ...prev,
        position: { x: 50, y: height - 50 }
      }));
      
      // Load page preview
      await loadPagePreview(1, arrayBuffer);
    } catch (error) {
      console.error('Failed to load PDF info:', error);
    }
  };

  const loadPagePreview = async (pageNum: number, arrayBuffer?: ArrayBuffer) => {
    try {
      if (!file) return;
      
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const buffer = arrayBuffer || await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: previewScale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      setPagePreview(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Failed to load page preview:', error);
    }
  };

  useEffect(() => {
    if (file && currentAnnotation.page) {
      loadPagePreview(currentAnnotation.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnnotation.page, previewScale]);

  const addAnnotation = () => {
    if (!currentAnnotation.text || currentAnnotation.text.trim() === '') {
      alert('Please enter annotation text');
      return;
    }

    const newAnnotation: Annotation = {
      type: currentAnnotation.type || 'comment',
      text: currentAnnotation.text,
      page: currentAnnotation.page || 1,
      position: currentAnnotation.position || { x: 50, y: 750 },
      color: currentAnnotation.color || '#FFFF00',
      width: currentAnnotation.width,
      height: currentAnnotation.height,
    };

    setAnnotations([...annotations, newAnnotation]);
    setCurrentAnnotation({
      type: 'comment',
      text: '',
      page: 1,
      position: { x: 50, y: 750 },
      color: '#FFFF00',
    });
  };

  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'highlight':
        return '#FFFF00'; // Yellow
      case 'comment':
        return '#ADD8E6'; // Light blue
      case 'sticky-note':
        return '#FFE4B5'; // Moccasin
      case 'underline':
        return '#0000FF'; // Blue
      case 'strikethrough':
        return '#FF0000'; // Red
      default:
        return '#FFFF00';
    }
  };

  return (
    <div className="space-y-6 glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Annotation Options</h3>
        {annotations.length > 0 && (
          <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            {annotations.length} Annotation{annotations.length !== 1 ? 's' : ''} Added
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Annotation Type <span className="text-gray-500 dark:text-gray-400 text-xs">(Select annotation style)</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { value: 'highlight', label: '🖍️ Highlight', desc: 'Highlight text' },
            { value: 'comment', label: '💬 Comment', desc: 'Add comment' },
            { value: 'sticky-note', label: '📝 Note', desc: 'Sticky note' },
            { value: 'underline', label: '➖ Underline', desc: 'Underline text' },
            { value: 'strikethrough', label: '❌ Strike', desc: 'Strikethrough' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                const annotationType = type.value as Annotation['type'];
                setCurrentAnnotation({
                  ...currentAnnotation,
                  type: annotationType,
                  color: getColorForType(annotationType),
                });
              }}
              className={`px-3 py-3 rounded-xl border-2 transition-all ${
                currentAnnotation.type === type.value
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
              title={type.desc}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{type.label.split(' ')[0]}</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {type.label.split(' ').slice(1).join(' ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Annotation Text <span className="text-red-500">*</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-2">
            ({currentAnnotation.text?.length || 0} characters)
          </span>
        </label>
        <textarea
          value={currentAnnotation.text || ''}
          onChange={(e) => setCurrentAnnotation({ ...currentAnnotation, text: e.target.value })}
          placeholder="Enter your annotation text or comment..."
          className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Maximum 500 characters. Use clear, concise text for better readability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Page Number
            <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-2">
              (1-{totalPages})
            </span>
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const newPage = Math.max(1, (currentAnnotation.page || 1) - 1);
                setCurrentAnnotation({ ...currentAnnotation, page: newPage });
              }}
              disabled={(currentAnnotation.page || 1) <= 1}
              className="px-3 py-2 glass border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentAnnotation.page || 1}
              onChange={(e) => {
                const pageNum = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                setCurrentAnnotation({ ...currentAnnotation, page: pageNum });
              }}
              className="flex-1 px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                const newPage = Math.min(totalPages, (currentAnnotation.page || 1) + 1);
                setCurrentAnnotation({ ...currentAnnotation, page: newPage });
              }}
              disabled={(currentAnnotation.page || 1) >= totalPages}
              className="px-3 py-2 glass border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap px-2">
              of {totalPages}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Annotation Color
            <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-2">
              (Customize appearance)
            </span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={currentAnnotation.color || '#FFFF00'}
              onChange={(e) => {
                const newColor = e.target.value.toUpperCase();
                setCurrentAnnotation({ ...currentAnnotation, color: newColor });
              }}
              className="w-16 h-10 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
            />
            <input
              type="text"
              value={currentAnnotation.color || '#FFFF00'}
              onChange={(e) => {
                const newColor = e.target.value;
                if (newColor === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newColor.replace('#', ''))) {
                  setCurrentAnnotation({ ...currentAnnotation, color: newColor });
                }
              }}
              className="w-24 px-3 py-2 glass border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="#FFFF00"
            />
            <div className="flex space-x-1.5 flex-1">
              {[
                { color: '#FFFF00', name: 'Yellow' },
                { color: '#FF6B6B', name: 'Red' },
                { color: '#4ECDC4', name: 'Teal' },
                { color: '#45B7D1', name: 'Blue' },
                { color: '#FFA07A', name: 'Orange' },
                { color: '#98D8C8', name: 'Green' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setCurrentAnnotation({ ...currentAnnotation, color: c.color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    (currentAnnotation.color || '#FFFF00').toUpperCase() === c.color.toUpperCase()
                      ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-800 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Position Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Quick Position
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'top-left', label: 'Top Left' },
            { value: 'top-center', label: 'Top Center' },
            { value: 'top-right', label: 'Top Right' },
            { value: 'center', label: 'Center' },
            { value: 'bottom-left', label: 'Bottom Left' },
            { value: 'bottom-center', label: 'Bottom Center' },
            { value: 'bottom-right', label: 'Bottom Right' },
            { value: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                const { width, height } = pageDimensions;
                const margin = 50;
                let newPos = { x: 50, y: height - 50 };
                
                switch (preset.value) {
                  case 'top-left':
                    newPos = { x: margin, y: height - margin };
                    break;
                  case 'top-center':
                    newPos = { x: width / 2, y: height - margin };
                    break;
                  case 'top-right':
                    newPos = { x: width - margin, y: height - margin };
                    break;
                  case 'center':
                    newPos = { x: width / 2, y: height / 2 };
                    break;
                  case 'bottom-left':
                    newPos = { x: margin, y: margin };
                    break;
                  case 'bottom-center':
                    newPos = { x: width / 2, y: margin };
                    break;
                  case 'bottom-right':
                    newPos = { x: width - margin, y: margin };
                    break;
                }
                setCurrentAnnotation({
                  ...currentAnnotation,
                  position: newPos
                });
              }}
              className={`px-3 py-2 text-xs rounded-lg border-2 transition-all font-medium ${
                currentAnnotation.position?.x === (() => {
                  const { width, height } = pageDimensions;
                  const margin = 50;
                  switch (preset.value) {
                    case 'top-left': return margin;
                    case 'top-center': return width / 2;
                    case 'top-right': return width - margin;
                    case 'center': return width / 2;
                    case 'bottom-left': return margin;
                    case 'bottom-center': return width / 2;
                    case 'bottom-right': return width - margin;
                    default: return null;
                  }
                })()
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* PDF Preview with Click-to-Place */}
      {showPreview && pagePreview && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Page Preview - Click to Set Position
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-auto bg-gray-100 dark:bg-gray-800 p-4" style={{ maxHeight: '400px' }}>
            <div className="relative inline-block">
              <img
                src={pagePreview}
                alt={`Page ${currentAnnotation.page} preview`}
                className="max-w-full h-auto cursor-crosshair"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / previewScale;
                  const y = (pageDimensions.height - (e.clientY - rect.top) / previewScale);
                  setCurrentAnnotation({
                    ...currentAnnotation,
                    position: { x: Math.max(0, x), y: Math.max(0, y) }
                  });
                }}
              />
              {/* Position Indicator */}
              {currentAnnotation.position && (
                <>
                  {/* Crosshair at position */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(currentAnnotation.position.x * previewScale)}px`,
                      bottom: `${((pageDimensions.height - currentAnnotation.position.y) * previewScale)}px`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    <div className="w-4 h-4 border-2 border-primary-600 rounded-full bg-primary-600/30">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                    {/* Position label */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-primary-600 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow whitespace-nowrap">
                      X: {Math.round(currentAnnotation.position.x)}, Y: {Math.round(currentAnnotation.position.y)}
                    </div>
                  </div>
                  {/* Vertical line */}
                  <div
                    className="absolute border-l-2 border-dashed border-primary-400 pointer-events-none"
                    style={{
                      left: `${(currentAnnotation.position.x * previewScale)}px`,
                      top: '0',
                      bottom: '0',
                      transform: 'translateX(-50%)',
                    }}
                  />
                  {/* Horizontal line */}
                  <div
                    className="absolute border-t-2 border-dashed border-primary-400 pointer-events-none"
                    style={{
                      top: `${((pageDimensions.height - currentAnnotation.position.y) * previewScale)}px`,
                      left: '0',
                      right: '0',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click on the preview to set exact position
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Zoom:</label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                value={previewScale}
                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">
                {Math.round(previewScale * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Position Input */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            X Position (from left)
          </label>
          <input
            type="number"
            value={currentAnnotation.position?.x || 50}
            onChange={(e) => setCurrentAnnotation({
              ...currentAnnotation,
              position: { ...currentAnnotation.position!, x: parseInt(e.target.value) || 0 }
            })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Y Position (from bottom)
          </label>
          <input
            type="number"
            value={currentAnnotation.position?.y || 750}
            onChange={(e) => setCurrentAnnotation({
              ...currentAnnotation,
              position: { ...currentAnnotation.position!, y: parseInt(e.target.value) || 0 }
            })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Note: Y position is measured from the bottom of the page
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={addAnnotation}
        className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add Annotation
      </button>

      {annotations.length > 0 && (
        <div className="space-y-3 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50" data-annotations-list>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Added Annotations
            </h4>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                {annotations.length} Total
              </span>
              {annotations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove all annotations?')) {
                      setAnnotations([]);
                    }
                  }}
                  className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {annotations.map((annotation, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 glass rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {annotation.type === 'highlight' && '🖍️'}
                        {annotation.type === 'comment' && '💬'}
                        {annotation.type === 'sticky-note' && '📝'}
                        {annotation.type === 'underline' && '➖'}
                        {annotation.type === 'strikethrough' && '❌'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        Page {annotation.page}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {annotation.type.replace('-', ' ')}
                      </span>
                    </div>
                    <div
                      className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                      style={{ backgroundColor: annotation.color }}
                      title={annotation.color}
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {annotation.text}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Position: X: {Math.round(annotation.position.x)}, Y: {Math.round(annotation.position.y)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAnnotation(index)}
                  className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove annotation"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

