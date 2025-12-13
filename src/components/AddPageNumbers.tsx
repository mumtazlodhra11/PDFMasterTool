import React, { useState } from 'react';

interface AddPageNumbersProps {
  onOptionsChange: (options: {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    format: 'simple' | 'page-of-total' | 'roman' | 'custom';
    startNumber: number;
    fontSize: number;
    customFormat?: string;
    color?: string;
  }) => void;
}

export const AddPageNumbers: React.FC<AddPageNumbersProps> = ({ onOptionsChange }) => {
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [format, setFormat] = useState<'simple' | 'page-of-total' | 'roman' | 'custom'>('simple');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(12);
  const [customFormat, setCustomFormat] = useState<string>('Page {n}');
  const [color, setColor] = useState<string>('#000000');

  React.useEffect(() => {
    onOptionsChange({
      position,
      format,
      startNumber,
      fontSize,
      customFormat: format === 'custom' ? customFormat : undefined,
      color,
    });
  }, [position, format, startNumber, fontSize, customFormat, color, onOptionsChange]);

  const formatExamples: Record<string, string> = {
    simple: '1, 2, 3, 4...',
    'page-of-total': 'Page 1 of 10, Page 2 of 10...',
    roman: 'i, ii, iii, iv...',
    custom: customFormat || 'Page {n}',
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'top-left', label: 'Top Left' },
              { value: 'top-center', label: 'Top Center' },
              { value: 'top-right', label: 'Top Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
              { value: 'bottom-center', label: 'Bottom Center' },
              { value: 'bottom-right', label: 'Bottom Right' },
            ].map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => setPosition(pos.value as any)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  position === pos.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="simple">Simple (1, 2, 3...)</option>
            <option value="page-of-total">Page X of Y</option>
            <option value="roman">Roman Numerals (i, ii, iii...)</option>
            <option value="custom">Custom Format</option>
          </select>
          {format === 'custom' && (
            <input
              type="text"
              value={customFormat}
              onChange={(e) => setCustomFormat(e.target.value)}
              placeholder="e.g., Page {n} or - {n} -"
              className="mt-2 w-full px-4 py-2 glass border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Preview: {formatExamples[format].replace('{n}', '1')}
          </p>
        </div>

        {/* Start Number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Start Number
          </label>
          <input
            type="number"
            min="1"
            value={startNumber}
            onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Font Size
          </label>
          <input
            type="number"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Math.max(8, Math.min(72, parseInt(e.target.value) || 12)))}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Color */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Color
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Preview Box */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          First page: <span className="font-mono" style={{ color }}>{formatExamples[format].replace('{n}', String(startNumber))}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Second page: <span className="font-mono" style={{ color }}>{formatExamples[format].replace('{n}', String(startNumber + 1))}</span>
        </div>
      </div>
    </div>
  );
};


















