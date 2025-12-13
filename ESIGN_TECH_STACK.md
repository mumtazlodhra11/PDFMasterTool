# eSign PDF Tool - Technology Stack & Current Issue

## Technology Stack

### Backend (Python - Google Cloud Run)
- **Framework**: FastAPI
- **PDF Library**: PyMuPDF (fitz) - Version 1.23.7
- **Image Processing**: PIL/Pillow
- **Deployment**: Google Cloud Run (Containerized)
- **API Endpoint**: `/convert/esign-pdf`
- **Request Format**: multipart/form-data (FormData)

### Frontend (React/TypeScript - Astro)
- **Framework**: Astro + React
- **PDF Rendering**: pdfjs-dist (Mozilla PDF.js)
- **Signature Drawing**: HTML5 Canvas API
- **Signature Component**: Custom `SignaturePad.tsx`
- **HTTP Client**: Native `fetch` API with FormData

## Current Issue

**Problem**: Signature is not appearing at the exact position where user places it on the PDF preview.

### Technical Details

1. **Frontend Coordinate System**:
   - PDF.js renders PDF at scale 1.5x for preview quality
   - Canvas uses top-left origin (Y=0 at top)
   - Mouse coordinates are converted from canvas display size to canvas internal size
   - Then scaled from 1.5x (preview) to 1.0x (PDF) before sending to backend

2. **Backend Coordinate System**:
   - PyMuPDF's `insert_image()` method
   - Currently using top-left origin (Y=0 at top)
   - Receives coordinates in PDF page dimensions (scale 1.0)

3. **Coordinate Flow**:
   ```
   User clicks on PDF preview (scale 1.5x)
   → Mouse event (clientX, clientY)
   → Convert to canvas coordinates (accounting for CSS scaling)
   → Scale down to PDF coordinates (divide by 1.5)
   → Send to backend (x, y, page)
   → Backend uses directly with fitz.Rect(x, y, x+width, y+height)
   ```

### Code Locations

**Frontend**:
- `src/components/SignaturePad.tsx` - Signature drawing and PDF preview
- `src/components/ToolTemplate.tsx` - Tool integration
- `src/utils/awsClient.ts` - API call to backend

**Backend**:
- `google-cloud-run/app.py` - FastAPI endpoint `esign_pdf()` (line ~1689)

### Current Implementation

**Frontend (SignaturePad.tsx)**:
```typescript
// PDF preview rendered at scale 1.5
const viewport = page.getViewport({ scale: 1.5 });

// Coordinate conversion on click
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const canvasX = (e.clientX - rect.left) * scaleX;
const canvasY = (e.clientY - rect.top) * scaleY;

// Convert from preview scale (1.5) to PDF scale (1.0)
const pdfX = canvasX / viewportScale; // viewportScale = 1.5
const pdfY = canvasY / viewportScale;

// Send to backend
onPositionChange(pdfX, pdfY, currentPage);
```

**Backend (app.py)**:
```python
# Receive coordinates (top-left origin)
x = float(x)  # PDF coordinates
y = float(y)  # PDF coordinates

# Create rect (top-left origin)
sig_rect = fitz.Rect(x, y, x + sig_width, y + sig_height)

# Insert image
target_page.insert_image(sig_rect, filename=sig_path, keep_proportion=True)
```

### Potential Issues

1. **Coordinate System Mismatch**: 
   - PyMuPDF might use bottom-left origin (PDF standard) instead of top-left
   - Need to verify: `fitz.Rect(x0, y0, x1, y1)` - is (x0, y0) top-left or bottom-left?

2. **Scaling Issues**:
   - Frontend scales from 1.5x to 1.0x
   - But PDF.js viewport might have different dimensions than actual PDF page

3. **Page Number**:
   - Frontend sends 1-indexed page number
   - Backend converts to 0-indexed for PyMuPDF
   - This part seems to be working correctly

4. **Signature Size**:
   - Signature image is processed and resized
   - Default: 150x60px, max width: 150px
   - Size might affect positioning

### Testing Steps

1. Place signature at a known position (e.g., top-left corner: x=50, y=50)
2. Check browser console logs: `[SignaturePad] Click position`
3. Check backend logs: `[eSign-PDF] COORDINATE CONVERSION TEST`
4. Compare expected vs actual position in final PDF

### Questions for ChatGPT

1. **PyMuPDF Coordinate System**: Does `fitz.Rect(x0, y0, x1, y1)` use top-left or bottom-left origin? What about `page.insert_image(rect, ...)`?

2. **PDF.js Coordinate Conversion**: When rendering PDF at scale 1.5x, how to correctly convert mouse coordinates to PDF coordinates?

3. **Best Practice**: What's the standard way to handle coordinate conversion between PDF.js preview and PyMuPDF insertion?

## Files to Check

- `src/components/SignaturePad.tsx` (lines ~800-840 for coordinate conversion)
- `google-cloud-run/app.py` (lines ~1881-1910 for coordinate handling)
- `src/utils/awsClient.ts` (lines ~141-168 for API call)

## Environment

- Python: 3.8+
- Node.js: Latest LTS
- PyMuPDF: 1.23.7
- pdfjs-dist: Latest
- FastAPI: Latest
- Google Cloud Run: Latest

























