import React from 'react';
import { motion } from 'framer-motion';

interface ToolCardProps {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  category: string;
  aiEnhanced?: boolean;
  delay?: number;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  id,
  name,
  icon,
  description,
  features,
  category,
  aiEnhanced = false,
  delay = 0,
}) => {
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'convert-to-pdf': 'from-blue-500 to-blue-600',
      'convert-from-pdf': 'from-purple-500 to-purple-600',
      'organize': 'from-green-500 to-green-600',
      'secure': 'from-orange-500 to-orange-600',
      'optimize': 'from-pink-500 to-pink-600',
      'edit': 'from-indigo-500 to-indigo-600',
      'esign': 'from-teal-500 to-teal-600',
      'ai-tools': 'from-primary-500 to-primary-600',
    };
    return colors[cat] || 'from-gray-500 to-gray-600';
  };

  return (
    <motion.a
      href={`/tools/${id}`}
      className="block group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8 }}
    >
      <div className="relative h-full glass hover:glass-hover rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 group-hover:shadow-2xl">
        {/* Gradient Border Top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryColor(category)}`} />

        {/* AI Badge */}
        {aiEnhanced && (
          <motion.div
            className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full flex items-center space-x-1 shadow-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.3, type: 'spring' }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <span>AI</span>
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {name}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.slice(0, 3).map((feature, index) => (
            <motion.li
              key={index}
              className="flex items-center text-xs text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 * index }}
            >
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.div
          className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
          whileHover={{ x: 5 }}
        >
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            Use Tool
          </span>
          <svg
            className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:translate-x-2 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.div>

        {/* Hover Effect Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-600/0 group-hover:from-primary-500/5 group-hover:to-primary-600/5 transition-all duration-300 rounded-2xl pointer-events-none" />
      </div>
    </motion.a>
  );
};

export default ToolCard;














