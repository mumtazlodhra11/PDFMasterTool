import React, { useState } from 'react';

interface WatermarkOptionsProps {
  file?: File;
  onOptionsChange: (options: {
    watermarkType: 'standard' | 'custom';
    standardWatermark?: string;
    customText?: string;
    customImage?: File;
    customPdf?: File;
    position: string;
    opacity: number;
    fontSize?: number;
    rotation: number;
    color?: string;
    fontFamily?: string;
  }) => void;
}

const STANDARD_WATERMARKS = [
  { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL' },
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'COPYRIGHT', label: '© COPYRIGHT' },
  { value: 'DO NOT COPY', label: 'DO NOT COPY' },
  { value: 'TOP SECRET', label: 'TOP SECRET' },
  { value: 'FOR INTERNAL USE ONLY', label: 'FOR INTERNAL USE ONLY' },
  { value: 'SAMPLE', label: 'SAMPLE' },
  { value: 'VOID', label: 'VOID' },
];

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'diagonal', label: 'Diagonal (Center)' },
];

const FONT_FAMILIES = [
  { value: 'Helvetica-Bold', label: 'Helvetica Bold' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times-Roman', label: 'Times Roman' },
  { value: 'Courier', label: 'Courier' },
];

export const WatermarkOptions: React.FC<WatermarkOptionsProps> = ({ onOptionsChange }) => {
  const [watermarkType, setWatermarkType] = useState<'standard' | 'custom'>('standard');
  const [standardWatermark, setStandardWatermark] = useState<string>('CONFIDENTIAL');
  const [customText, setCustomText] = useState<string>('');
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customPdf, setCustomPdf] = useState<File | null>(null);
  const [position, setPosition] = useState<string>('diagonal');
  const [opacity, setOpacity] = useState<number>(30);
  const [fontSize, setFontSize] = useState<number>(48);
  const [rotation, setRotation] = useState<number>(-45);
  const [color, setColor] = useState<string>('#808080');
  const [fontFamily, setFontFamily] = useState<string>('Helvetica-Bold');

  const handleChange = () => {
    const options = {
      watermarkType,
      standardWatermark: watermarkType === 'standard' ? standardWatermark : undefined,
      customText: watermarkType === 'custom' ? (customText || '') : undefined,
      customImage: watermarkType === 'custom' && customImage ? customImage : undefined,
      customPdf: watermarkType === 'custom' && customPdf ? customPdf : undefined,
      position,
      opacity: opacity / 100,
      fontSize,
      rotation,
      color: color || '#808080', // Ensure color is always set
      fontFamily,
    };
    console.log('[WatermarkOptions] Sending options:', options);
    onOptionsChange(options);
  };

  React.useEffect(() => {
    handleChange();
  }, [watermarkType, standardWatermark, customText, customImage, customPdf, position, opacity, fontSize, rotation, color, fontFamily]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      setCustomImage(file);
      setCustomPdf(null); // Clear PDF if image is selected
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF file
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a PDF file');
        return;
      }
      setCustomPdf(file);
      setCustomImage(null); // Clear image if PDF is selected
    }
  };

  return (
    <div className="space-y-6 glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Watermark Options</h3>

      {/* Watermark Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Watermark Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="watermarkType"
              value="standard"
              checked={watermarkType === 'standard'}
              onChange={(e) => setWatermarkType(e.target.value as 'standard' | 'custom')}
              className="mr-2"
            />
            <span className="text-gray-700 dark:text-gray-300">Standard</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="watermarkType"
              value="custom"
              checked={watermarkType === 'custom'}
              onChange={(e) => setWatermarkType(e.target.value as 'standard' | 'custom')}
              className="mr-2"
            />
            <span className="text-gray-700 dark:text-gray-300">Custom</span>
          </label>
        </div>
      </div>

      {/* Standard Watermark Selection */}
      {watermarkType === 'standard' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Select Standard Watermark
          </label>
          <select
            value={standardWatermark}
            onChange={(e) => setStandardWatermark(e.target.value)}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {STANDARD_WATERMARKS.map((wm) => (
              <option key={wm.value} value={wm.value}>
                {wm.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Watermark Options */}
      {watermarkType === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Custom Text Watermark
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter custom watermark text"
              className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                OR Upload Image Watermark
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="watermark-image-upload"
                />
                <label
                  htmlFor="watermark-image-upload"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
                >
                  Choose Image
                </label>
                {customImage && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {customImage.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supported formats: JPG, PNG, GIF
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                OR Upload PDF Watermark
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                  id="watermark-pdf-upload"
                />
                <label
                  htmlFor="watermark-pdf-upload"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
                >
                  Choose PDF
                </label>
                {customPdf && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {customPdf.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                First page of PDF will be used as watermark
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Position Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Position
        </label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {POSITION_OPTIONS.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      {/* Opacity Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Opacity: {opacity}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${opacity}%, #e5e7eb ${opacity}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>10%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Font Size (for text watermarks) */}
      {(watermarkType === 'standard' || (watermarkType === 'custom' && !customImage)) && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Font Size: {fontSize}pt
            </label>
            <input
              type="range"
              min="12"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>12pt</span>
              <span>120pt</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Text Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-4 py-2 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="#808080"
              />
            </div>
          </div>
        </>
      )}

      {/* Rotation */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Rotation: {rotation}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>-180°</span>
          <span>0°</span>
          <span>180°</span>
        </div>
      </div>
    </div>
  );
};

