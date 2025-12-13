import React, { useState, useEffect } from 'react';
import { getPDFMetadata } from '@/utils/pdfUtils';

interface MetadataOptionsProps {
  file?: File;
  onOptionsChange: (options: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
  }) => void;
}

export const MetadataOptions: React.FC<MetadataOptionsProps> = ({ file, onOptionsChange }) => {
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [creator, setCreator] = useState<string>('');
  const [producer, setProducer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [existingMetadata, setExistingMetadata] = useState<any>(null);

  // Load existing metadata when file is selected
  useEffect(() => {
    if (!file) return;

    const loadMetadata = async () => {
      setLoading(true);
      try {
        const metadata = await getPDFMetadata(file);
        setExistingMetadata(metadata);
        setTitle(metadata.title || '');
        setAuthor(metadata.author || '');
        setSubject(metadata.subject || '');
        setKeywords(metadata.keywords || '');
        setCreator(metadata.creator || '');
        setProducer(metadata.producer || '');
      } catch (error) {
        console.error('Failed to load metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [file]);

  // Update parent component when values change
  useEffect(() => {
    onOptionsChange({
      title: title || undefined,
      author: author || undefined,
      subject: subject || undefined,
      keywords: keywords || undefined,
      creator: creator || undefined,
      producer: producer || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, author, subject, keywords, creator, producer]);

  const clearField = (field: string) => {
    switch (field) {
      case 'title':
        setTitle('');
        break;
      case 'author':
        setAuthor('');
        break;
      case 'subject':
        setSubject('');
        break;
      case 'keywords':
        setKeywords('');
        break;
      case 'creator':
        setCreator('');
        break;
      case 'producer':
        setProducer('');
        break;
    }
  };

  const clearAll = () => {
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setProducer('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">PDF Metadata</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and edit PDF document properties and metadata
          </p>
        </div>
      </div>

      {loading && (
        <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading metadata...</p>
          </div>
        </div>
      )}

      {/* Existing Metadata Info */}
      {existingMetadata && !loading && (
        <div className="glass p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Document Information
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                {existingMetadata.pageCount && (
                  <p>Pages: {existingMetadata.pageCount}</p>
                )}
                {existingMetadata.creationDate && (
                  <p>Created: {new Date(existingMetadata.creationDate).toLocaleString()}</p>
                )}
                {existingMetadata.modificationDate && (
                  <p>Modified: {new Date(existingMetadata.modificationDate).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      <div className="glass p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Title
              </label>
              {title && (
                <button
                  type="button"
                  onClick={() => clearField('title')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Author */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Author
              </label>
              {author && (
                <button
                  type="button"
                  onClick={() => clearField('author')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Subject
              </label>
              {subject && (
                <button
                  type="button"
                  onClick={() => clearField('subject')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter document subject"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Keywords
              </label>
              {keywords && (
                <button
                  type="button"
                  onClick={() => clearField('keywords')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords (comma-separated)"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple keywords with commas
            </p>
          </div>

          {/* Creator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Creator
              </label>
              {creator && (
                <button
                  type="button"
                  onClick={() => clearField('creator')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="Enter creator/application name"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Name of the application that created the document
            </p>
          </div>

          {/* Producer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Producer
              </label>
              {producer && (
                <button
                  type="button"
                  onClick={() => clearField('producer')}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              placeholder="Enter producer/converter name"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Name of the application that converted the document to PDF
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            Clear All Fields
          </button>
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
              About PDF Metadata
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Metadata helps organize and identify your PDF documents. All fields are optional. 
              The modification date will be automatically updated when you save the PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
