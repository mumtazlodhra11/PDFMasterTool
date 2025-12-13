import React, { useState, useEffect } from 'react';

interface EditPDFOptionsProps {
  onOptionsChange: (options: {
    editText: string;
    position: { x: number; y: number };
    page: number;
    fontSize: number;
    color: string;
    fontFamily?: string;
    alignment?: 'left' | 'center' | 'right';
    rotation?: number;
    opacity?: number;
    bold?: boolean;
    italic?: boolean;
  }) => void;
  file?: File | null;
}

export const EditPDFOptions: React.FC<EditPDFOptionsProps> = ({ 
  onOptionsChange,
  file 
}) => {
  const [editText, setEditText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(12);
  const [color, setColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('Helvetica');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [rotation, setRotation] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(100);
  const [bold, setBold] = useState<boolean>(false);
  const [italic, setItalic] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 750 });
  const [totalPages, setTotalPages] = useState<number>(1);
  const [positionPreset, setPositionPreset] = useState<string>('top-left');
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 612, height: 792 }); // Default A4
  const [pagePreview, setPagePreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    // Load PDF to get page count
    if (file) {
      loadPDFInfo();
    }
  }, [file]);

  const loadPDFInfo = async () => {
    try {
      const arrayBuffer = await file!.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
      
      // Get first page dimensions for better default positioning
      const firstPage = pdfDoc.getPage(0);
      const { width, height } = firstPage.getSize();
      setPageDimensions({ width, height });
      setPosition({ x: 50, y: height - 50 }); // Top-left with margin
    } catch (error) {
      console.error('Failed to load PDF info:', error);
    }
  };

  const loadPagePreview = async () => {
    if (!file) return;
    
    try {
      setLoadingPreview(true);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pdfPage = await pdf.getPage(page);
      const viewport = pdfPage.getViewport({ scale: 0.5 }); // Smaller scale for preview

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await pdfPage.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      setPagePreview(dataUrl);
      setLoadingPreview(false);
    } catch (error) {
      console.error('Failed to load page preview:', error);
      setLoadingPreview(false);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pagePreview || positionPreset !== 'custom') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert canvas coordinates to PDF coordinates
    const scale = pageDimensions.width / rect.width;
    const pdfX = x * scale;
    const pdfY = pageDimensions.height - (y * scale); // PDF Y is from bottom
    
    setPosition({ x: pdfX, y: pdfY });
    setPositionPreset('custom');
  };

  useEffect(() => {
    // Load page preview when page changes
    if (file && page) {
      loadPagePreview();
    }
  }, [file, page]);

  useEffect(() => {
    // Normalize color to uppercase for consistency
    const normalizedColor = color ? (color.startsWith('#') ? color.toUpperCase() : '#' + color.toUpperCase()) : '#000000';
    
    // Update parent component whenever options change
    console.log('[EditPDFOptions] Sending options:', {
      editText,
      position,
      page,
      fontSize,
      color: normalizedColor,
      fontFamily,
      alignment,
      rotation,
      opacity,
      bold,
      italic,
    });
    
    onOptionsChange({
      editText,
      position,
      page,
      fontSize,
      color: normalizedColor,
      fontFamily,
      alignment,
      rotation,
      opacity,
      bold,
      italic,
    });
  }, [editText, position, page, fontSize, color, fontFamily, alignment, rotation, opacity, bold, italic, onOptionsChange]);

  const handlePositionPreset = (preset: string) => {
    setPositionPreset(preset);
    const { width, height } = pageDimensions;
    const margin = 50;
    
    // Calculate positions based on actual page dimensions
    switch (preset) {
      case 'top-left':
        setPosition({ x: margin, y: height - margin });
        break;
      case 'top-center':
        setPosition({ x: width / 2, y: height - margin });
        break;
      case 'top-right':
        setPosition({ x: width - margin, y: height - margin });
        break;
      case 'center':
        setPosition({ x: width / 2, y: height / 2 });
        break;
      case 'bottom-left':
        setPosition({ x: margin, y: margin });
        break;
      case 'bottom-center':
        setPosition({ x: width / 2, y: margin });
        break;
      case 'bottom-right':
        setPosition({ x: width - margin, y: margin });
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6 glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      {/* Header with Help */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit PDF - Add Text</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add customizable text to your PDF with full control over position, size, color, and styling
          </p>
        </div>
        {editText && (
          <div className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            ✓ Ready to Add
          </div>
        )}
      </div>

      {/* Step 1: Text Input */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            Enter Your Text <span className="text-red-500">*</span>
          </label>
        </div>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Type the text you want to add to your PDF here... (e.g., 'Confidential', 'Draft', 'Page 1 of 10', etc.)"
          className="w-full px-4 py-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base transition-all"
          rows={4}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This text will be added to your PDF at the position you choose below</span>
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {editText.length} characters
          </span>
        </div>
      </div>

      {/* Step 2: Page Selection */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            Select Page
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
            }}
            disabled={page <= 1}
            className="px-4 py-2 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            ← Previous
          </button>
          <div className="flex-1 flex items-center justify-center space-x-3 px-4 py-3 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const pageNum = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                setPage(pageNum);
              }}
              className="w-20 px-3 py-2 text-center font-bold text-lg border-2 border-primary-200 dark:border-primary-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">of {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const newPage = Math.min(totalPages, page + 1);
              setPage(newPage);
            }}
            disabled={page >= totalPages}
            className="px-4 py-2 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Step 3: Text Styling */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            3
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            Style Your Text
          </label>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Size: <span className="font-bold text-primary-600">{fontSize}px</span>
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-8">8px</span>
              <input
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">72px</span>
            </div>
            <div className="flex items-center justify-center mt-2">
              <span 
                className="text-center font-semibold"
                style={{ fontSize: `${Math.min(fontSize, 24)}px`, color: color }}
              >
                Preview: {editText || 'Your Text'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-4 py-3 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="Helvetica">Helvetica (Modern)</option>
              <option value="Times-Roman">Times Roman (Classic)</option>
              <option value="Courier">Courier (Monospace)</option>
            </select>
          </div>
        </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="Helvetica">Helvetica</option>
            <option value="Times-Roman">Times Roman</option>
            <option value="Courier">Courier</option>
            <option value="Helvetica-Bold">Helvetica Bold</option>
            <option value="Times-Bold">Times Bold</option>
            <option value="Courier-Bold">Courier Bold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Text Alignment
          </label>
          <div className="flex space-x-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => setAlignment(align)}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  alignment === align
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Color
          </label>
          <div className="flex flex-wrap items-center gap-4 p-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  const newColor = e.target.value.toUpperCase();
                  setColor(newColor);
                }}
                className="w-16 h-12 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl cursor-pointer hover:border-primary-400 transition-colors"
                title="Click to pick a color"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const newColor = e.target.value;
                  if (newColor === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newColor.replace('#', ''))) {
                    setColor(newColor);
                  }
                }}
                className="px-4 py-2 w-32 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Colors:</span>
              {[
                { color: '#000000', name: 'Black' },
                { color: '#FF0000', name: 'Red' },
                { color: '#0000FF', name: 'Blue' },
                { color: '#008000', name: 'Green' },
                { color: '#FFA500', name: 'Orange' },
                { color: '#800080', name: 'Purple' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 flex-shrink-0 ${
                    color.toUpperCase() === c.color.toUpperCase()
                      ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-800 shadow-lg scale-110' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Style
            </label>
            <div className="flex items-center space-x-4 p-3 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={bold}
                  onChange={(e) => setBold(e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all"
                />
                <span className={`text-base font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors ${bold ? 'text-primary-600' : ''}`}>
                  Bold
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={italic}
                  onChange={(e) => setItalic(e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all"
                />
                <span className={`text-base italic text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors ${italic ? 'text-primary-600' : ''}`}>
                  Italic
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Alignment
            </label>
            <div className="flex space-x-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setAlignment(align)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                    alignment === align
                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300'
                  }`}
                >
                  {align === 'left' && '⬅ Left'}
                  {align === 'center' && '⬌ Center'}
                  {align === 'right' && '➡ Right'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Advanced Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            4
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            Advanced Options <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
          </label>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 p-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rotation: <span className="font-bold text-primary-600">{rotation}°</span>
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>-180°</span>
              <span className="font-semibold">0°</span>
              <span>180°</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Rotate text clockwise or counterclockwise
            </p>
          </div>

          <div className="space-y-2 p-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Opacity: <span className="font-bold text-primary-600">{opacity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Transparent</span>
              <span className="font-semibold">50%</span>
              <span>Opaque</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Control text transparency (0% = invisible, 100% = fully visible)
            </p>
          </div>
        </div>
      </div>

      {/* Step 5: Position */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            5
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            Choose Text Position
          </label>
        </div>
        
        <div className="p-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select a preset position or choose "Custom" to place text anywhere on the page
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: 'top-left', label: 'Top Left', icon: '↖' },
              { value: 'top-center', label: 'Top Center', icon: '↑' },
              { value: 'top-right', label: 'Top Right', icon: '↗' },
              { value: 'center', label: 'Center', icon: '○' },
              { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
              { value: 'bottom-center', label: 'Bottom Center', icon: '↓' },
              { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
              { value: 'custom', label: 'Custom', icon: '✎' },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePositionPreset(preset.value)}
                className={`px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                  positionPreset === preset.value
                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="text-lg mb-1">{preset.icon}</div>
                <div>{preset.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 6: Preview */}
      {file && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                6
              </div>
              <label className="block text-base font-semibold text-gray-900 dark:text-white">
                Preview & Position
              </label>
            </div>
            {positionPreset === 'custom' && (
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                💡 Click on preview to position
              </div>
            )}
          </div>
          
          <div className="relative border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gray-50 dark:bg-gray-900/50 p-6 overflow-auto max-h-[500px] shadow-inner">
            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading page preview...</p>
              </div>
            ) : pagePreview ? (
              <div 
                className="relative cursor-crosshair mx-auto" 
                onClick={positionPreset === 'custom' ? handlePreviewClick : undefined}
                style={{ maxWidth: '100%' }}
              >
                <img
                  src={pagePreview}
                  alt={`Page ${page} preview`}
                  className="mx-auto shadow-2xl rounded-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {editText && (
                  <div
                    className="absolute border-2 border-primary-500 bg-primary-500/20 rounded-lg px-3 py-2 text-sm pointer-events-none shadow-lg"
                    style={{
                      left: `${(position.x / pageDimensions.width) * 100}%`,
                      bottom: `${(position.y / pageDimensions.height) * 100}%`,
                      transform: `rotate(${rotation}deg)`,
                      opacity: opacity / 100,
                      color: color,
                      fontSize: `${(fontSize / 12) * 0.9}em`,
                      fontWeight: bold ? 'bold' : 'normal',
                      fontStyle: italic ? 'italic' : 'normal',
                      whiteSpace: 'nowrap',
                      fontFamily: fontFamily.includes('Times') ? 'Times, serif' : fontFamily.includes('Courier') ? 'Courier, monospace' : 'Helvetica, sans-serif',
                    }}
                  >
                    {editText}
                  </div>
                )}
                {/* Position indicator */}
                {positionPreset === 'custom' && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(position.x / pageDimensions.width) * 100}%`,
                      bottom: `${(position.y / pageDimensions.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    <div className="w-4 h-4 border-2 border-primary-600 rounded-full bg-primary-600/30">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 space-y-2 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Loading preview...</p>
              </div>
            )}
          </div>
          
          {positionPreset === 'custom' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start space-x-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  <strong>Custom Position Mode:</strong> Click anywhere on the preview above to set the exact text position, or use the manual coordinates below.
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {positionPreset === 'custom' && (
        <div className="space-y-4 p-4 glass border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Manual Position Coordinates
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                X Position (from left)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (0 - {Math.round(pageDimensions.width)})
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={pageDimensions.width}
                  value={Math.round(position.x)}
                  onChange={(e) => setPosition({ ...position, x: Math.max(0, Math.min(pageDimensions.width, parseInt(e.target.value) || 0)) })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Y Position (from bottom)
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (0 - {Math.round(pageDimensions.height)})
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={pageDimensions.height}
                  value={Math.round(position.y)}
                  onChange={(e) => setPosition({ ...position, y: Math.max(0, Math.min(pageDimensions.height, parseInt(e.target.value) || 0)) })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Y position is measured from the bottom of the page (PDF coordinate system)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {editText && (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl">
          <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 mb-2">📋 Summary</h4>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-primary-800 dark:text-primary-200">
            <div><strong>Text:</strong> {editText.substring(0, 30)}{editText.length > 30 ? '...' : ''}</div>
            <div><strong>Page:</strong> {page} of {totalPages}</div>
            <div><strong>Font:</strong> {fontFamily} {bold && 'Bold'} {italic && 'Italic'}</div>
            <div><strong>Size:</strong> {fontSize}px</div>
            <div><strong>Color:</strong> <span className="font-mono">{color}</span></div>
            <div><strong>Position:</strong> {positionPreset.replace('-', ' ')}</div>
            {rotation !== 0 && <div><strong>Rotation:</strong> {rotation}°</div>}
            {opacity !== 100 && <div><strong>Opacity:</strong> {opacity}%</div>}
          </div>
        </div>
      )}
    </div>
  );
};
