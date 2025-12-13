import React, { useState, useEffect, useRef } from 'react';
import { stopSpeech, pauseSpeech, resumeSpeech } from '../utils/voiceUtils';

interface VoiceReaderOptionsProps {
  extractedText?: string;
  onOptionsChange: (options: {
    language: string;
    rate: number;
    pitch: number;
    volume: number;
    voiceName?: string;
  }) => void;
}

export const VoiceReaderOptions: React.FC<VoiceReaderOptionsProps> = ({ 
  extractedText,
  onOptionsChange 
}) => {
  const [language, setLanguage] = useState('en-US');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [voiceName, setVoiceName] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Set default voice for selected language
        if (voices.length > 0 && !voiceName) {
          const defaultVoice = voices.find((v) => v.lang.startsWith(language.split('-')[0])) || voices[0];
          if (defaultVoice) {
            setVoiceName(defaultVoice.name);
          }
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      stopSpeech();
    };
  }, [language, voiceName]);

  useEffect(() => {
    onOptionsChange({
      language,
      rate,
      pitch,
      volume,
      voiceName: voiceName || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, rate, pitch, volume, voiceName]); // Removed onOptionsChange from deps to prevent infinite loop

  const handlePlay = () => {
    if (!extractedText || extractedText.trim() === '') {
      alert('No text available to read. Please process the PDF first.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support text-to-speech. Please use Chrome, Edge, Safari, or Firefox.');
      return;
    }

    // Stop any current speech
    stopSpeech();

    // Get voices
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (voiceName) {
      selectedVoice = voices.find((v) => v.name === voiceName);
    } else {
      selectedVoice = voices.find((v) => v.lang.startsWith(language.split('-')[0]));
    }

    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }

    // Split text into chunks
    const maxChunkLength = 200;
    const sentences = extractedText.match(/[^.!?]+[.!?]+/g) || [extractedText];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    let currentChunkIndex = 0;
    const totalChunks = chunks.length;

    const speakNextChunk = () => {
      if (currentChunkIndex >= totalChunks) {
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      const chunk = chunks[currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunk);

      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        currentChunkIndex++;
        speakNextChunk();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Wait for voices if needed
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        if (updatedVoices.length > 0) {
          if (voiceName) {
            selectedVoice = updatedVoices.find((v) => v.name === voiceName);
          } else {
            selectedVoice = updatedVoices.find((v) => v.lang.startsWith(language.split('-')[0]));
          }
          if (!selectedVoice && updatedVoices.length > 0) {
            selectedVoice = updatedVoices[0];
          }
          setIsPlaying(true);
          setIsPaused(false);
          speakNextChunk();
        }
      };
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      speakNextChunk();
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  const handlePause = () => {
    if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
    } else {
      pauseSpeech();
      setIsPaused(true);
    }
  };

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'zh-CN', label: 'Chinese (Simplified)' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'ar-SA', label: 'Arabic' },
  ];

  // Filter voices by selected language
  const filteredVoices = availableVoices.filter((voice) =>
    voice.lang.startsWith(language.split('-')[0])
  );

  return (
    <div className="glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Voice Settings</h3>
        {extractedText && extractedText.trim() && (
          <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            Text Ready ({extractedText.length} characters)
          </span>
        )}
      </div>

      {(!extractedText || !extractedText.trim()) && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ No text available yet. Please click "Process" to extract text from the PDF first.
          </p>
        </div>
      )}

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setVoiceName(''); // Reset voice when language changes
          }}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isPlaying}
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Selection */}
      {filteredVoices.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice
          </label>
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isPlaying}
          >
            {filteredVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} {voice.default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Speed Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed: {rate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
          disabled={isPlaying}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Pitch Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pitch: {pitch.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
          disabled={isPlaying}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Low</span>
          <span>Normal</span>
          <span>High</span>
        </div>
      </div>

      {/* Volume Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Volume: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Playback Controls */}
      {extractedText && extractedText.trim() && (
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {!isPlaying && !isPaused && (
            <button
              onClick={handlePlay}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Start Reading
            </button>
          )}
          
          {isPlaying && (
            <>
              <button
                onClick={handlePause}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  {isPaused ? (
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  ) : (
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  )}
                </svg>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleStop}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
                </svg>
                Stop
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This tool uses your browser's built-in text-to-speech. After processing, click "Start Reading" to begin. Make sure your device volume is turned on.
        </p>
      </div>
    </div>
  );
};
