import React, { useState, useEffect } from 'react';

interface HeaderFooterOptionsProps {
  onOptionsChange: (options: {
    headerText: string;
    footerText: string;
    headerPosition: 'left' | 'center' | 'right';
    footerPosition: 'left' | 'center' | 'right';
    fontSize: number;
    headerColor: string;
    footerColor: string;
  }) => void;
  file?: File | null;
}

export const HeaderFooterOptions: React.FC<HeaderFooterOptionsProps> = ({ 
  onOptionsChange,
  file 
}) => {
  const [headerText, setHeaderText] = useState<string>('');
  const [footerText, setFooterText] = useState<string>('Page {page} of {total}');
  const [headerPosition, setHeaderPosition] = useState<'left' | 'center' | 'right'>('center');
  const [footerPosition, setFooterPosition] = useState<'left' | 'center' | 'right'>('center');
  const [fontSize, setFontSize] = useState<number>(10);
  const [headerColor, setHeaderColor] = useState<string>('#000000');
  const [footerColor, setFooterColor] = useState<string>('#000000');

  useEffect(() => {
    // Initialize with default values
    onOptionsChange({
      headerText,
      footerText,
      headerPosition,
      footerPosition,
      fontSize,
      headerColor,
      footerColor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerText, footerText, headerPosition, footerPosition, fontSize, headerColor, footerColor]);

  const insertPlaceholder = (text: string, placeholder: string, setter: (value: string) => void) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setter(newText);
      // Set cursor position after placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setter(text + placeholder);
    }
  };

  // Debug: Log when component renders
  useEffect(() => {
    console.log('[HeaderFooterOptions] Component rendered', { file: file?.name, headerText, footerText });
  }, [file, headerText, footerText]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Header & Footer Options</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add professional headers and footers with page numbers, dates, and custom text
          </p>
        </div>
        {(headerText || footerText) && (
          <div className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            ✓ Configured
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="glass p-6 rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Header</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Header Text
            </label>
            <textarea
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Enter header text... (e.g., 'Document Title', 'Confidential', or use placeholders below)"
              className="w-full px-4 py-3 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              rows={3}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 self-center">Quick Insert:</span>
              <button
                type="button"
                onClick={() => insertPlaceholder(headerText, '{page}', setHeaderText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Current page number"
              >
                {'{page}'} - Page #
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder(headerText, '{total}', setHeaderText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Total pages"
              >
                {'{total}'} - Total Pages
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder(headerText, '{date}', setHeaderText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Current date"
              >
                {'{date}'} - Date
              </button>
            </div>
            {headerText && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Preview: {headerText.replace(/{page}/g, '1').replace(/{total}/g, '10').replace(/{date}/g, new Date().toLocaleDateString())}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Position
              </label>
              <div className="flex space-x-2">
                {(['left', 'center', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setHeaderPosition(pos)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                      headerPosition === pos
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300'
                    }`}
                  >
                    {pos === 'left' && '⬅ Left'}
                    {pos === 'center' && '⬌ Center'}
                    {pos === 'right' && '➡ Right'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={headerColor}
                  onChange={(e) => setHeaderColor(e.target.value.toUpperCase())}
                  className="w-16 h-12 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl cursor-pointer hover:border-primary-400 transition-colors"
                />
                <input
                  type="text"
                  value={headerColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    if (newColor === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newColor.replace('#', ''))) {
                      setHeaderColor(newColor);
                    }
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="#000000"
                />
                <div className="flex space-x-1.5">
                  {['#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHeaderColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        headerColor.toUpperCase() === c.toUpperCase()
                          ? 'border-primary-600 ring-2 ring-primary-300 shadow-md'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="glass p-6 rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Footer</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Footer Text
            </label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Enter footer text... (e.g., 'Page {page} of {total}', '© 2025 Company Name', or use placeholders below)"
              className="w-full px-4 py-3 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              rows={3}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 self-center">Quick Insert:</span>
              <button
                type="button"
                onClick={() => insertPlaceholder(footerText, '{page}', setFooterText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Current page number"
              >
                {'{page}'} - Page #
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder(footerText, '{total}', setFooterText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Total pages"
              >
                {'{total}'} - Total Pages
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder(footerText, '{date}', setFooterText)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all border border-primary-200 dark:border-primary-800"
                title="Current date"
              >
                {'{date}'} - Date
              </button>
            </div>
            {footerText && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Preview: {footerText.replace(/{page}/g, '1').replace(/{total}/g, '10').replace(/{date}/g, new Date().toLocaleDateString())}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Position
              </label>
              <div className="flex space-x-2">
                {(['left', 'center', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFooterPosition(pos)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                      footerPosition === pos
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300'
                    }`}
                  >
                    {pos === 'left' && '⬅ Left'}
                    {pos === 'center' && '⬌ Center'}
                    {pos === 'right' && '➡ Right'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={footerColor}
                  onChange={(e) => setFooterColor(e.target.value.toUpperCase())}
                  className="w-16 h-12 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl cursor-pointer hover:border-primary-400 transition-colors"
                />
                <input
                  type="text"
                  value={footerColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    if (newColor === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newColor.replace('#', ''))) {
                      setFooterColor(newColor);
                    }
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="#000000"
                />
                <div className="flex space-x-1.5">
                  {['#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFooterColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        footerColor.toUpperCase() === c.toUpperCase()
                          ? 'border-primary-600 ring-2 ring-primary-300 shadow-md'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="glass p-6 rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
          Font Size: <span className="text-primary-600 font-bold">{fontSize}px</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-10">8px</span>
          <input
            type="range"
            min="8"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">24px</span>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Adjust the font size for both header and footer text
        </p>
      </div>

      {/* Quick Templates */}
      <div className="glass p-6 rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
          Quick Templates
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
            (Click to apply pre-configured styles)
          </span>
        </label>
        <div className="grid md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setHeaderText('');
              setFooterText('Page {page} of {total}');
              setHeaderPosition('center');
              setFooterPosition('center');
            }}
            className="px-4 py-4 text-left border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
          >
            <div className="font-bold text-gray-900 dark:text-white mb-1">📄 Simple Page Numbers</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Footer: Page {'{page}'} of {'{total}'}</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setHeaderText('Confidential | Page {page} | {date}');
              setFooterText('© 2025 Your Company');
              setHeaderPosition('center');
              setFooterPosition('center');
            }}
            className="px-4 py-4 text-left border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
          >
            <div className="font-bold text-gray-900 dark:text-white mb-1">💼 Professional</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Header: Confidential | Page {'{page}'} | {'{date}'}</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setHeaderText('Document Title');
              setFooterText('Page {page} / {total} | {date}');
              setHeaderPosition('left');
              setFooterPosition('right');
            }}
            className="px-4 py-4 text-left border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
          >
            <div className="font-bold text-gray-900 dark:text-white mb-1">🎓 Academic Style</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Left header, right footer</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setHeaderText('');
              setFooterText('');
            }}
            className="px-4 py-4 text-left border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all"
          >
            <div className="font-bold text-gray-900 dark:text-white mb-1">🗑️ Clear All</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Remove headers and footers</div>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {(headerText || footerText) && (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl">
          <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 mb-2">📋 Summary</h4>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-primary-800 dark:text-primary-200">
            {headerText && (
              <>
                <div><strong>Header:</strong> {headerText.substring(0, 40)}{headerText.length > 40 ? '...' : ''}</div>
                <div><strong>Header Position:</strong> {headerPosition}</div>
              </>
            )}
            {footerText && (
              <>
                <div><strong>Footer:</strong> {footerText.substring(0, 40)}{footerText.length > 40 ? '...' : ''}</div>
                <div><strong>Footer Position:</strong> {footerPosition}</div>
              </>
            )}
            <div><strong>Font Size:</strong> {fontSize}px</div>
            <div><strong>Colors:</strong> Header: <span className="font-mono">{headerColor}</span>, Footer: <span className="font-mono">{footerColor}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

