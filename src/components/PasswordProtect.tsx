import React, { useState, useEffect } from 'react';

interface PasswordProtectProps {
  onOptionsChange: (options: {
    userPassword: string;
    ownerPassword?: string;
    encryptionLevel?: 'aes256' | 'aes128' | 'rc4';
    permissions?: {
      allowPrinting?: boolean;
      allowCopying?: boolean;
      allowEditing?: boolean;
    };
  }) => void;
}

export const PasswordProtect: React.FC<PasswordProtectProps> = ({ onOptionsChange }) => {
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [encryptionLevel, setEncryptionLevel] = useState<'aes256' | 'aes128' | 'rc4'>('aes256');
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(true);
  const [allowEditing, setAllowEditing] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  useEffect(() => {
    // Calculate password strength
    if (userPassword.length === 0) {
      setPasswordStrength('weak');
    } else if (userPassword.length < 8) {
      setPasswordStrength('weak');
    } else if (userPassword.length < 12) {
      setPasswordStrength('medium');
    } else {
      const hasUpper = /[A-Z]/.test(userPassword);
      const hasLower = /[a-z]/.test(userPassword);
      const hasNumber = /[0-9]/.test(userPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(userPassword);
      const complexity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
      setPasswordStrength(complexity >= 3 ? 'strong' : complexity >= 2 ? 'medium' : 'weak');
    }

    // Update options
    onOptionsChange({
      userPassword,
      ownerPassword: ownerPassword || undefined,
      encryptionLevel,
      permissions: {
        allowPrinting,
        allowCopying,
        allowEditing,
      },
    });
  }, [userPassword, ownerPassword, encryptionLevel, allowPrinting, allowCopying, allowEditing, onOptionsChange]);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Password */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            User Password (Required) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Enter password to open PDF"
              className="w-full px-4 py-3 pr-10 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {userPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                <span className={`text-xs font-medium ${
                  passwordStrength === 'weak' ? 'text-red-600' :
                  passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                  style={{
                    width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                  }}
                />
              </div>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Users will need this password to open the PDF
          </p>
        </div>

        {/* Owner Password */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Owner Password (Optional)
          </label>
          <div className="relative">
            <input
              type={showOwnerPassword ? 'text' : 'password'}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Password for permissions control"
              className="w-full px-4 py-3 pr-10 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowOwnerPassword(!showOwnerPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showOwnerPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Controls who can modify PDF permissions (defaults to user password if empty)
          </p>
        </div>

        {/* Encryption Level */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Encryption Level
          </label>
          <select
            value={encryptionLevel}
            onChange={(e) => setEncryptionLevel(e.target.value as any)}
            className="w-full px-4 py-3 glass border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="aes256">AES-256 (Strongest - Recommended)</option>
            <option value="aes128">AES-128 (Standard)</option>
            <option value="rc4">RC4 (Legacy compatibility)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            AES-256 is the strongest encryption standard
          </p>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Permissions
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow-printing"
                checked={allowPrinting}
                onChange={(e) => setAllowPrinting(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="allow-printing" className="text-sm text-gray-700 dark:text-gray-300">
                Allow printing
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow-copying"
                checked={allowCopying}
                onChange={(e) => setAllowCopying(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="allow-copying" className="text-sm text-gray-700 dark:text-gray-300">
                Allow copying text
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow-editing"
                checked={allowEditing}
                onChange={(e) => setAllowEditing(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="allow-editing" className="text-sm text-gray-700 dark:text-gray-300">
                Allow editing
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Password Requirements */}
      {userPassword && passwordStrength !== 'strong' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Password Tips:</p>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Use at least 12 characters for strong security</li>
            <li>• Mix uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid common words or personal information</li>
          </ul>
        </div>
      )}
    </div>
  );
};


















