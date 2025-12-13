import React, { useState, useEffect } from 'react';

interface HTMLToPDFOptionsProps {
  onOptionsChange: (options: {
    url?: string;
    htmlContent?: string;
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
    waitTime?: number;
  }) => void;
  onUrlSubmit?: (url: string) => void;
}

export const HTMLToPDFOptions: React.FC<HTMLToPDFOptionsProps> = ({ onOptionsChange, onUrlSubmit }) => {
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState<string>('');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(36);
  const [waitTime, setWaitTime] = useState<number>(4000);
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    onOptionsChange({
      url: inputMode === 'url' ? url : undefined,
      pageSize,
      orientation,
      margin,
      waitTime,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, url, pageSize, orientation, margin, waitTime]);

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
    if (value && !validateUrl(value)) {
      setUrlError('Please enter a valid URL (must start with http:// or https://)');
    }
  };

  const handleUrlSubmit = () => {
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    if (!validateUrl(url)) {
      setUrlError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }
    if (onUrlSubmit) {
      onUrlSubmit(url.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Options</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose to convert from URL or upload HTML files
          </p>
        </div>
      </div>

      {/* Input Mode Selection */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Input Method
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`px-6 py-4 rounded-lg border-2 transition-all ${
              inputMode === 'file'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Upload HTML File</span>
              <span className="text-xs">Upload .html or .htm files</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-6 py-4 rounded-lg border-2 transition-all ${
              inputMode === 'url'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              <span className="font-semibold">Enter Website URL</span>
              <span className="text-xs">Convert live web pages</span>
            </div>
          </button>
        </div>
      </div>

      {/* URL Input */}
      {inputMode === 'url' && (
        <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Website URL
          </label>
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  urlError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlSubmit();
                  }
                }}
              />
              {urlError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{urlError}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter the full URL of the webpage you want to convert to PDF (e.g., https://example.com)
              </p>
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!url.trim() || !!urlError}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Convert URL
            </button>
          </div>
        </div>
      )}

      {/* PDF Settings */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
          PDF Settings
        </label>
        <div className="space-y-4">
          {/* Page Size */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter' | 'Legal')}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
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
                </div>
              </button>
            </div>
          </div>

          {/* Margin */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Margin: {margin} pt ({Math.round(margin / 72 * 25.4)} mm)
            </label>
            <input
              type="range"
              min="0"
              max="144"
              step="18"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0 pt</span>
              <span>72 pt (1 in)</span>
              <span>144 pt (2 in)</span>
            </div>
          </div>

          {/* Wait Time (for URL conversion) */}
          {inputMode === 'url' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page Load Wait Time: {waitTime / 1000}s
              </label>
              <input
                type="range"
                min="2000"
                max="20000"
                step="1000"
                value={waitTime}
                onChange={(e) => setWaitTime(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>2s (Fast)</span>
                <span>5s (Good)</span>
                <span>10s (Best Quality)</span>
                <span>20s (Complex Pages)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Time to wait for page to fully load before conversion. Higher values ensure better quality by allowing all images, fonts, and dynamic content to load completely. Recommended: 5-10 seconds for best results.
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
              URL Conversion
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              When converting from URL, the webpage will be loaded and rendered before conversion. 
              For pages with dynamic content, increase the wait time to ensure all content loads properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

