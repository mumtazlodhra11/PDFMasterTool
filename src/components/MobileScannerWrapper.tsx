import React from 'react';
import { MobileScanner } from './MobileScanner';

interface MobileScannerWrapperProps {
  onFileSelected?: (file: File) => void;
}

export const MobileScannerWrapper: React.FC<MobileScannerWrapperProps> = ({ onFileSelected }) => {
  const handleImageCapture = (file: File) => {
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  return <MobileScanner onImageCapture={handleImageCapture} />;
};












