import React, { useState, useEffect } from 'react';

interface CompressPDFOptionsProps {
  onOptionsChange: (options: {
    compressionLevel: 'low' | 'medium' | 'high' | 'extreme' | 'smart';
    preserveQuality: boolean;
    imageQuality?: number;
  }) => void;
  file?: File | null;
}

export const CompressPDFOptions: React.FC<CompressPDFOptionsProps> = ({ 
  onOptionsChange,
  file 
}) => {
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high' | 'extreme' | 'smart'>('smart');
  const [preserveQuality, setPreserveQuality] = useState<boolean>(true);
  const [aiRecommendation, setAiRecommendation] = useState<{
    recommendedQuality: number;
    estimatedSize: string;
    suggestions: string[];
  } | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState<boolean>(false);

  useEffect(() => {
    // Update parent component whenever options change
    onOptionsChange({
      compressionLevel,
      preserveQuality,
      imageQuality: aiRecommendation?.recommendedQuality,
    });
  }, [compressionLevel, preserveQuality, aiRecommendation, onOptionsChange]);

  useEffect(() => {
    // Get AI recommendation when file is selected and smart mode is enabled
    if (file && compressionLevel === 'smart') {
      getAIRecommendation();
    } else {
      setAiRecommendation(null);
    }
  }, [file, compressionLevel]);

  const getAIRecommendation = async () => {
    if (!file) return;

    setLoadingRecommendation(true);
    try {
      // Analyze file to get basic info
      const fileSize = file.size;
      
      // Load PDF to get page count
      const arrayBuffer = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      // Estimate if PDF has images (heuristic: large files likely have images)
      const hasImages = fileSize > pageCount * 100000;

      // Get AI recommendation
      const { getSmartCompressionAdvice } = await import('@/utils/aiUtils');
      const advice = await getSmartCompressionAdvice(fileSize, pageCount, hasImages);
      setAiRecommendation(advice);
    } catch (error) {
      console.error('Failed to get AI recommendation:', error);
      // Fallback to default - better quality
      setAiRecommendation({
        recommendedQuality: 88,
        estimatedSize: 'Unknown',
        suggestions: ['Using default compression settings with high quality'],
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const getCompressionDescription = () => {
    switch (compressionLevel) {
      case 'low':
        return 'Best for documents with important images or graphics. Minimal size reduction, maximum quality.';
      case 'medium':
        return 'Balanced option for most documents. Good quality with reasonable size reduction.';
      case 'high':
        return 'Suitable for text-heavy documents. Significant size reduction with acceptable quality.';
      case 'extreme':
        return 'Maximum size reduction. May noticeably affect image quality.';
      case 'smart':
        return 'AI analyzes your PDF and automatically selects optimal compression settings.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Compression Level
        </label>
        <select
          value={compressionLevel}
          onChange={(e) => setCompressionLevel(e.target.value as any)}
          className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="smart">🤖 Smart (AI-Powered) - Recommended</option>
          <option value="low">Low Compression (High Quality)</option>
          <option value="medium">Medium Compression (Balanced)</option>
          <option value="high">High Compression (Smaller Size)</option>
          <option value="extreme">Extreme Compression (Maximum)</option>
        </select>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {getCompressionDescription()}
        </p>
      </div>

      {/* AI Recommendations */}
      {compressionLevel === 'smart' && (
        <div className="glass p-6 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10">
          {loadingRecommendation ? (
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-800 dark:text-blue-200">AI analyzing your PDF...</span>
            </div>
          ) : aiRecommendation ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">AI Recommendation</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    Recommended quality: <strong>{aiRecommendation.recommendedQuality}%</strong>
                    {aiRecommendation.estimatedSize !== 'Unknown' && (
                      <> • Estimated size: <strong>{aiRecommendation.estimatedSize}</strong></>
                    )}
                  </p>
                </div>
              </div>
              {aiRecommendation.suggestions && aiRecommendation.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {aiRecommendation.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-xs text-blue-700 dark:text-blue-300">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Upload a PDF file to get AI-powered compression recommendations.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="preserve-quality"
          checked={preserveQuality}
          onChange={(e) => setPreserveQuality(e.target.checked)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="preserve-quality" className="text-sm text-gray-700 dark:text-gray-300">
          Preserve image quality (recommended)
        </label>
      </div>

      {/* Compression Level Info */}
      {compressionLevel !== 'smart' && (
        <div className="glass p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Quality:</span>
              <span className="font-medium">
                {compressionLevel === 'low' && '92%'}
                {compressionLevel === 'medium' && '88%'}
                {compressionLevel === 'high' && '80%'}
                {compressionLevel === 'extreme' && '70%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Size Reduction:</span>
              <span className="font-medium">
                {compressionLevel === 'low' && '10-20%'}
                {compressionLevel === 'medium' && '30-50%'}
                {compressionLevel === 'high' && '50-70%'}
                {compressionLevel === 'extreme' && '70-90%'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

