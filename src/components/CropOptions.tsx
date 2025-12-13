import React, { useState, useCallback } from 'react';

interface CropOptionsProps {
  onOptionsChange: (options: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'points' | 'inches' | 'mm' | 'cm';
    applyToAllPages: boolean;
  }) => void;
}

export const CropOptions: React.FC<CropOptionsProps> = ({ onOptionsChange }) => {
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [unit, setUnit] = useState<'points' | 'inches' | 'mm' | 'cm'>('points');
  const [applyToAllPages, setApplyToAllPages] = useState(true);

  const updateOptions = useCallback(() => {
    const cropOptions = {
      top,
      right,
      bottom,
      left,
      unit,
      applyToAllPages,
    };
    console.log('[CropOptions] Updating options:', cropOptions);
    onOptionsChange(cropOptions);
  }, [top, right, bottom, left, unit, applyToAllPages, onOptionsChange]);

  React.useEffect(() => {
    updateOptions();
  }, [updateOptions]);

  return (
    <div className="glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Crop Settings</h3>
      
      <div className="space-y-4">
        {/* Unit Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'points' | 'inches' | 'mm' | 'cm')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="points">Points (pt)</option>
            <option value="inches">Inches (in)</option>
            <option value="mm">Millimeters (mm)</option>
            <option value="cm">Centimeters (cm)</option>
          </select>
        </div>

        {/* Crop Margins */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={top}
              onChange={(e) => setTop(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Right Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={right}
              onChange={(e) => setRight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bottom Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={bottom}
              onChange={(e) => setBottom(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Left Margin
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={left}
              onChange={(e) => setLeft(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setTop(10);
                setRight(10);
                setBottom(10);
                setLeft(10);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              10pt All Sides
            </button>
            <button
              onClick={() => {
                setTop(20);
                setRight(20);
                setBottom(20);
                setLeft(20);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              20pt All Sides
            </button>
            <button
              onClick={() => {
                setTop(0);
                setRight(0);
                setBottom(0);
                setLeft(0);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Apply to All Pages */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="applyToAllPages"
            checked={applyToAllPages}
            onChange={(e) => setApplyToAllPages(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="applyToAllPages" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Apply to all pages
          </label>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Note:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Values are in {unit} (1 inch = 72 points, 1 cm = 28.35 points, 1 mm = 2.835 points)</li>
            <li>Positive values will crop (remove) that margin from the page</li>
            <li>Make sure crop dimensions don't exceed page size</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

