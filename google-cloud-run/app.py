"""
PDF Master Tool - Cloud Run Backend
FastAPI service with LibreOffice conversions
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import tempfile
import base64
import shutil
from pathlib import Path

app = FastAPI(title="PDF Master Tool API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PDF Master Tool",
        "version": "1.0.0",
        "endpoints": [
            "/convert/pdf-to-word",
            "/convert/pdf-to-excel",
            "/convert/pdf-to-ppt",
            "/convert/word-to-pdf",
            "/convert/ppt-to-pdf"
        ]
    }

@app.get("/health")
async def health():
    """Health check for Cloud Run"""
    return {"status": "ok"}

def convert_with_libreoffice(input_path: str, output_format: str, output_dir: str) -> str:
    """
    Convert document using LibreOffice
    
    Args:
        input_path: Path to input file
        output_format: Target format (docx, xlsx, pptx, pdf)
        output_dir: Directory for output file
        
    Returns:
        Path to converted file
    """
    try:
        # Run LibreOffice conversion
        cmd = [
            'libreoffice',
            '--headless',
            '--convert-to', output_format,
            '--outdir', output_dir,
            input_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice error: {result.stderr}")
        
        # Find the converted file
        input_name = Path(input_path).stem
        output_file = Path(output_dir) / f"{input_name}.{output_format}"
        
        if not output_file.exists():
            raise Exception(f"Converted file not found: {output_file}")
        
        return str(output_file)
        
    except subprocess.TimeoutExpired:
        raise Exception("Conversion timeout - file too large or complex")
    except Exception as e:
        raise Exception(f"Conversion failed: {str(e)}")

@app.post("/convert/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    """Convert PDF to Word (DOCX)"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded file
            input_path = os.path.join(temp_dir, "input.pdf")
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Convert to DOCX
            output_path = convert_with_libreoffice(input_path, "docx", temp_dir)
            
            # Read and encode output
            with open(output_path, "rb") as f:
                output_data = f.read()
                output_base64 = base64.b64encode(output_data).decode()
            
            return JSONResponse({
                "success": True,
                "file": output_base64,
                "filename": file.filename.replace('.pdf', '.docx'),
                "size": len(output_data)
            })
            
        except Exception as e:
            raise HTTPException(500, f"Conversion failed: {str(e)}")

@app.post("/convert/pdf-to-excel")
async def pdf_to_excel(file: UploadFile = File(...)):
    """Convert PDF to Excel (XLSX)"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded file
            input_path = os.path.join(temp_dir, "input.pdf")
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Convert to XLSX
            output_path = convert_with_libreoffice(input_path, "xlsx", temp_dir)
            
            # Read and encode output
            with open(output_path, "rb") as f:
                output_data = f.read()
                output_base64 = base64.b64encode(output_data).decode()
            
            return JSONResponse({
                "success": True,
                "file": output_base64,
                "filename": file.filename.replace('.pdf', '.xlsx'),
                "size": len(output_data)
            })
            
        except Exception as e:
            raise HTTPException(500, f"Conversion failed: {str(e)}")

@app.post("/convert/pdf-to-ppt")
async def pdf_to_ppt(file: UploadFile = File(...)):
    """Convert PDF to PowerPoint (PPTX)"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded file
            input_path = os.path.join(temp_dir, "input.pdf")
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Convert to PPTX
            output_path = convert_with_libreoffice(input_path, "pptx", temp_dir)
            
            # Read and encode output
            with open(output_path, "rb") as f:
                output_data = f.read()
                output_base64 = base64.b64encode(output_data).decode()
            
            return JSONResponse({
                "success": True,
                "file": output_base64,
                "filename": file.filename.replace('.pdf', '.pptx'),
                "size": len(output_data)
            })
            
        except Exception as e:
            raise HTTPException(500, f"Conversion failed: {str(e)}")

@app.post("/convert/word-to-pdf")
async def word_to_pdf(file: UploadFile = File(...)):
    """Convert Word to PDF"""
    
    if not file.filename.lower().endswith(('.docx', '.doc')):
        raise HTTPException(400, "Only Word files are allowed")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded file
            input_path = os.path.join(temp_dir, file.filename)
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Convert to PDF
            output_path = convert_with_libreoffice(input_path, "pdf", temp_dir)
            
            # Read and encode output
            with open(output_path, "rb") as f:
                output_data = f.read()
                output_base64 = base64.b64encode(output_data).decode()
            
            return JSONResponse({
                "success": True,
                "file": output_base64,
                "filename": file.filename.rsplit('.', 1)[0] + '.pdf',
                "size": len(output_data)
            })
            
        except Exception as e:
            raise HTTPException(500, f"Conversion failed: {str(e)}")

@app.post("/convert/ppt-to-pdf")
async def ppt_to_pdf(file: UploadFile = File(...)):
    """Convert PowerPoint to PDF"""
    
    if not file.filename.lower().endswith(('.pptx', '.ppt')):
        raise HTTPException(400, "Only PowerPoint files are allowed")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded file
            input_path = os.path.join(temp_dir, file.filename)
            with open(input_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Convert to PDF
            output_path = convert_with_libreoffice(input_path, "pdf", temp_dir)
            
            # Read and encode output
            with open(output_path, "rb") as f:
                output_data = f.read()
                output_base64 = base64.b64encode(output_data).decode()
            
            return JSONResponse({
                "success": True,
                "file": output_base64,
                "filename": file.filename.rsplit('.', 1)[0] + '.pdf',
                "size": len(output_data)
            })
            
        except Exception as e:
            raise HTTPException(500, f"Conversion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)


