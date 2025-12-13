import React, { useRef, useState, useCallback, useEffect } from 'react';

interface SignaturePadProps {
  onSignatureChange: (signatureFile: File | null) => void;
  onPositionChange?: (x: number, y: number, page: number, width?: number, height?: number) => void;
  pdfFile?: File | null;
}

type SignaturePlacement = {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  x: number;
  y: number;
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  onPositionChange,
  pdfFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [pdfPagePreviews, setPdfPagePreviews] = useState<Array<{ pageNum: number; dataUrl: string; width: number; height: number }>>([]);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  // Store signature positions per page so they don't disappear when switching pages
  const [signaturesPerPage, setSignaturesPerPage] = useState<Map<number, SignaturePlacement>>(new Map());
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [isClickDisabled, setIsClickDisabled] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const pdfDocRef = useRef<any>(null); // Store PDF document for page navigation
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewportRef = useRef<any>(null); // Store viewport for coordinate conversion
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePreviewRef = useRef<HTMLImageElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragActivePageRef = useRef<number | null>(null);
  const dragSourceSigRef = useRef<{ nw: number; nh: number } | null>(null);
  const pendingSignatureRef = useRef<{ pageNum: number; data: SignaturePlacement } | null>(null);

  // Helper function to get scroll offset from scroll container
  const getScrollOffset = useCallback((element: HTMLElement | null): { scrollTop: number; scrollLeft: number } => {
    if (!element) return { scrollTop: 0, scrollLeft: 0 };
    
    // Try to find the scroll container (parent with overflow-auto)
    let scrollContainer: HTMLElement | null = element;
    while (scrollContainer && scrollContainer !== document.body) {
      const style = window.getComputedStyle(scrollContainer);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
        return {
          scrollTop: scrollContainer.scrollTop,
          scrollLeft: scrollContainer.scrollLeft
        };
      }
      scrollContainer = scrollContainer.parentElement;
    }
    
    // Fallback: use the stored ref if available
    if (scrollContainerRef.current) {
      return {
        scrollTop: scrollContainerRef.current.scrollTop,
        scrollLeft: scrollContainerRef.current.scrollLeft
      };
    }
    
    return { scrollTop: 0, scrollLeft: 0 };
  }, []);

  // Helper to compute default normalized signature size relative to a preview
  const getDefaultNormalizedSize = useCallback((previewWidth: number, previewHeight: number) => {
    const sigImg = signaturePreviewRef.current;
    if (sigImg && previewWidth > 0 && previewHeight > 0) {
      const widthRatio = Math.min(sigImg.width / previewWidth, 0.3);
      const heightRatio = Math.min(sigImg.height / previewHeight, 0.3);
      return {
        nw: widthRatio || 0.2,
        nh: heightRatio || 0.1,
      };
    }
    return { nw: 0.2, nh: 0.1 };
  }, []);

  const rememberSignatureForPage = useCallback(
    (pageNum: number, data: SignaturePlacement, options?: { trackPending?: boolean }) => {
      setSignaturesPerPage((prev) => {
        const newMap = new Map(prev);
        newMap.set(pageNum, data);
        return newMap;
      });
      if (options?.trackPending !== false) {
        pendingSignatureRef.current = { pageNum, data };
      }
    },
    []
  );
  
  // Auto-scroll when dragging near edges
  const autoScrollRef = useRef<number | null>(null);
  const handleAutoScroll = useCallback((e: React.MouseEvent | React.TouchEvent, container: HTMLElement) => {
    if (!isDraggingSignature || !container) return;

    const containerRect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    const edgeThreshold = 50; // pixels from edge to trigger scroll
    const scrollSpeed = 10; // pixels to scroll per frame
    
    let scrollX = 0;
    let scrollY = 0;
    
    // Check if near edges
    if (clientX - containerRect.left < edgeThreshold) {
      scrollX = -scrollSpeed; // Scroll left
    } else if (containerRect.right - clientX < edgeThreshold) {
      scrollX = scrollSpeed; // Scroll right
    }
    
    if (clientY - containerRect.top < edgeThreshold) {
      scrollY = -scrollSpeed; // Scroll up
    } else if (containerRect.bottom - clientY < edgeThreshold) {
      scrollY = scrollSpeed; // Scroll down
    }
    
    // Apply scroll if needed
    if (scrollX !== 0 || scrollY !== 0) {
      container.scrollLeft += scrollX;
      container.scrollTop += scrollY;
      
      // Continue auto-scrolling
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
      autoScrollRef.current = requestAnimationFrame(() => {
        // This will be handled by the next mouse move event
      });
    } else {
      // Stop auto-scrolling
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  }, [isDraggingSignature]);

  const fonts = [
    'Dancing Script',
    'Great Vibes',
    'Allura',
    'Pacifico',
    'Satisfy',
    'Kalam',
    'Caveat',
    'Permanent Marker',
  ];

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
    setTypedText('');
    onSignatureChange(null);
  }, [onSignatureChange]);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (signatureMode !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to match canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = (e as React.MouseEvent).clientX 
      ? (e as React.MouseEvent).clientX
      : (e as React.TouchEvent).touches[0].clientX;
    const clientY = (e as React.MouseEvent).clientY
      ? (e as React.MouseEvent).clientY
      : (e as React.TouchEvent).touches[0].clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Set drawing properties before starting
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = signatureColor;
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [signatureMode, brushSize, signatureColor]);

  // Draw
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to match canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = (e as React.MouseEvent).clientX 
      ? (e as React.MouseEvent).clientX
      : (e as React.TouchEvent).touches[0].clientX;
    const clientY = (e as React.MouseEvent).clientY
      ? (e as React.MouseEvent).clientY
      : (e as React.TouchEvent).touches[0].clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Better brush for signature - smooth drawing
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = signatureColor;
    ctx.globalCompositeOperation = 'source-over';
    
    // Smooth line drawing
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isDrawing, signatureMode, signatureColor, brushSize]);

  // Save signature as image
  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has any content (for draw mode)
    if (signatureMode === 'draw') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((channel, index) => {
        if (index % 4 === 3) return channel > 0; // Check alpha channel
        return false;
      });
      if (!hasContent) return; // Don't save empty canvas
    }

    // Export canvas with transparent background - high quality to preserve signature crispness
    canvas.toBlob((blob) => {
      if (blob) {
        // Process the image to remove any white background
        const img = new Image();
        img.onload = () => {
          // Create a new canvas to process the image
          const processCanvas = document.createElement('canvas');
          processCanvas.width = img.width;
          processCanvas.height = img.height;
          const processCtx = processCanvas.getContext('2d');
          if (!processCtx) return;
          
          // Draw image
          processCtx.drawImage(img, 0, 0);
          
          // Get image data and remove white background + crop to signature bounds
          const imageData = processCtx.getImageData(0, 0, processCanvas.width, processCanvas.height);
          const data = imageData.data;
          
          // Remove white/light background pixels while preserving signature strokes
          // Balance: Remove background "pad" but keep signature crisp (not blurred/faded)
          // Match backend logic: Only remove very white pixels, preserve signature strokes
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            // Only remove pixels that are VERY white (threshold: 248) - removes background box
            // But preserves signature strokes which may have slight variations
            if (r > 248 && g > 248 && b > 248) {
              data[i + 3] = 0; // Set alpha to 0 (fully transparent)
            }
            // Also remove near-white pixels (threshold: 245) but be more careful
            else if (r > 245 && g > 245 && b > 245) {
              // Only make transparent if alpha is already low (likely background)
              // This preserves signature strokes that might be light but still visible
              if (a < 200) {  // Only if already semi-transparent
                data[i + 3] = 0;
              }
              // Otherwise keep it - might be part of signature
            }
          }
          
          // Put the modified image data back
          processCtx.putImageData(imageData, 0, 0);
          
          // Find bounding box of non-transparent pixels (actual signature)
          let minX = processCanvas.width;
          let minY = processCanvas.height;
          let maxX = 0;
          let maxY = 0;
          let hasContent = false;
          
          for (let y = 0; y < processCanvas.height; y++) {
            for (let x = 0; x < processCanvas.width; x++) {
              const idx = (y * processCanvas.width + x) * 4;
              const alpha = data[idx + 3];
              if (alpha > 0) {
                hasContent = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          
          // Crop to signature bounds (add small padding: 5px) to remove extra whitespace/box
          if (hasContent) {
            const padding = 5;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(processCanvas.width, maxX + padding);
            maxY = Math.min(processCanvas.height, maxY + padding);
            
            const croppedWidth = maxX - minX;
            const croppedHeight = maxY - minY;
            
            // Create cropped canvas with only the signature (no extra whitespace/box)
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;
            const croppedCtx = croppedCanvas.getContext('2d');
            if (croppedCtx) {
              // Copy only the signature area (no white background box)
              croppedCtx.drawImage(
                processCanvas,
                minX, minY, croppedWidth, croppedHeight,
                0, 0, croppedWidth, croppedHeight
              );
              
              // Replace processCanvas with cropped version
              processCanvas.width = croppedWidth;
              processCanvas.height = croppedHeight;
              processCtx.clearRect(0, 0, croppedWidth, croppedHeight);
              processCtx.drawImage(croppedCanvas, 0, 0);
            }
          }
          
          // Convert to blob with transparency - use high quality PNG (no compression)
          // This preserves signature quality and prevents blur/pixelation
          processCanvas.toBlob((processedBlob) => {
            if (processedBlob) {
              const file = new File([processedBlob], 'signature.png', { type: 'image/png' });
              onSignatureChange(file);
              
              // Create preview image
              const previewImg = new Image();
              previewImg.onload = () => {
                signaturePreviewRef.current = previewImg;
              };
              previewImg.src = URL.createObjectURL(processedBlob);
            }
          }, 'image/png', 1.0); // Quality 1.0 = no compression, maximum quality
        };
        img.src = URL.createObjectURL(blob);
      }
    }, 'image/png');
  }, [onSignatureChange, signatureMode]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Small delay to ensure drawing is complete
    setTimeout(() => {
      saveSignature();
    }, 100);
  }, [isDrawing, saveSignature]);

  // Handle typed signature
  useEffect(() => {
    if (signatureMode === 'type' && typedText) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Use higher font size for better quality on high-res canvas (1000x400)
      ctx.font = `96px "${selectedFont}", cursive`;
      ctx.fillStyle = signatureColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
      
      // Create preview image for typed signature
      const img = new Image();
      img.onload = () => {
        signaturePreviewRef.current = img;
      };
      img.src = canvas.toDataURL('image/png');
      
      saveSignature();
    }
  }, [typedText, selectedFont, signatureMode, signatureColor, saveSignature]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        setUploadedImage(event.target?.result as string);
        saveSignature();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [saveSignature]);

  // Initialize canvas - white background for drawing visibility, but will be removed when saving
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white for drawing visibility (user needs to see what they're drawing)
    // This white background will be removed when saving the signature
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Load PDF preview for positioning - render ALL pages
  useEffect(() => {
    if (pdfFile) {
      const loadPdfPreview = async () => {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          pdfDocRef.current = pdf; // Store PDF document for navigation
          
          // Update total pages
          setTotalPages(pdf.numPages);
          
          // Render ALL pages for preview
          const previews: Array<{ pageNum: number; dataUrl: string; width: number; height: number }> = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            // Create a temporary canvas for each page
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = viewport.width;
            tempCanvas.height = viewport.height;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) continue;
            
            await page.render({
              canvasContext: ctx,
              viewport: viewport,
            }).promise;
            
            const dataUrl = tempCanvas.toDataURL('image/png');
            previews.push({
              pageNum,
              dataUrl,
              width: viewport.width,
              height: viewport.height,
            });
          }
          
          setPdfPagePreviews(previews);
          
          // Also set the current page preview for backward compatibility
          const currentPagePreview = previews.find(p => p.pageNum === pageNumber) || previews[0];
          if (currentPagePreview && pdfCanvasRef.current) {
            const canvas = pdfCanvasRef.current;
            canvas.width = currentPagePreview.width;
            canvas.height = currentPagePreview.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                const page = pdf.numPages >= pageNumber ? pageNumber : 1;
                pdf.getPage(page).then(p => {
                  const viewport = p.getViewport({ scale: 1.5 });
                  (canvas as any).pdfViewport = viewport;
                  (canvas as any).pdfPage = p;
                  viewportRef.current = viewport;
                });
              };
              img.src = currentPagePreview.dataUrl;
              setPdfPreview(currentPagePreview.dataUrl);
            }
          }
          
          console.log('[SignaturePad] All PDF pages rendered:', {
            totalPages: pdf.numPages,
            previewsCount: previews.length,
            previews: previews.map(p => ({ page: p.pageNum, hasDataUrl: !!p.dataUrl }))
          });
          
          if (previews.length === 0) {
            console.error('[SignaturePad] No page previews generated!');
          } else if (previews.length !== pdf.numPages) {
            console.warn('[SignaturePad] Mismatch: Expected', pdf.numPages, 'pages but got', previews.length, 'previews');
          }
        } catch (error) {
          console.error('[SignaturePad] Error loading PDF preview:', error);
          setPdfPagePreviews([]); // Clear previews on error
        }
      };
      
      loadPdfPreview();
    }
  }, [pdfFile]);
  
  // Update current page preview when pageNumber changes and restore signature position
  useEffect(() => {
    if (pdfPagePreviews.length > 0 && pdfCanvasRef.current) {
      const currentPagePreview = pdfPagePreviews.find(p => p.pageNum === pageNumber) || pdfPagePreviews[0];
      if (currentPagePreview) {
        const canvas = pdfCanvasRef.current;
        canvas.width = currentPagePreview.width;
        canvas.height = currentPagePreview.height;
        const ctx = canvas.getContext('2d');
        if (ctx && pdfDocRef.current) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            pdfDocRef.current?.getPage(pageNumber).then(page => {
              const viewport = page.getViewport({ scale: 1.5 });
              (canvas as any).pdfViewport = viewport;
              (canvas as any).pdfPage = page;
              viewportRef.current = viewport;
            });
          };
          img.src = currentPagePreview.dataUrl;
          setPdfPreview(currentPagePreview.dataUrl);
          
          // Restore signature position for this page if it exists or if we have a pending placement
          const savedSignature = signaturesPerPage.get(pageNumber);
          const pendingSignature =
            pendingSignatureRef.current && pendingSignatureRef.current.pageNum === pageNumber
              ? pendingSignatureRef.current.data
              : null;
          
          const signatureToApply = pendingSignature || savedSignature;
          
          if (signatureToApply && signatureToApply.x > 0 && signatureToApply.y > 0) {
            if (signaturePosition.x !== signatureToApply.x || signaturePosition.y !== signatureToApply.y) {
              setSignaturePosition({ x: signatureToApply.x, y: signatureToApply.y });
            }
            if (onPositionChange) {
              onPositionChange(
                signatureToApply.nx,
                signatureToApply.ny,
                pageNumber,
                signatureToApply.nw,
                signatureToApply.nh
              );
            }
            
            // Clear pending entry if we just used it
            if (pendingSignatureRef.current && pendingSignatureRef.current.pageNum === pageNumber) {
              pendingSignatureRef.current = null;
            }
          }
          // CRITICAL: Don't reset position to (0, 0) - this was causing signature to disappear
          // Signature position should only be reset explicitly by user action, not automatically
        }
      }
    }
  }, [pageNumber, pdfPagePreviews, signaturesPerPage, onPositionChange, signaturePosition.x, signaturePosition.y]);

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => {
            setSignatureMode('draw');
            clearCanvas();
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            signatureMode === 'draw'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => {
            setSignatureMode('type');
            clearCanvas();
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            signatureMode === 'type'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Type
        </button>
        <button
          onClick={() => {
            setSignatureMode('upload');
            clearCanvas();
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            signatureMode === 'upload'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Upload
        </button>
      </div>

      {/* Draw Mode */}
      {signatureMode === 'draw' && (
        <div className="space-y-3">
          {/* Color and Brush Size Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</label>
              <input
                type="color"
                value={signatureColor}
                onChange={(e) => setSignatureColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setSignatureColor('#000000')}
                  className="w-8 h-8 rounded-full bg-black border-2 border-gray-300 hover:scale-110 transition-transform"
                  title="Black"
                />
                <button
                  onClick={() => setSignatureColor('#0000FF')}
                  className="w-8 h-8 rounded-full bg-blue-600 border-2 border-gray-300 hover:scale-110 transition-transform"
                  title="Blue"
                />
                <button
                  onClick={() => setSignatureColor('#FF0000')}
                  className="w-8 h-8 rounded-full bg-red-600 border-2 border-gray-300 hover:scale-110 transition-transform"
                  title="Red"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{brushSize}px</span>
            </div>
          </div>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <canvas
              ref={canvasRef}
              width={1000}
              height={400}
              className="w-full h-auto rounded-lg"
              style={{ 
                cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='${signatureColor.replace('#', '%23')}'/%3E%3C/svg%3E") 2 20, auto`,
                backgroundColor: 'transparent',
                display: 'block'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Type Mode */}
      {signatureMode === 'type' && (
        <div className="space-y-2">
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {fonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</label>
            <input
              type="color"
              value={signatureColor}
              onChange={(e) => setSignatureColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSignatureColor('#000000')}
                className="w-8 h-8 rounded-full bg-black border-2 border-gray-300 hover:scale-110 transition-transform"
                title="Black"
              />
              <button
                onClick={() => setSignatureColor('#0000FF')}
                className="w-8 h-8 rounded-full bg-blue-600 border-2 border-gray-300 hover:scale-110 transition-transform"
                title="Blue"
              />
              <button
                onClick={() => setSignatureColor('#FF0000')}
                className="w-8 h-8 rounded-full bg-red-600 border-2 border-gray-300 hover:scale-110 transition-transform"
                title="Red"
              />
            </div>
          </div>
          <input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type your signature here"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            style={{ fontFamily: selectedFont, fontSize: '24px', color: signatureColor }}
          />
              <canvas
                ref={canvasRef}
                width={1000}
                height={400}
                className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                style={{ display: typedText ? 'block' : 'none' }}
              />
        </div>
      )}

      {/* Upload Mode */}
      {signatureMode === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          {uploadedImage && (
            <img
              src={uploadedImage}
              alt="Uploaded signature"
              className="max-w-full h-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg"
            />
          )}
          <canvas
            ref={canvasRef}
            width={1000}
            height={400}
            className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* PDF Preview with Signature Placement (Drag & Drop like SmallPDF) */}
      {pdfFile && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag & Drop Signature on PDF ({totalPages} {totalPages === 1 ? 'page' : 'pages'}):
          </h4>
          <div 
            ref={(el) => {
              scrollContainerRef.current = el;
            }}
            className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-auto max-h-[600px] bg-gray-100 dark:bg-gray-900 p-4"
            style={{ cursor: isDraggingSignature ? 'grabbing' : 'default' }}
            onMouseMove={(e) => {
              // CRITICAL: When dragging, detect which page the mouse is over and update dragActivePageRef
              // This ensures signature shows on page 4/5 when dragging there
              if (isDraggingSignature) {
                // Auto-scroll when near edges
                handleAutoScroll(e, e.currentTarget as HTMLElement);
                
                // Find which page the mouse is currently over by checking all page containers
                const container = e.currentTarget as HTMLElement;
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                let targetPage: number | null = null;
                
                // Check all page containers to find which one contains the mouse
                pdfPagePreviews.forEach((preview) => {
                  const pageElement = container.querySelector(`[data-page-number="${preview.pageNum}"]`) as HTMLElement;
                  if (pageElement) {
                    const rect = pageElement.getBoundingClientRect();
                    if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
                      targetPage = preview.pageNum;
                    }
                  }
                });
                
                // If we found a target page different from current drag page, update it
                if (targetPage && targetPage !== dragActivePageRef.current) {
                  console.log('[SignaturePad] Global drag: mouse over page', targetPage, 'updating dragActivePageRef');
                  dragActivePageRef.current = targetPage;
                  // Update page number so signature shows on target page
                  setPageNumber(targetPage);
                }
                
                // Mark that we're dragging
                setHasDragged(true);
                setIsClickDisabled(true);
                
                // Clear any pending click timeout
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
              }
            }}
            onTouchMove={(e) => {
              if (isDraggingSignature && pdfCanvasRef.current && e.touches.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                
                // Auto-scroll when near edges
                handleAutoScroll(e, e.currentTarget as HTMLElement);
                
                setHasDragged(true);
                setIsClickDisabled(true);
                
                const canvas = pdfCanvasRef.current;
                const viewport = viewportRef.current || (canvas as any).pdfViewport;
                if (!viewport) return;
                
                const rect = canvas.getBoundingClientRect();
                const scrollOffset = getScrollOffset(e.currentTarget as HTMLElement);
                
                // 1) Touch position in CSS pixels - account for scroll offset
                const touch = e.touches[0];
                const cssX = touch.clientX - rect.left + scrollOffset.scrollLeft;
                const cssY = touch.clientY - rect.top + scrollOffset.scrollTop;
                
                // 2) CSS → canvas pixels
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const mouseX = cssX * scaleX;
                const mouseY = cssY * scaleY;
                
                const maxWidthPx = canvas.width * 0.3;
                const maxHeightPx = canvas.height * 0.3;
                let sigWCanvas = 150;
                let sigHCanvas = 60;
                if (signaturePreviewRef.current) {
                  sigWCanvas = signaturePreviewRef.current.width;
                  sigHCanvas = signaturePreviewRef.current.height;
                } else if (canvasRef.current) {
                  const sigCanvas = canvasRef.current;
                  sigWCanvas = Math.min(sigCanvas.width, 200);
                  sigHCanvas = Math.min(sigCanvas.height, 100);
                }
                const effectiveSigWidthPx = Math.min(sigWCanvas, maxWidthPx);
                const effectiveSigHeightPx = Math.min(sigHCanvas, maxHeightPx);
                const halfW = effectiveSigWidthPx / 2;
                const halfH = effectiveSigHeightPx / 2;
                
                const newX = mouseX - dragOffset.x;
                const newY = mouseY - dragOffset.y;
                const clampedCenterX = Math.max(halfW, Math.min(newX, canvas.width - halfW));
                const clampedCenterY = Math.max(halfH, Math.min(newY, canvas.height - halfH));
                
                const nx = (clampedCenterX - halfW) / canvas.width;
                const ny = (clampedCenterY - halfH) / canvas.height;
                const nw = effectiveSigWidthPx / canvas.width;
                const nh = effectiveSigHeightPx / canvas.height;
                const clampedNx = Math.max(0, Math.min(1 - nw, nx));
                const clampedNy = Math.max(0, Math.min(1 - nh, ny));
                
                setSignaturePosition({ x: clampedCenterX, y: clampedCenterY });
                
                // Save signature position for this page
                const currentPage = pageNumber;
                const preview = pdfPagePreviews.find(p => p.pageNum === currentPage);
                if (preview) {
                  rememberSignatureForPage(currentPage, {
                    nx: clampedNx,
                    ny: clampedNy,
                    nw,
                    nh,
                    x: clampedCenterX,
                    y: clampedCenterY,
                  });
                }
                
                if (onPositionChange) {
                  onPositionChange(clampedNx, clampedNy, currentPage, nw, nh);
                }
              }
            }}
            onMouseUp={(e) => {
              if (isDraggingSignature) {
                e.preventDefault();
                e.stopPropagation();
                
                // Stop auto-scrolling
                if (autoScrollRef.current) {
                  cancelAnimationFrame(autoScrollRef.current);
                  autoScrollRef.current = null;
                }
                
                // Cancel any pending animation frame
                if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current);
                  animationFrameRef.current = null;
                }
                
                // Reset drag state
                const wasDragging = hasDragged;
                dragStartPosRef.current = null;
                lastMousePosRef.current = null;
                setIsDraggingSignature(false);
                
                // Keep click disabled for longer if we actually dragged
                if (wasDragging) {
                  // Prevent clicks for 2 seconds after drag to ensure stability
                  clickTimeoutRef.current = setTimeout(() => {
                    setHasDragged(false);
                    setIsClickDisabled(false);
                    clickTimeoutRef.current = null;
                  }, 2000);
                } else {
                  // If no actual drag happened, reset quickly
                  setTimeout(() => {
                    setHasDragged(false);
                    setIsClickDisabled(false);
                  }, 200);
                }
              }
            }}
            onTouchEnd={(e) => {
              if (isDraggingSignature) {
                e.preventDefault();
                e.stopPropagation();
                
                // Stop auto-scrolling
                if (autoScrollRef.current) {
                  cancelAnimationFrame(autoScrollRef.current);
                  autoScrollRef.current = null;
                }
                
                const wasDragging = hasDragged;
                setIsDraggingSignature(false);
                
                if (wasDragging) {
                  clickTimeoutRef.current = setTimeout(() => {
                    setHasDragged(false);
                    setIsClickDisabled(false);
                    clickTimeoutRef.current = null;
                  }, 2000);
                } else {
                  setTimeout(() => {
                    setHasDragged(false);
                    setIsClickDisabled(false);
                  }, 200);
                }
              }
            }}
            onMouseLeave={() => {
              if (isDraggingSignature) {
                // Stop auto-scrolling
                if (autoScrollRef.current) {
                  cancelAnimationFrame(autoScrollRef.current);
                  autoScrollRef.current = null;
                }
                setIsDraggingSignature(false);
                // Don't reset hasDragged and isClickDisabled on mouse leave
                // Let the timeout handle it to prevent accidental clicks
              }
            }}
          >
            {/* Show all pages stacked vertically */}
            {pdfPagePreviews.length > 0 ? (
              <div className="flex flex-col gap-6">
                {pdfPagePreviews.map((preview, index) => (
                <div
                  key={preview.pageNum}
                  data-page-number={preview.pageNum}
                  className="relative border-2 border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                  style={{
                    borderColor: preview.pageNum === pageNumber ? '#3b82f6' : undefined,
                    borderWidth: preview.pageNum === pageNumber ? '3px' : '2px',
                  }}
                >
                  {/* Page number badge */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold z-10 shadow-md">
                    Page {preview.pageNum} {preview.pageNum === pageNumber && '(Selected)'}
                  </div>
                  
                  {/* Page image - clickable for signature placement */}
                  <div 
                    className="relative"
                    onMouseMove={(e) => {
                      if (!isDraggingSignature) return;
                      
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const imgElement = e.currentTarget.querySelector('img') as HTMLImageElement;
                      if (!imgElement) return;
                      
                      const rect = imgElement.getBoundingClientRect();
                      const scrollOffset = getScrollOffset(scrollContainerRef.current);
                      
                      // Mouse position relative to image
                      const mouseX = e.clientX - rect.left + scrollOffset.scrollLeft;
                      const mouseY = e.clientY - rect.top + scrollOffset.scrollTop;
                      
                      // Convert to image coordinate space
                      const imgCoordX = (mouseX / rect.width) * preview.width;
                      const imgCoordY = (mouseY / rect.height) * preview.height;
                      
                      const targetPage = preview.pageNum;
                      
                      // CRITICAL: Always update dragActivePageRef when mouse moves over a different page
                      // This allows smooth dragging from page 3 to page 4, 5, etc.
                      const previousDragPage = dragActivePageRef.current;
                      if (previousDragPage !== targetPage) {
                        console.log('[SignaturePad] Drag crossing to page', targetPage, 'from page', previousDragPage);
                        dragActivePageRef.current = targetPage;
                        // CRITICAL: Immediately update page number so signature shows on target page
                        // Use a callback to ensure state updates synchronously
                        setPageNumber(prev => {
                          if (prev !== targetPage) {
                            console.log('[SignaturePad] Page number updating to', targetPage);
                            return targetPage;
                          }
                          return prev;
                        });
                      }
                      
                      // Get saved signature for target page, or use source signature for size
                      const savedSig = signaturesPerPage.get(targetPage);
                      const sourcePage = dragActivePageRef.current || pageNumber;
                      const sourceSig = signaturesPerPage.get(sourcePage);
                      
                      // Use source signature size or default size
                      const sizeSource = savedSig || sourceSig || getDefaultNormalizedSize(preview.width, preview.height);
                      
                      // CRITICAL: Always use dragOffset from when drag started
                      // This ensures smooth dragging across pages (offset calculated on page 3 works on page 4)
                      const offsetX = dragOffset.x || 0;
                      const offsetY = dragOffset.y || 0;
                      
                      // Calculate new position on this page
                      const newX = imgCoordX - offsetX;
                      const newY = imgCoordY - offsetY;
                      
                      // Clamp to page bounds - ensure signature stays visible
                      const margin = 25;
                      const clampedX = Math.max(margin, Math.min(newX, preview.width - margin));
                      const clampedY = Math.max(margin, Math.min(newY, preview.height - margin));
                      
                      // Ensure coordinates are valid
                      if (clampedX <= 0 || clampedY <= 0 || clampedX > preview.width || clampedY > preview.height) {
                        console.warn('[SignaturePad] Invalid clamped coordinates on page', targetPage, {
                          newX, newY, clampedX, clampedY, pageWidth: preview.width, pageHeight: preview.height
                        });
                        return;
                      }
                      
                      // CRITICAL: Update signature position IMMEDIATELY for visual feedback
                      setSignaturePosition({ x: clampedX, y: clampedY });
                      setHasDragged(true);
                      
                      console.log('[SignaturePad] Drag update on page', targetPage, {
                        imgCoord: { x: imgCoordX, y: imgCoordY },
                        offset: { x: offsetX, y: offsetY },
                        newPos: { x: newX, y: newY },
                        clampedPos: { x: clampedX, y: clampedY },
                      });
                      
                      const ny = clampedY / preview.height; // 0 = top, 1 = bottom
                      const nx = clampedX / preview.width;
                      const baseNW = (sizeSource as { nw?: number })?.nw ?? 0.2;
                      const baseNH = (sizeSource as { nh?: number })?.nh ?? 0.1;
                      
                      rememberSignatureForPage(targetPage, {
                        nx,
                        ny,
                        nw: baseNW,
                        nh: baseNH,
                        x: clampedX,
                        y: clampedY,
                      });
                      
                      if (pdfDocRef.current && onPositionChange) {
                        pdfDocRef.current.getPage(targetPage).then(async (page: any) => {
                          const viewport = page.getViewport({ scale: 1.0 });
                          const actualPdfWidth = viewport.width;
                          const actualPdfHeight = viewport.height;
                          const scaleRatio = actualPdfWidth / preview.width;
                          
                          let sigW = 150;
                          let sigH = 60;
                          if (signaturePreviewRef.current) {
                            sigW = signaturePreviewRef.current.width * scaleRatio;
                            sigH = signaturePreviewRef.current.height * scaleRatio;
                          }
                          
                          const maxWidth = actualPdfWidth * 0.3;
                          const maxHeight = actualPdfHeight * 0.3;
                          const effectiveSigW = Math.min(sigW, maxWidth);
                          const effectiveSigH = Math.min(sigH, maxHeight);
                          
                          const halfW = effectiveSigW / 2;
                          const halfH = effectiveSigH / 2;
                          
                          const pdfX = clampedX * scaleRatio;
                          const topLeftX = pdfX - halfW;
                          const topLeftYFromTop = (clampedY / preview.height) * actualPdfHeight - halfH;
                          
                          const nx_final = Math.max(0, Math.min(1, topLeftX / actualPdfWidth));
                          const ny_final = Math.max(0, Math.min(1, topLeftYFromTop / actualPdfHeight));
                          const nw = Math.min(effectiveSigW / actualPdfWidth, 0.3);
                          const nh = Math.min(effectiveSigH / actualPdfHeight, 0.3);
                          
                          onPositionChange(nx_final, ny_final, targetPage, nw, nh);
                        }).catch(console.error);
                      }
                    }}
                    onMouseUp={() => {
                      // CRITICAL: Handle mouse up on ANY page where dragging occurs
                      if (isDraggingSignature) {
                        setIsDraggingSignature(false);
                        dragActivePageRef.current = null;
                        setTimeout(() => {
                          setHasDragged(false);
                          setIsClickDisabled(false);
                        }, 200);
                      }
                    }}
                  >
                    <img
                      src={preview.dataUrl}
                      alt={`Page ${preview.pageNum}`}
                      className="w-full h-auto block"
                      style={{ 
                        cursor: isDraggingSignature && preview.pageNum === pageNumber ? 'grabbing' : 'default',
                        maxWidth: '100%', 
                        display: 'block',
                        userSelect: 'none',
                        pointerEvents: 'auto',
                      }}
                      onClick={async (e) => {
                      // CRITICAL: Don't trigger page click if clicking directly on signature preview itself
                      // This prevents signature from disappearing when user clicks on it
                      const target = e.target as HTMLElement;
                      // Check if click is on signature or any element inside signature preview
                      const clickedOnSignature = target.closest('[data-signature-preview]') !== null ||
                                                  target.closest('.signature-preview-image') !== null ||
                                                  target.hasAttribute('data-signature-preview') ||
                                                  (target.tagName === 'IMG' && target.alt === 'Signature preview');
                      
                      if (clickedOnSignature) {
                        // User clicked on signature itself - don't move it, allow dragging
                        console.log('[SignaturePad] Clicked on signature itself, ignoring page click');
                        e.preventDefault();
                        e.stopPropagation(); // CRITICAL: Prevent page click handler from firing
                        return;
                      }
                      
                      // Also check if click happened on any signature element in the page
                      const allSignatureElements = e.currentTarget.parentElement?.querySelectorAll('[data-signature-preview]');
                      if (allSignatureElements && allSignatureElements.length > 0) {
                        for (const sigEl of Array.from(allSignatureElements)) {
                          const sigRect = sigEl.getBoundingClientRect();
                          if (e.clientX >= sigRect.left && e.clientX <= sigRect.right &&
                              e.clientY >= sigRect.top && e.clientY <= sigRect.bottom) {
                            console.log('[SignaturePad] Click inside signature bounds, ignoring page click');
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                        }
                      }
                      
                      // Don't trigger if currently dragging
                      if (isDraggingSignature) return;
                      
                      // Small delay after drag to prevent accidental clicks
                      if (hasDragged && isClickDisabled) {
                        setTimeout(() => {
                          setHasDragged(false);
                          setIsClickDisabled(false);
                        }, 300);
                        return;
                      }
                      
                      if (isClickDisabled) return;
                      
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // CRITICAL: Check if signature exists first
                      if (!signaturePreviewRef.current) {
                        console.warn('[SignaturePad] No signature created yet. Please create a signature first.');
                        alert('Please create a signature first (draw, type, or upload) before placing it on the PDF.');
                        return;
                      }
                      
                      // Clear drag flags to allow fresh click
                      setHasDragged(false);
                      setIsClickDisabled(false);
                      
                      // CRITICAL: Immediately show signature on click (no drag needed)
                      // This ensures user sees signature appear instantly when clicking
                      console.log('[SignaturePad] Page click handler triggered for page', preview.pageNum);
                      
                      const imgElement = e.currentTarget;
                      if (!imgElement || !pdfDocRef.current) return;
                      
                      const rect = imgElement.getBoundingClientRect();
                      const scrollOffset = getScrollOffset(scrollContainerRef.current);
                      
                      // Click position relative to image (accounting for scroll)
                      // cssX and cssY are in image display coordinates (not naturalWidth/Height)
                      const cssX = e.clientX - rect.left + scrollOffset.scrollLeft;
                      const cssY = e.clientY - rect.top + scrollOffset.scrollTop;
                      
                      // Convert to image coordinate space (proportional)
                      const imgDisplayWidth = rect.width;
                      const imgDisplayHeight = rect.height;
                      const imgCoordX = (cssX / imgDisplayWidth) * preview.width;
                      const imgCoordY = (cssY / imgDisplayHeight) * preview.height;
                      
                      // CRITICAL: Update page number FIRST so useEffect can restore position if needed
                      // But we'll immediately override with new position
                      const clickedPageNum = preview.pageNum;
                      
                      // Load PDF page for coordinate conversion
                      try {
                        const page = await pdfDocRef.current.getPage(clickedPageNum);
                        const viewport = page.getViewport({ scale: 1.0 });
                        const actualPdfWidth = viewport.width;
                        const actualPdfHeight = viewport.height;
                        
                        // Store page reference for canvas (hidden)
                        if (pdfCanvasRef.current) {
                          const canvas = pdfCanvasRef.current;
                          canvas.width = preview.width;
                          canvas.height = preview.height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            const img = new Image();
                            img.onload = () => {
                              ctx.drawImage(img, 0, 0);
                              (canvas as any).pdfViewport = viewport;
                              (canvas as any).pdfPage = page;
                              viewportRef.current = viewport;
                            };
                            img.src = preview.dataUrl;
                          }
                        }
                        
                        // Convert image coordinates to PDF coordinates
                        const scaleRatio = actualPdfWidth / preview.width;
                        const pdfX = imgCoordX * scaleRatio;
                        const ny = imgCoordY / preview.height;
                        
                        // Signature dimensions
                        let sigWCanvas = 150;
                        let sigHCanvas = 60;
                        if (signaturePreviewRef.current) {
                          sigWCanvas = signaturePreviewRef.current.width;
                          sigHCanvas = signaturePreviewRef.current.height;
                        }
                        
                        const sigWPdf = sigWCanvas * scaleRatio;
                        const sigHPdf = sigHCanvas * scaleRatio;
                        const maxWidthPdf = actualPdfWidth * 0.3;
                        const maxHeightPdf = actualPdfHeight * 0.3;
                        const effectiveSigWidthPdf = Math.min(sigWPdf, maxWidthPdf);
                        const effectiveSigHeightPdf = Math.min(sigHPdf, maxHeightPdf);
                        
                        const halfW = effectiveSigWidthPdf / 2;
                        const halfH = effectiveSigHeightPdf / 2;
                        
                        // Calculate center position in PDF coordinates
                        const centerX = pdfX;
                        const centerYFromTop = ny * actualPdfHeight;
                        
                        // Clamp center position to page bounds
                        const clampedCenterX = Math.max(halfW, Math.min(centerX, actualPdfWidth - halfW));
                        const clampedCenterYFromTop = Math.max(halfH, Math.min(centerYFromTop, actualPdfHeight - halfH));
                        
                        // Calculate top-left position for normalized coordinates
                        const topLeftX = clampedCenterX - halfW;
                        const topLeftYFromTop = clampedCenterYFromTop - halfH;
                        
                        // Normalized coordinates (0-1, where 0,0 is top-left in UI)
                        const nx = topLeftX / actualPdfWidth;
                        const finalNy = topLeftYFromTop / actualPdfHeight;
                        const nw = effectiveSigWidthPdf / actualPdfWidth;
                        const nh = effectiveSigHeightPdf / actualPdfHeight;
                        
                        // Position in image coordinate space for display
                        const displayX = imgCoordX;
                        const displayY = imgCoordY;
                        
                        // CRITICAL: Save signature position for this page IMMEDIATELY
                        rememberSignatureForPage(clickedPageNum, {
                          nx,
                          ny: finalNy,
                          nw,
                          nh,
                          x: displayX,
                          y: displayY,
                        });
                        
                        console.log('[SignaturePad] Page clicked - placing signature immediately:', {
                          page: clickedPageNum,
                          displayX,
                          displayY,
                        });
                        
                        // CRITICAL: Update position state IMMEDIATELY so signature shows right away
                        setSignaturePosition({ 
                          x: displayX, 
                          y: displayY 
                        });
                        
                        // Update page number AFTER position is set (so signature shows immediately)
                        setPageNumber(clickedPageNum);
                        
                        // Clear drag flags
                        setHasDragged(false);
                        setIsClickDisabled(false);
                        
                        // Force immediate re-render by updating a trigger state if needed
                        console.log('[SignaturePad] Updated signature position state:', {
                          page: preview.pageNum,
                          x: displayX,
                          y: displayY,
                        });
                        
                        console.log('[SignaturePad] Page clicked - placing signature:', {
                          page: preview.pageNum,
                          clickImgCoord: { x: imgCoordX, y: imgCoordY },
                          clickCssCoord: { x: cssX, y: cssY },
                          normalized: { nx, ny: finalNy },
                          'ny_percent': (finalNy * 100).toFixed(1) + '% from top',
                        });
                        
                        if (onPositionChange) {
                          onPositionChange(nx, finalNy, preview.pageNum, nw, nh);
                        }
                      } catch (error) {
                        console.error('[SignaturePad] Error handling page click:', error);
                      }
                    }}
                    />
                    
                    {/* Show signature preview on this page - SIMPLE LOGIC */}
                    {(() => {
                      const savedSig = signaturesPerPage.get(preview.pageNum);
                      const isCurrentPage = preview.pageNum === pageNumber;
                      const hasSignatureImage = signaturePreviewRef.current && signaturePreviewRef.current.src;
                      
                      // CRITICAL: Check if dragging on THIS page using dragActivePageRef
                      // This is the most reliable way - it updates immediately when mouse moves to a different page
                      const isDragTargetPage = isDraggingSignature && dragActivePageRef.current === preview.pageNum;
                      
                      // ALSO check if we're dragging and this is the current page (fallback)
                      const isDraggingOnCurrentPage = isDraggingSignature && isCurrentPage && signaturePosition.x > 0 && signaturePosition.y > 0;
                      
                      // Show signature if either condition is true (covers all drag scenarios)
                      const shouldShowDuringDrag = isDragTargetPage || isDraggingOnCurrentPage;
                      
                      if (shouldShowDuringDrag && hasSignatureImage) {
                        // During drag, use live position from signaturePosition, with fallback to saved position
                        let dragX = signaturePosition.x;
                        let dragY = signaturePosition.y;
                        
                        // Fallback to saved position if current position is invalid
                        if ((dragX <= 0 || dragY <= 0) && savedSig) {
                          dragX = savedSig.x;
                          dragY = savedSig.y;
                        }
                        
                        // If still invalid, use default position (center of page)
                        if (dragX <= 0 || dragY <= 0) {
                          dragX = preview.width / 2;
                          dragY = preview.height / 2;
                        }
                        
                        // ALWAYS show signature during drag on target page
                        console.log('[SignaturePad] Showing signature during drag on page', preview.pageNum, {
                          isDragTargetPage,
                          isCurrentPage,
                          dragX,
                          dragY,
                          signaturePosition,
                        });
                        
                        return (
                          <div
                            className="absolute"
                            style={{
                              left: `${Math.max(0, Math.min(100, (dragX / preview.width) * 100))}%`,
                              top: `${Math.max(0, Math.min(100, (dragY / preview.height) * 100))}%`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 30,
                              cursor: 'grabbing',
                              pointerEvents: 'auto',
                              userSelect: 'none',
                              touchAction: 'none',
                            }}
                          >
                            <img
                              src={signaturePreviewRef.current.src}
                              alt="Signature preview"
                              data-signature-preview="true"
                              className="signature-preview-image max-w-[150px] max-h-[60px] select-none"
                              draggable={false}
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                border: '2px solid #3b82f6',
                                borderRadius: '4px',
                                opacity: 1,
                                pointerEvents: 'none',
                              }}
                            />
                          </div>
                        );
                      }
                      
                      // Normal display (not dragging): Show if signature exists AND we have valid position
                      // CRITICAL: Must have signature image to display
                      if (!hasSignatureImage) {
                        return null;
                      }
                      
                      // CRITICAL: PRIORITY 1 - Check for saved position (most reliable - persists across renders)
                      const hasSavedPos = savedSig && savedSig.x > 0 && savedSig.y > 0;
                      
                      // CRITICAL: PRIORITY 2 - Check for current position on current page (for immediate feedback on click)
                      const hasCurrentPos = isCurrentPage && signaturePosition.x > 0 && signaturePosition.y > 0;
                      
                      // CRITICAL: PRIORITY 3 - Check for pending signature (just placed, not yet in saved map)
                      const hasPendingPos = pendingSignatureRef.current && 
                                           pendingSignatureRef.current.pageNum === preview.pageNum &&
                                           pendingSignatureRef.current.data.x > 0 && 
                                           pendingSignatureRef.current.data.y > 0;
                      
                      // SIMPLIFIED LOGIC: Show signature if we have saved position OR current position OR pending position
                      // This ensures signature shows immediately on click AND persists after being placed
                      // BUT: Don't show if we're currently dragging (to avoid duplicates - drag shows separately)
                      const shouldShowSignature = !isDraggingSignature && (hasSavedPos || hasCurrentPos || hasPendingPos);
                      
                      if (!shouldShowSignature) {
                        return null;
                      }
                      
                      // CRITICAL: ALWAYS prefer saved position first (it persists)
                      // Then pending position (just placed), then current position
                      let displayX: number;
                      let displayY: number;
                      
                      if (hasSavedPos) {
                        // Use saved position (most reliable - this ensures signature persists after click)
                        displayX = savedSig.x;
                        displayY = savedSig.y;
                      } else if (hasPendingPos && pendingSignatureRef.current) {
                        // Use pending position (just placed, shows immediately on click)
                        displayX = pendingSignatureRef.current.data.x;
                        displayY = pendingSignatureRef.current.data.y;
                      } else if (hasCurrentPos) {
                        // Use current position (for immediate feedback when clicking)
                        displayX = signaturePosition.x;
                        displayY = signaturePosition.y;
                      } else {
                        // This should never happen due to shouldShowSignature check
                        return null;
                      }
                      
                      // CRITICAL: Don't reject coordinates if we have a saved position
                      // Saved positions should ALWAYS be shown (they're valid since they were saved)
                      // Only validate if using current position (not saved)
                      if (!hasSavedPos) {
                        // For current position, ensure basic validity
                        if (!displayX || !displayY || displayX <= 0 || displayY <= 0) {
                          return null;
                        }
                      }
                      
                      // Clamp coordinates to page bounds for display (don't reject, just clamp)
                      const clampedX = Math.max(0, Math.min(displayX, preview.width));
                      const clampedY = Math.max(0, Math.min(displayY, preview.height));
                      
                      // Use clamped coordinates for display
                      displayX = clampedX;
                      displayY = clampedY;
                      
                      return (
                        <div
                          data-signature-preview="true"
                          className="absolute"
                          style={{
                            left: `${(displayX / preview.width) * 100}%`,
                            top: `${(displayY / preview.height) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 30,
                            cursor: (isDragTargetPage || isCurrentPage) ? (isDragTargetPage ? 'grabbing' : 'move') : 'default',
                            pointerEvents: (hasSavedPos || isCurrentPage) ? 'auto' : 'none',
                            userSelect: 'none',
                            touchAction: 'none',
                          }}
                          onClick={(e) => {
                            // CRITICAL: Stop click propagation to prevent page click handler from firing
                            // This prevents signature from disappearing when user clicks on it
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[SignaturePad] Clicked on signature - preventing page click handler');
                          }}
                          onMouseDown={(e) => {
                            // CRITICAL: Also stop propagation on mousedown to prevent any click handlers
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            // CRITICAL: Allow dragging signature from ANY page where it exists
                            // Don't check isCurrentPage - user should be able to drag from any visible signature
                            
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Switch to this page first
                            setPageNumber(preview.pageNum);
                            setHasDragged(false);
                            setIsClickDisabled(true);
                            
                            const imgElement = e.currentTarget.parentElement?.querySelector('img') as HTMLImageElement;
                            if (!imgElement) return;
                            
                            const rect = imgElement.getBoundingClientRect();
                            const scrollOffset = getScrollOffset(scrollContainerRef.current);
                            
                            // Mouse position relative to image
                            const mouseX = e.clientX - rect.left + scrollOffset.scrollLeft;
                            const mouseY = e.clientY - rect.top + scrollOffset.scrollTop;
                            
                            // Current signature position in image coordinates
                            const currentX = savedSig?.x || displayX;
                            const currentY = savedSig?.y || displayY;
                            
                            // Calculate drag offset (distance from mouse to signature center)
                            const offsetX = (mouseX / rect.width) * preview.width - currentX;
                            const offsetY = (mouseY / rect.height) * preview.height - currentY;
                            
                            setDragOffset({ x: offsetX, y: offsetY });
                            setIsDraggingSignature(true);
                            
                            // CRITICAL: Track which page the drag started on
                            dragActivePageRef.current = preview.pageNum;
                            
                            console.log('[SignaturePad] Drag started on page', preview.pageNum, {
                              currentPos: { x: currentX, y: currentY },
                              mousePos: { x: mouseX, y: mouseY },
                              offset: { x: offsetX, y: offsetY },
                            });
                          }}
                          onTouchStart={(e) => {
                            if (!isCurrentPage) return;
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setPageNumber(preview.pageNum);
                            setHasDragged(false);
                            setIsClickDisabled(true);
                            
                            const imgElement = e.currentTarget.parentElement?.querySelector('img') as HTMLImageElement;
                            if (!imgElement || !e.touches[0]) return;
                            
                            const rect = imgElement.getBoundingClientRect();
                            const scrollOffset = getScrollOffset(scrollContainerRef.current);
                            const touch = e.touches[0];
                            
                            const mouseX = touch.clientX - rect.left + scrollOffset.scrollLeft;
                            const mouseY = touch.clientY - rect.top + scrollOffset.scrollTop;
                            
                            const currentX = savedSig.x;
                            const currentY = savedSig.y;
                            
                            const offsetX = (mouseX / rect.width) * preview.width - currentX;
                            const offsetY = (mouseY / rect.height) * preview.height - currentY;
                            
                            setDragOffset({ x: offsetX, y: offsetY });
                            setIsDraggingSignature(true);
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              padding: '2px',
                              backgroundColor: isCurrentPage ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                              borderRadius: '6px',
                              border: isCurrentPage ? '2px solid #3b82f6' : '2px solid #94a3b8',
                            }}
                          >
                            <img
                              src={signaturePreviewRef.current.src}
                              alt="Signature preview"
                              className="max-w-[150px] max-h-[60px] select-none"
                              draggable={false}
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                borderRadius: '4px',
                                opacity: isCurrentPage ? 1 : 0.8,
                                pointerEvents: 'none',
                                display: 'block',
                              }}
                            />
                          </div>
                          </div>
                        );
                      
                      return null;
                    })()}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Loading PDF pages...</p>
                <p className="text-sm mt-2">Please wait while we render all pages.</p>
              </div>
            )}
            
            {/* Hidden canvas for coordinate calculations */}
            <canvas
              ref={pdfCanvasRef}
              className="hidden"
              style={{ display: 'none' }}
              onMouseDown={(e) => {
                // Only handle click if:
                // 1. Not dragging signature box
                // 2. Clicks are not disabled (after drag)
                // 3. Click is directly on canvas (not on signature box)
                const canClick = !isDraggingSignature && !isClickDisabled && !hasDragged && e.target === pdfCanvasRef.current;
                
                // Allow clicking even if signature is already placed (to move it)
                if (canClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const canvas = pdfCanvasRef.current;
                  if (!canvas) return;
                  
                  // Get viewport for scale conversion
                  const viewport = viewportRef.current || (canvas as any).pdfViewport;
                  if (!viewport) {
                    console.error('[SignaturePad] Viewport not available');
                    return;
                  }
                  
                  const rect = canvas.getBoundingClientRect();
                  const scrollOffset = getScrollOffset(scrollContainerRef.current);
                  
                  // 1) Mouse position (CSS pixels) - account for scroll offset
                  // CRITICAL FIX: rect.top can be negative if canvas is scrolled up in viewport
                  // When rect.top is negative, we need to calculate relative to the visible canvas
                  // cssX and cssY should be relative to the canvas element itself (0,0 at top-left of canvas)
                  const cssX = e.clientX - rect.left;
                  const cssY = e.clientY - rect.top;
                  
                  // Then add scroll offset to get the position within the full canvas
                  const cssXWithScroll = cssX + scrollOffset.scrollLeft;
                  const cssYWithScroll = cssY + scrollOffset.scrollTop;
                  
                  // DEBUG: Log raw click position
                  console.log('[SignaturePad] RAW CLICK POSITION:', {
                    'clientX': e.clientX,
                    'clientY': e.clientY,
                    'rect_left': rect.left,
                    'rect_top': rect.top,
                    'scrollLeft': scrollOffset.scrollLeft,
                    'scrollTop': scrollOffset.scrollTop,
                    'cssX_relative': cssX,
                    'cssY_relative': cssY,
                    'cssX_with_scroll': cssXWithScroll,
                    'cssY_with_scroll': cssYWithScroll,
                    'rect_width': rect.width,
                    'rect_height': rect.height,
                    'note': 'cssY_with_scroll should be small (50-200) if clicking at top of canvas'
                  });
                  
                  // 2) CSS → canvas pixels (hi-DPI fix)
                  // Use the position WITH scroll offset to get the correct canvas coordinates
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  
                  const canvasX = cssXWithScroll * scaleX;
                  const canvasY = cssYWithScroll * scaleY;
                  
                  console.log('[SignaturePad] CANVAS COORDINATES:', {
                    'scaleX': scaleX,
                    'scaleY': scaleY,
                    'canvasX': canvasX,
                    'canvasY': canvasY,
                    'canvas_width': canvas.width,
                    'canvas_height': canvas.height,
                    'note': 'canvasY should be small (100-400) if clicking at top'
                  });
                  
                  // 3) CRITICAL: Get actual PDF page dimensions (not scaled canvas dimensions)
                  // This must be done BEFORE calculating signature size
                  const pdfPage = (canvas as any).pdfPage;
                  const pdfViewport = viewport || (canvas as any).pdfViewport;
                  let actualPdfWidth = canvas.width;
                  let actualPdfHeight = canvas.height;
                  
                  if (pdfViewport && pdfPage) {
                    // Get the actual PDF page size at scale 1.0
                    const scale1Viewport = pdfPage.getViewport({ scale: 1.0 });
                    if (scale1Viewport) {
                      actualPdfWidth = scale1Viewport.width;
                      actualPdfHeight = scale1Viewport.height;
                    }
                  }
                  
                  // Calculate scale ratio: canvas is at scale 1.5, PDF is at scale 1.0
                  const scaleRatio = actualPdfWidth / canvas.width; // Should be 1/1.5 = 0.666...
                  
                  // 4) Signature size (use actual signature preview size, clamp at 30% of ACTUAL PDF page)
                  let sigWCanvas = 150;
                  let sigHCanvas = 60;
                  if (signaturePreviewRef.current) {
                    sigWCanvas = signaturePreviewRef.current.width;
                    sigHCanvas = signaturePreviewRef.current.height;
                  } else if (canvasRef.current) {
                    const sigCanvas = canvasRef.current;
                    sigWCanvas = Math.min(sigCanvas.width, 200);
                    sigHCanvas = Math.min(sigCanvas.height, 100);
                  }
                  
                  // Convert signature size from canvas scale to PDF scale, then clamp to 30% of PDF page
                  const sigWPdf = sigWCanvas * scaleRatio;
                  const sigHPdf = sigHCanvas * scaleRatio;
                  const maxWidthPdf = actualPdfWidth * 0.3;
                  const maxHeightPdf = actualPdfHeight * 0.3;
                  const effectiveSigWidthPdf = Math.min(sigWPdf, maxWidthPdf);
                  const effectiveSigHeightPdf = Math.min(sigHPdf, maxHeightPdf);
                  
                  // 5) Convert click (center) → PDF coordinates
                  // Canvas coordinates: (0,0) at top-left, Y increases downward
                  // PDF coordinates: (0,0) at bottom-left, Y increases upward
                  // 
                  // CRITICAL: Canvas Y is from TOP, but PDF Y is from BOTTOM!
                  // When canvasY is small (top), pdfY should be large (top in PDF = height)
                  // Conversion: pdfY = actualPdfHeight - (canvasY * scaleRatio)
                  
                  const pdfX = canvasX * scaleRatio; // X stays same (both left-to-right)
                  // Y conversion: canvas Y is from top, PDF Y is from bottom
                  // canvasY is small when clicking at top, large when clicking at bottom
                  const pdfYFromTop = canvasY * scaleRatio; // Distance from top in PDF units
                  
                  const halfW = effectiveSigWidthPdf / 2;
                  const halfH = effectiveSigHeightPdf / 2;
                  
                  // Clamp center position to PDF page bounds
                  // Use Y from top for clamping (easier to work with)
                  const clampedCenterX = Math.max(halfW, Math.min(pdfX, actualPdfWidth - halfW));
                  const clampedCenterYFromTop = Math.max(halfH, Math.min(pdfYFromTop, actualPdfHeight - halfH));
                  
                  // Calculate top-left corner position (from top)
                  const topLeftX = clampedCenterX - halfW;
                  const topLeftYFromTop = clampedCenterYFromTop - halfH; // Y from top in PDF units
                  
                  // Normalized coordinates (0-1, where 0,0 is top-left in UI)
                  const nx = topLeftX / actualPdfWidth;
                  const ny = topLeftYFromTop / actualPdfHeight; // Normalized Y from top (0 = top, 1 = bottom)
                  
                  // Verify calculation
                  console.log('[SignaturePad] Y-coordinate calculation (FIXED):', {
                    'canvasY': canvasY,
                    'pdfYFromTop': pdfYFromTop,
                    'clampedCenterYFromTop': clampedCenterYFromTop,
                    'halfH': halfH,
                    'topLeftYFromTop': topLeftYFromTop,
                    'actualPdfHeight': actualPdfHeight,
                    'ny': ny,
                    'ny_percent': (ny * 100).toFixed(2) + '% from top',
                    'verification': ny < 0.2 ? '✓ TOP' : ny < 0.5 ? 'MIDDLE' : 'BOTTOM'
                  });
                  
                  // DEBUG: Comprehensive verification
                  console.log('[SignaturePad] COMPREHENSIVE DEBUG - Coordinate calculation:', {
                    'step1_cssY': cssY,
                    'step2_canvasY': canvasY,
                    'step3_pdfYFromTop': pdfYFromTop,
                    'step4_clampedCenterX': clampedCenterX,
                    'step4_clampedCenterYFromTop': clampedCenterYFromTop,
                    'step5_halfW': halfW,
                    'step5_halfH': halfH,
                    'step6_topLeftX': topLeftX,
                    'step6_topLeftYFromTop': topLeftYFromTop,
                    'step7_actualPdfWidth': actualPdfWidth,
                    'step7_actualPdfHeight': actualPdfHeight,
                    'step8_nx': nx,
                    'step8_ny': ny,
                    'nx_percent': (nx * 100).toFixed(2) + '% from left',
                    'ny_percent': (ny * 100).toFixed(2) + '% from top',
                    'interpretation': ny < 0.2 ? 'TOP (0-20%)' : ny < 0.5 ? 'MIDDLE (20-50%)' : ny < 0.8 ? 'LOWER (50-80%)' : 'BOTTOM (80-100%)',
                    'expected': 'If clicking at top, ny should be 0.1-0.3 (10-30%)',
                    'status': ny < 0.3 ? '✓ CORRECT' : '✗ WRONG - ny is too large!'
                  });
                  
                  // DEBUG: Log the calculation
                  console.log('[SignaturePad] CRITICAL DEBUG - Y coordinate calculation:', {
                    'click_canvasY': canvasY,
                    'click_pdfYFromTop': pdfYFromTop,
                    'clampedCenterYFromTop': clampedCenterYFromTop,
                    'halfH': halfH,
                    'topLeftYFromTop': topLeftYFromTop,
                    'actualPdfHeight': actualPdfHeight,
                    'ny_calculated': ny,
                    'ny_percent_from_top': (ny * 100).toFixed(2) + '%',
                    'expected': 'If clicking near top, ny should be 0.1-0.2 (10-20%)',
                    'actual': ny < 0.2 ? '✓ TOP (correct)' : ny < 0.5 ? '⚠ MIDDLE (wrong if clicking top)' : '✗ BOTTOM (definitely wrong)'
                  });
                  
                  // Calculate normalized size based on actual PDF dimensions
                  const actualNw = effectiveSigWidthPdf / actualPdfWidth;
                  const actualNh = effectiveSigHeightPdf / actualPdfHeight;
                  
                  const clampedNx = Math.max(0, Math.min(1 - actualNw, nx));
                  const clampedNy = Math.max(0, Math.min(1 - actualNh, ny));
                  
                  // Store preview coordinates for display (center point)
                  // Convert back to canvas coordinates for preview (since canvas is at scale 1.5)
                  // Use Y from top for preview (canvas also uses Y from top)
                  const previewX = clampedCenterX / scaleRatio;
                  const previewY = clampedCenterYFromTop / scaleRatio;
                  setSignaturePosition({ x: previewX, y: previewY });
                  
                  if (onPositionChange) {
                    const currentPage = pageNumber;
                    
                    console.log('[SignaturePad] ===== CLICK DETECTED =====');
                    console.log('[SignaturePad] Step 1 - Canvas dimensions:', { 
                      width: canvas.width, 
                      height: canvas.height,
                      'viewport_scale': viewport?.scale || 'unknown'
                    });
                    console.log('[SignaturePad] Step 2 - Mouse position (CSS pixels):', { 
                      cssX, 
                      cssY,
                      'rect_left': rect.left,
                      'rect_top': rect.top,
                      'scroll_left': scrollOffset.scrollLeft,
                      'scroll_top': scrollOffset.scrollTop
                    });
                    console.log('[SignaturePad] Step 3 - Canvas position (canvas pixels):', { 
                      canvasX, 
                      canvasY,
                      'scaleX': scaleX,
                      'scaleY': scaleY,
                      'calculation': `canvasX = ${cssX} * ${scaleX} = ${canvasX}, canvasY = ${cssY} * ${scaleY} = ${canvasY}`
                    });
                    console.log('[SignaturePad] Step 4 - Signature size:', { 
                      'width_pdf': effectiveSigWidthPdf, 
                      'height_pdf': effectiveSigHeightPdf, 
                      'halfW': halfW, 
                      'halfH': halfH,
                      'maxWidthPdf': maxWidthPdf,
                      'maxHeightPdf': maxHeightPdf
                    });
                    console.log('[SignaturePad] Step 5 - Center position calculation:', {
                      'clampedCenterX': clampedCenterX,
                      'clampedCenterYFromTop': clampedCenterYFromTop,
                      'calculation_x': `max(${halfW}, min(${pdfX}, ${actualPdfWidth} - ${halfW})) = ${clampedCenterX}`,
                      'calculation_y': `max(${halfH}, min(${pdfYFromTop}, ${actualPdfHeight} - ${halfH})) = ${clampedCenterYFromTop}`
                    });
                    console.log('[SignaturePad] Step 6 - Normalized coordinates (before clamp):', {
                      'nx_raw': nx,
                      'ny_raw': ny,
                      'nx_calc': `(${topLeftX}) / ${actualPdfWidth} = ${nx}`,
                      'ny_calc': `(${topLeftYFromTop}) / ${actualPdfHeight} = ${ny}`,
                      'ny_percent_from_top': (ny * 100).toFixed(2) + '%',
                      'interpretation': ny < 0.2 ? 'TOP (0-20%)' : ny < 0.5 ? 'UPPER-MIDDLE (20-50%)' : ny < 0.8 ? 'LOWER-MIDDLE (50-80%)' : 'BOTTOM (80-100%)'
                    });
                    console.log('[SignaturePad] Step 7 - Clamped normalized coordinates:', {
                      'nx': clampedNx,
                      'ny': clampedNy,
                      'nx_percent': (clampedNx * 100).toFixed(2) + '% from left',
                      'ny_percent': (clampedNy * 100).toFixed(2) + '% from top',
                      'ny_interpretation': clampedNy < 0.2 ? 'TOP (0-20%)' : clampedNy < 0.5 ? 'UPPER-MIDDLE (20-50%)' : clampedNy < 0.8 ? 'LOWER-MIDDLE (50-80%)' : 'BOTTOM (80-100%)',
                      'clamp_checks': {
                        'nx_clamped': nx !== clampedNx ? 'YES (was ' + nx.toFixed(4) + ')' : 'NO',
                        'ny_clamped': ny !== clampedNy ? 'YES (was ' + ny.toFixed(4) + ')' : 'NO'
                      }
                    });
                    console.log('[SignaturePad] Step 8 - PDF dimensions (scale 1.0):', {
                      'actualPdfWidth': actualPdfWidth,
                      'actualPdfHeight': actualPdfHeight,
                      'canvasWidth': canvas.width,
                      'canvasHeight': canvas.height,
                      'scaleRatio': scaleRatio,
                      'note': 'Coordinates converted from canvas (scale 1.5) to PDF (scale 1.0)'
                    });
                    console.log('[SignaturePad] Step 9 - Signature size (normalized):', { 
                      nw: actualNw, 
                      nh: actualNh,
                      'nw_percent': (actualNw * 100).toFixed(2) + '% of page width',
                      'nh_percent': (actualNh * 100).toFixed(2) + '% of page height'
                    });
                    console.log('[SignaturePad] Step 10 - Final values being sent:', { 
                      nx: clampedNx, 
                      ny: clampedNy, 
                      page: currentPage, 
                      nw: actualNw, 
                      nh: actualNh,
                      'SUMMARY': `Signature will be placed at ${(clampedNy * 100).toFixed(1)}% from top of page ${currentPage}`
                    });
                    console.log('[SignaturePad] ============================');
                    
                    // Send clamped normalized coordinates: nx, ny, nw, nh (all 0-1)
                    // Use actual normalized values based on PDF dimensions
                    onPositionChange(clampedNx, clampedNy, currentPage, actualNw, actualNh);
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Page Selection and Position Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Select Page:
          </label>
          
          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => {
              if (pageNumber > 1) {
                const newPage = pageNumber - 1;
                setPageNumber(newPage);
                setSignaturePosition({ x: 0, y: 0 });
                setHasDragged(false);
                setIsClickDisabled(false);
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                if (onPositionChange) {
                  onPositionChange(0, 0, newPage);
                }
              }
            }}
            disabled={pageNumber <= 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors"
            title="Previous Page"
          >
            ←
          </button>
          
          {/* Page Number Input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageNumber}
              onChange={(e) => {
                let page = parseInt(e.target.value) || 1;
                // Clamp to valid range
                page = Math.max(1, Math.min(page, totalPages));
                console.log('[SignaturePad] Page number input changed to:', page, 'Current position:', signaturePosition, 'Current pageNumber state:', pageNumber);
                
                // Reset position when page changes - user needs to place signature on new page
                setSignaturePosition({ x: 0, y: 0 });
                setPageNumber(page);
                setHasDragged(false);
                setIsClickDisabled(false);
                
                // Clear any pending timeouts
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                
                // Always notify about page change - this ensures page number is updated
                // Use the new page value directly, not the state (which might not be updated yet)
                if (onPositionChange) {
                  console.log('[SignaturePad] Notifying page change to:', page);
                  onPositionChange(0, 0, page); // Reset position, but update page number
                }
              }}
              className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center font-medium"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              / {totalPages}
            </span>
          </div>
          
          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => {
              if (pageNumber < totalPages) {
                const newPage = pageNumber + 1;
                setPageNumber(newPage);
                setSignaturePosition({ x: 0, y: 0 });
                setHasDragged(false);
                setIsClickDisabled(false);
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                if (onPositionChange) {
                  onPositionChange(0, 0, newPage);
                }
              }
            }}
            disabled={pageNumber >= totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors"
            title="Next Page"
          >
            →
          </button>
          
          {/* Quick Jump Dropdown for Large PDFs */}
          {totalPages > 10 && (
            <select
              value={pageNumber}
              onChange={(e) => {
                const newPage = parseInt(e.target.value) || 1;
                setPageNumber(newPage);
                setSignaturePosition({ x: 0, y: 0 });
                setHasDragged(false);
                setIsClickDisabled(false);
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                  clickTimeoutRef.current = null;
                }
                if (onPositionChange) {
                  onPositionChange(0, 0, newPage);
                }
              }}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <option key={page} value={page}>
                  Page {page}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Page Info */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Page {pageNumber} of {totalPages}</span>
          {signaturePosition.x > 0 && signaturePosition.y > 0 && (
            <>
              <span>•</span>
              <span>Position: X: {Math.round(signaturePosition.x)}, Y: {Math.round(signaturePosition.y)}</span>
            </>
          )}
        </div>
        
        {/* Instruction */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
          💡 <strong>Tip:</strong> Select any page above, then click anywhere on the PDF preview to place your signature at that position. You can drag to reposition.
        </div>
      </div>
    </div>
  );
};

