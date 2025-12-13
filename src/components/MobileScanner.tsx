import React, { useState, useRef, useEffect } from 'react';

interface MobileScannerProps {
  onImageCapture?: (file: File) => void;
  onFileSelected?: (file: File) => void; // Single file handler
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onImageCapture, onFileSelected }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isSecure = window.isSecureContext;
      setBrowserSupported(hasMediaDevices && isSecure);
    };
    checkSupport();
  }, []);

  const startCamera = async () => {
    console.log('startCamera called');
    try {
      setError('');
      setIsScanning(false);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        setHasPermission(false);
        setError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.error('Not a secure context');
        setHasPermission(false);
        setError('Camera access requires a secure connection (HTTPS). Please access this site via HTTPS or use localhost.');
        return;
      }

      console.log('Requesting camera access...');

      // Request camera access - prefer back camera on mobile
      const constraints = {
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Set scanning state first so video element renders
      setIsScanning(true);
      setHasPermission(true);
      
      // Wait for next render cycle to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready and play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Video play error:', err);
          });
        };
        
        // Also try to play immediately
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
        });
      } else {
        console.error('Video element not found after render');
        // Try again after a bit more time
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => {
              console.error('Video play error:', err);
            });
          } else {
            setHasPermission(false);
            setError('Video element not available. Please refresh the page and try again.');
          }
        }, 200);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a camera or use file upload instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps using the camera and try again.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        // Try with simpler constraints
        try {
          const simpleConstraints = { video: true };
          const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                  videoRef.current?.play();
                  resolve(true);
                };
              }
            });
            setIsScanning(true);
            setHasPermission(true);
            return;
          }
        } catch (retryErr: any) {
          setError('Failed to access camera. Please check your camera permissions and try again.');
        }
      } else {
        setError(`Failed to access camera: ${err.message || 'Unknown error'}. Please try again or use file upload.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scanned-${Date.now()}.jpg`, { type: 'image/jpeg' });
        // Call both callbacks if provided
        if (onImageCapture) {
          onImageCapture(file);
        }
        if (onFileSelected) {
          onFileSelected(file);
        }
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full">
      {browserSupported === false && (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-4">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            ⚠️ Camera access requires HTTPS or localhost. Please access this site via HTTPS or use file upload instead.
          </p>
        </div>
      )}

      {!isScanning && hasPermission === null && (
        <div className="text-center space-y-4">
          <div className="p-6 rounded-xl bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-300 dark:border-primary-700">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Scan Document with Camera
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use your device camera to scan documents and convert them to PDF
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked');
                startCamera();
              }}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              📷 Open Camera
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Note: Camera access requires permission. Make sure you're using HTTPS or localhost.
            </p>
            {browserSupported === false && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ Your browser may not support camera access. Try using Chrome, Firefox, or Safari.
              </p>
            )}
          </div>
        </div>
      )}

      {hasPermission === false && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setHasPermission(null);
                setError('');
                startCamera();
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary-500 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-[60vh] object-contain"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.error('Video play error:', err);
                  });
                }
              }}
            />
            <div className="absolute inset-0 pointer-events-none">
              {/* Document frame guide */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg"></div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={captureImage}
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors shadow-lg"
            >
              📸 Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-8 py-4 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Position your document within the frame and tap Capture
          </p>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

