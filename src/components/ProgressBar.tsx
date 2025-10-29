import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  fileName?: string;
  message?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  fileName,
  message,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-primary-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    if (message) return message;
    
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed!';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  return (
    <motion.div
      className="w-full p-6 glass rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${getStatusColor()} text-white p-2 rounded-lg`}>
            {getStatusIcon()}
          </div>
          <div>
            {fileName && (
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                {fileName}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusText()}</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute top-0 left-0 h-full ${getStatusColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        
        {/* Animated shimmer effect */}
        {status === 'processing' && progress < 100 && (
          <motion.div
            className="absolute top-0 left-0 h-full w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
        )}
      </div>

      {/* ETA */}
      {status === 'processing' && progress < 100 && (
        <motion.p
          className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Estimated time: {Math.ceil((100 - progress) / 10)} seconds
        </motion.p>
      )}
    </motion.div>
  );
};

export default ProgressBar;














