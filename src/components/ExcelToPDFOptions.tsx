import React, { useState, useEffect } from 'react';

interface ExcelToPDFOptionsProps {
  file: File;
  onOptionsChange: (options: {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'Tabloid';
    orientation?: 'portrait' | 'landscape';
    sheetSelection?: 'all' | 'current' | 'custom';
    selectedSheets?: number[];
    includeCharts?: boolean;
    includeImages?: boolean;
    fitToPage?: boolean;
    fitToWidth?: boolean;
    fitToHeight?: boolean;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    printQuality?: 'draft' | 'normal' | 'high';
    repeatRows?: boolean;
    repeatColumns?: boolean;
    showGridlines?: boolean;
    showRowColHeaders?: boolean;
    scaleChartsToFit?: boolean;
    preventChartSplit?: boolean;
    chartQuality?: 'normal' | 'high';
  }) => void;
}

export const ExcelToPDFOptions: React.FC<ExcelToPDFOptionsProps> = ({ file, onOptionsChange }) => {
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'A3' | 'Tabloid'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [sheetSelection, setSheetSelection] = useState<'all' | 'current' | 'custom'>('all');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [fitToPage, setFitToPage] = useState<boolean>(true);
  const [fitToWidth, setFitToWidth] = useState<boolean>(false);
  const [fitToHeight, setFitToHeight] = useState<boolean>(false);
  // Force landscape for charts if needed
  const [autoLandscapeForCharts, setAutoLandscapeForCharts] = useState<boolean>(true);
  const [marginTop, setMarginTop] = useState<number>(0.75);
  const [marginRight, setMarginRight] = useState<number>(0.75);
  const [marginBottom, setMarginBottom] = useState<number>(0.75);
  const [marginLeft, setMarginLeft] = useState<number>(0.75);
  const [printQuality, setPrintQuality] = useState<'draft' | 'normal' | 'high'>('high');
  const [repeatRows, setRepeatRows] = useState<boolean>(false);
  const [repeatColumns, setRepeatColumns] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [showRowColHeaders, setShowRowColHeaders] = useState<boolean>(false);
  const [scaleChartsToFit, setScaleChartsToFit] = useState<boolean>(true);
  const [preventChartSplit, setPreventChartSplit] = useState<boolean>(true);
  const [chartQuality, setChartQuality] = useState<'normal' | 'high'>('high');
  
  // Note: We allow portrait, but charts will be auto-moved/resized during conversion
  // Landscape is recommended for better chart preservation, but not forced
  const [totalSheets, setTotalSheets] = useState<number>(0);

  useEffect(() => {
    // Load Excel file info to get sheet count
    const loadExcelInfo = async () => {
      try {
        // Try to read Excel file to get sheet count
        // This is a simplified version - in production, you'd use a library like xlsx
        const arrayBuffer = await file.arrayBuffer();
        // For now, we'll assume multiple sheets exist
        // In a real implementation, you'd parse the Excel file
        setTotalSheets(1); // Default to 1, can be enhanced
      } catch (error) {
        console.warn('Could not load Excel file info:', error);
      }
    };
    loadExcelInfo();
  }, [file]);

  useEffect(() => {
    // User can choose portrait or landscape
    // If preventChartSplit is enabled, backend will auto-move/resize charts during conversion
    const options = {
      pageSize,
      orientation: orientation, // Use user's selected orientation (portrait or landscape)
      sheetSelection,
      includeCharts,
      includeImages,
      fitToPage,
      fitToWidth,
      fitToHeight,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      printQuality,
      repeatRows,
      repeatColumns,
      showGridlines,
      showRowColHeaders,
      scaleChartsToFit,
      preventChartSplit,
      chartQuality,
    };
    
    console.log('[ExcelToPDFOptions] 📊 Options being passed to parent:');
    console.log('  - preventChartSplit:', preventChartSplit);
    console.log('  - scaleChartsToFit:', scaleChartsToFit);
    console.log('  - fitToPage:', fitToPage);
    console.log('  - orientation:', orientation);
    if (preventChartSplit) {
      console.log('  - ✅ Auto-fix enabled: Charts will be moved to columns A-E and resized during conversion');
    }
    console.log('  - Full options object:', JSON.stringify(options, null, 2));
    
    onOptionsChange(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageSize,
    orientation,
    sheetSelection,
    includeCharts,
    includeImages,
    fitToPage,
    fitToWidth,
    fitToHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    printQuality,
    repeatRows,
    repeatColumns,
    showGridlines,
    showRowColHeaders,
    scaleChartsToFit,
    preventChartSplit,
    chartQuality,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Options</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your Excel to PDF conversion settings
          </p>
        </div>
      </div>

      {/* Page Settings */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Page Settings
        </label>
        <div className="space-y-4">
          {/* Page Size */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as typeof pageSize)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
              <option value="Tabloid">Tabloid (11 × 17 in)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  orientation === 'portrait'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <svg className="w-6 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
                  </svg>
                  <span className="text-xs font-medium">Portrait</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  orientation === 'landscape'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <svg className="w-8 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
                  </svg>
                  <span className="text-xs font-medium">Landscape</span>
                  {preventChartSplit && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">(Auto-fix enabled)</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Options */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Sheet Options
        </label>
        <div className="space-y-4">
          {/* Sheet Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sheet Selection
            </label>
            <select
              value={sheetSelection}
              onChange={(e) => setSheetSelection(e.target.value as typeof sheetSelection)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Sheets</option>
              <option value="current">Current Sheet Only</option>
              <option value="custom">Custom Selection</option>
            </select>
            {totalSheets > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {totalSheets} sheet(s) detected in this workbook
              </p>
            )}
          </div>

          {/* Include Options */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Include in PDF
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Charts & Graphs</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Images</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Scaling Options */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Scaling & Fit Options
        </label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fitToPage}
              onChange={(e) => {
                setFitToPage(e.target.checked);
                if (e.target.checked) {
                  setFitToWidth(false);
                  setFitToHeight(false);
                }
              }}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fit to Page (Recommended for Charts)</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ensures all content, including charts, fits on pages without splitting
              </p>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fitToWidth}
              onChange={(e) => {
                setFitToWidth(e.target.checked);
                if (e.target.checked) {
                  setFitToPage(false);
                }
              }}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Fit to Width</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fitToHeight}
              onChange={(e) => {
                setFitToHeight(e.target.checked);
                if (e.target.checked) {
                  setFitToPage(false);
                }
              }}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Fit to Height</span>
          </label>
        </div>
      </div>

      {/* Margins */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Page Margins (inches)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top: {marginTop}"
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.25"
              value={marginTop}
              onChange={(e) => setMarginTop(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Right: {marginRight}"
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.25"
              value={marginRight}
              onChange={(e) => setMarginRight(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bottom: {marginBottom}"
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.25"
              value={marginBottom}
              onChange={(e) => setMarginBottom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Left: {marginLeft}"
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.25"
              value={marginLeft}
              onChange={(e) => setMarginLeft(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMarginTop(0.75);
              setMarginRight(0.75);
              setMarginBottom(0.75);
              setMarginLeft(0.75);
            }}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Normal (0.75")
          </button>
          <button
            type="button"
            onClick={() => {
              setMarginTop(1);
              setMarginRight(1);
              setMarginBottom(1);
              setMarginLeft(1);
            }}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Wide (1")
          </button>
          <button
            type="button"
            onClick={() => {
              setMarginTop(0.5);
              setMarginRight(0.5);
              setMarginBottom(0.5);
              setMarginLeft(0.5);
            }}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Narrow (0.5")
          </button>
          <button
            type="button"
            onClick={() => {
              setMarginTop(0);
              setMarginRight(0);
              setMarginBottom(0);
              setMarginLeft(0);
            }}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            None (0")
          </button>
        </div>
      </div>

      {/* Print Quality */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Print Quality
        </label>
        <select
          value={printQuality}
          onChange={(e) => setPrintQuality(e.target.value as typeof printQuality)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="draft">Draft (Fast, Lower Quality)</option>
          <option value="normal">Normal (Balanced)</option>
          <option value="high">High (Best Quality, Slower)</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Higher quality produces better results but may take longer to process
        </p>
      </div>

      {/* Chart Options - Highlighted */}
      <div className="glass p-6 rounded-xl border-2 border-primary-300/50 dark:border-primary-700/50 bg-primary-50/30 dark:bg-primary-900/10">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <label className="block text-sm font-bold text-gray-900 dark:text-white">
            Chart & Graph Options (Keep Charts on One Page)
          </label>
        </div>
        <div className="space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800">
            <input
              type="checkbox"
              checked={preventChartSplit}
              onChange={(e) => setPreventChartSplit(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white">✅ Prevent Chart Split (REQUIRED)</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <strong>Critical Setting:</strong> This ensures ALL charts and graphs stay on ONE page and never get split across multiple pages. This is automatically enabled and should remain checked.
              </p>
            </div>
          </label>
          <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg bg-white dark:bg-gray-800">
            <input
              type="checkbox"
              checked={scaleChartsToFit}
              onChange={(e) => setScaleChartsToFit(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Scale Charts to Fit Page</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically resize charts to fit within page boundaries. Works together with "Fit to Page" option to ensure charts don't overflow.
              </p>
            </div>
          </label>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chart Quality
            </label>
            <select
              value={chartQuality}
              onChange={(e) => setChartQuality(e.target.value as typeof chartQuality)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="normal">Normal (Faster)</option>
              <option value="high">High (Best Quality - Recommended)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              High quality ensures charts render clearly and maintain sharpness when scaled to fit on one page
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                  ⚙️ Automation Enabled - Charts Are Being Automatically Adjusted
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                  <strong>When "Prevent Chart Split" is enabled, we automatically:</strong>
                </p>
                <ul className="text-xs text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1 ml-2 mb-3">
                  <li>Move ALL charts to <strong className="text-blue-700 dark:text-blue-400">column A, row 1</strong></li>
                  <li>Resize charts to <strong className="text-blue-700 dark:text-blue-400">6 columns width</strong> (A-F)</li>
                  <li>Resize charts to <strong className="text-blue-700 dark:text-blue-400">12 rows height</strong></li>
                </ul>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-300 dark:border-yellow-700">
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    ⚠️ LibreOffice Limitation:
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                    LibreOffice may not respect our automated chart position changes. If charts still split, use the manual workaround below.
                  </p>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mt-2 mb-1">
                    ✅ 100% Working Manual Solution (if automation doesn't work):
                  </p>
                  <ol className="text-xs text-gray-700 dark:text-gray-300 list-decimal list-inside space-y-1 ml-2">
                    <li>Open Excel file in <strong>Microsoft Excel</strong></li>
                    <li>Move charts to <strong className="text-green-600 dark:text-green-400">columns A-E</strong></li>
                    <li>Resize to <strong className="text-green-600 dark:text-green-400">8 columns width</strong> (A-H)</li>
                    <li>Save and convert again</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Display Options
        </label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showGridlines}
              onChange={(e) => setShowGridlines(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Gridlines</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showRowColHeaders}
              onChange={(e) => setShowRowColHeaders(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Row & Column Headers</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={repeatRows}
              onChange={(e) => setRepeatRows(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Repeat Row Headers on Each Page</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={repeatColumns}
              onChange={(e) => setRepeatColumns(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Repeat Column Headers on Each Page</span>
          </label>
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
              Professional PDF Output
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Your Excel file will be converted to a high-quality PDF with all formatting, charts, and data preserved. 
              The conversion maintains table structure and is optimized for printing and sharing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

