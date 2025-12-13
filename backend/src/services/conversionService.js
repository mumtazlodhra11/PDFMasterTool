"use strict";

import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);

// Try multiple possible LibreOffice binary names
const LIBREOFFICE_BIN = process.env.LIBREOFFICE_BIN || (() => {
  // Common paths for LibreOffice
  const possibleBins = ["soffice", "libreoffice", "/usr/bin/soffice", "/usr/bin/libreoffice"];
  return possibleBins[0]; // Default to soffice, will verify in code
})();
const TEMP_ROOT = process.env.TEMP_ROOT || path.join(os.tmpdir(), "converter");

const ROUTE_CONFIG = {
  "pdf-to-word": { target: "docx", timeout: 60000 }, // Optimized: 60s for faster processing
  "word-to-pdf": { target: "pdf", timeout: 30000 }, // Optimized: 30s for faster processing
  "pdf-to-ppt": { target: "pptx", timeout: 60000 }, // Optimized: 60s for faster processing
  "ppt-to-pdf": { target: "pdf", timeout: 30000 }, // Optimized: 30s for faster processing
  "pdf-to-excel": { target: "xlsx", timeout: 60000 }, // Optimized: 60s for faster processing
  "excel-to-pdf": { target: "pdf", timeout: 30000 }, // Optimized: 30s for faster processing
  "html-to-pdf": { target: "pdf", timeout: 30000 }, // Optimized: 30s for faster processing
  "htm-to-pdf": { target: "pdf", timeout: 30000 }, // Optimized: 30s for faster processing
};

async function createWorkingDir() {
  const dirname = path.join(TEMP_ROOT, randomUUID());
  await fs.mkdir(dirname, { recursive: true });
  return dirname;
}

async function cleanupDir(dirname) {
  try {
    await fs.rm(dirname, { recursive: true, force: true });
  } catch (error) {
    console.warn("Failed to cleanup temp dir", dirname, error);
  }
}

async function runLibreOffice(inputPath, outputDir, targetFormat, timeout = 120000, routeKey = null) {
  // Use absolute paths
  const absInputPath = path.resolve(inputPath);
  const absOutputDir = path.resolve(outputDir);
  
  // Verify input file exists
  try {
    await fs.access(absInputPath);
    const inputStats = await fs.stat(absInputPath);
    console.log(`Input file exists: ${absInputPath} (${inputStats.size} bytes)`);
  } catch (error) {
    throw new Error(`Input file not found: ${absInputPath}. Error: ${error.message}`);
  }

  // Build conversion format with filter name and options for better compatibility
  let convertFormat = targetFormat;
  let additionalEnvVars = {};
  
  // Use specific filters with options for better conversion quality
  if (routeKey === 'excel-to-pdf' && targetFormat === 'pdf') {
    // Excel to PDF: Use SinglePageSheets=true to fit each sheet on one page
    // This prevents charts from being split across pages
    convertFormat = 'pdf:calc_pdf_Export:{"SinglePageSheets":true,"ScaleToPagesX":1,"ScaleToPagesY":1}';
    console.log('Using Excel PDF export with SinglePageSheets=true (prevents chart splitting)');
  } else if (routeKey === 'word-to-pdf' && targetFormat === 'pdf') {
    // Word to PDF: Use writer filter explicitly
    convertFormat = 'pdf:writer_pdf_Export';
    console.log('Using Word-specific PDF export filter (writer_pdf_Export)');
  } else if (routeKey === 'ppt-to-pdf' && targetFormat === 'pdf') {
    // PPT to PDF: Use impress filter explicitly
    convertFormat = 'pdf:impress_pdf_Export';
    console.log('Using PPT-specific PDF export filter (impress_pdf_Export)');
  } else if ((routeKey === 'html-to-pdf' || routeKey === 'htm-to-pdf') && targetFormat === 'pdf') {
    // HTML to PDF: Use writer filter (LibreOffice Writer can open HTML files)
    convertFormat = 'pdf:writer_pdf_Export';
    console.log('Using Writer PDF export filter for HTML to PDF conversion');
  }

  const args = [
    "--headless",
    "--invisible",
    "--nodefault",
    "--norestore",
    "--nofirststartwizard",
    "--nolockcheck",
    "--nologo",
    "--convert-to",
    convertFormat,
    "--outdir",
    absOutputDir,
    absInputPath,
  ];

  console.log(`Running LibreOffice: ${LIBREOFFICE_BIN} ${args.join(" ")}`);
  console.log(`Absolute Input: ${absInputPath}, Absolute Output dir: ${absOutputDir}, Format: ${targetFormat}`);

  // Find working LibreOffice binary
  let workingBin = LIBREOFFICE_BIN;
  const possibleBins = [
    LIBREOFFICE_BIN,
    "soffice",
    "libreoffice",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
  ];
  
  let foundBin = false;
  for (const bin of possibleBins) {
    try {
      await execFileAsync(bin, ["--version"], { timeout: 5000 });
      workingBin = bin;
      foundBin = true;
      console.log(`Using LibreOffice binary: ${workingBin}`);
      break;
    } catch (error) {
      // Try next binary
      continue;
    }
  }
  
  if (!foundBin) {
    throw new Error(`LibreOffice not found. Tried: ${possibleBins.join(", ")}`);
  }

  try {
    // For Excel to PDF, use Python script with UNO API to properly set page layout
    // This ensures: A4 Landscape, PrintArea detection, FitToPagesWide=1, FitToPagesTall=1
    if (routeKey === 'excel-to-pdf' && targetFormat === 'pdf') {
      try {
        const pythonScript = path.join(__dirname, '..', 'utils', 'excelToPdfWithPageSetup.py');
        
        // Check if script exists
        const scriptExists = await fs.access(pythonScript).then(() => true).catch(() => false);
        
        if (scriptExists) {
          const expectedOutputPath = path.join(absOutputDir, path.parse(absInputPath).name + '.pdf');
          console.log('Using Python script with UNO API for Excel to PDF conversion...');
          console.log(`Input: ${absInputPath}, Output: ${expectedOutputPath}`);
          
          const pythonArgs = [pythonScript, absInputPath, expectedOutputPath];
          const pythonResult = await execFileAsync('python3', pythonArgs, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: timeout,
            env: {
              ...process.env,
              HOME: absOutputDir,
              SAL_USE_VCLPLUGIN: 'headless',
            },
          });
          
          if (pythonResult.stderr) {
            console.log('Python script stderr:', pythonResult.stderr);
          }
          
          console.log('Python script completed');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Check if output was created
          const filesAfter = await fs.readdir(absOutputDir);
          const pdfFile = filesAfter.find(f => f.endsWith('.pdf') && f !== path.basename(absInputPath));
          if (pdfFile) {
            const pdfPath = path.join(absOutputDir, pdfFile);
            const fileStats = await fs.stat(pdfPath);
            if (fileStats.size > 0) {
              console.log(`Python script created PDF: ${pdfFile} (${fileStats.size} bytes)`);
              return; // Success
            }
          }
          console.log('Python script did not create valid PDF, falling back to soffice');
        }
      } catch (pythonError) {
        console.log('Python script failed, using soffice directly:', pythonError.message);
        if (pythonError.stderr) {
          console.log('Python script stderr:', pythonError.stderr);
        }
      }
    }
    
    // List files before conversion
    const filesBefore = await fs.readdir(absOutputDir);
    console.log(`Files in output dir before conversion: ${filesBefore.join(", ")}`);

    const { stdout, stderr } = await execFileAsync(workingBin, args, {
      maxBuffer: 1024 * 1024 * 50, // 50MB stdout/stderr
      timeout: timeout,
      cwd: absOutputDir, // Set working directory
      env: {
        ...process.env,
        HOME: absOutputDir, // Set HOME to output dir to avoid permission issues
        SAL_USE_VCLPLUGIN: 'headless',
        OOO_DISABLE_RECOVERY: '1',
        UNO_DISABLE_ENV: 'true',
        ...additionalEnvVars, // Add any route-specific environment variables
      },
    });
    
    if (stdout) console.log("LibreOffice stdout:", stdout);
    if (stderr) {
      // Log ALL stderr for debugging (don't filter)
      console.log("LibreOffice stderr (full):", stderr);
      const filteredStderr = stderr
        .split("\n")
        .filter(line => 
          !line.includes("javaldx") && 
          !line.includes("fontconfig") &&
          !line.includes("Gtk-WARNING") &&
          line.trim().length > 0
        )
        .join("\n");
      if (filteredStderr) {
        console.warn("LibreOffice stderr (filtered):", filteredStderr);
      }
    }
    
    // Quick check for output file (optimized - single check instead of loop)
    await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 5s to 0.5s
    const filesAfter = await fs.readdir(absOutputDir);
    console.log(`Files in output dir after conversion: ${filesAfter.join(", ")}`);
    
    console.log("LibreOffice command completed successfully");
  } catch (error) {
    console.error("LibreOffice execution error:", error);
    console.error("Error details:", {
      code: error.code,
      signal: error.signal,
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    });
    
    // List files in output dir even on error
    try {
      const filesOnError = await fs.readdir(absOutputDir);
      console.error(`Files in output dir on error: ${filesOnError.join(", ")}`);
    } catch (listError) {
      console.error(`Could not list output dir: ${listError.message}`);
    }
    
    if (error.code === "ETIMEDOUT") {
      throw new Error(`LibreOffice conversion timed out after ${timeout}ms`);
    }
    if (error.code === "ENOENT") {
      throw new Error(`LibreOffice not found. Please ensure LibreOffice is installed and ${LIBREOFFICE_BIN} is in PATH`);
    }
    throw new Error(`LibreOffice conversion failed: ${error.message}. Stderr: ${error.stderr || "none"}`);
  }
}

async function convertWithLibreOffice(buffer, originalName, routeKey) {
  const config = ROUTE_CONFIG[routeKey];
  if (!config) {
    throw new Error(`Unsupported conversion route: ${routeKey}`);
  }

  const workingDir = await createWorkingDir();
  const safeOriginal = path.basename(originalName);
  const inputPath = path.join(workingDir, safeOriginal);
  const targetFormat = config.target;
  const expectedExtension = targetFormat.split(":")[0];
  const inputBaseName = path.parse(safeOriginal).name;
  const expectedOutputName = `${inputBaseName}.${expectedExtension}`;
  const expectedOutputPath = path.join(workingDir, expectedOutputName);
  const timeout = config.timeout || 120000;

  try {
    // Write input file
    await fs.writeFile(inputPath, buffer);
    console.log(`Input file written: ${inputPath} (${buffer.length} bytes)`);

    // List files before conversion
    const filesBefore = await fs.readdir(workingDir);
    console.log(`Files before conversion: ${filesBefore.join(", ")}`);

    // Run LibreOffice conversion (pass routeKey for format-specific options)
    await runLibreOffice(inputPath, workingDir, targetFormat, timeout, routeKey);

    // Optimized: Single file check (removed duplicate retry logic)
    await new Promise((resolve) => setTimeout(resolve, 500)); // Brief wait for file system
    const filesAfter = await fs.readdir(workingDir);
    console.log(`Files after conversion: ${filesAfter.join(", ")}`);

    // Find output file - check expected name first, then search by extension
    let outputPath = expectedOutputPath;
    let outputFileName = expectedOutputName;

    const outputExists = await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (!outputExists) {
      // Try to find file with expected extension
      const outputFile = filesAfter.find(
        (file) =>
          file !== safeOriginal &&
          path.extname(file).toLowerCase() === `.${expectedExtension}`.toLowerCase()
      );

      if (outputFile) {
        outputPath = path.join(workingDir, outputFile);
        outputFileName = outputFile;
        console.log(`Found output file: ${outputFile}`);
      } else {
        // List all files for debugging
        const fileDetails = await Promise.all(
          filesAfter.map(async (f) => {
            try {
              const stat = await fs.stat(path.join(workingDir, f));
              return `${f} (${stat.size} bytes)`;
            } catch {
              return f;
            }
          })
        );
        
        throw new Error(
          `LibreOffice did not produce an output file.\n` +
          `Expected: ${expectedOutputName} (format: ${expectedExtension})\n` +
          `Input file: ${safeOriginal}\n` +
          `Files found: ${fileDetails.join(", ") || "none"}`
        );
      }
    }

    const outputBuffer = await fs.readFile(outputPath);
    const stats = await fs.stat(outputPath);

    if (stats.size === 0) {
      throw new Error("LibreOffice produced an empty output file");
    }

    // Validate PDF file integrity
    if (expectedExtension === 'pdf') {
      const pdfHeader = outputBuffer.slice(0, 4).toString('ascii');
      const pdfFooter = outputBuffer.slice(-5).toString('ascii');
      
      if (pdfHeader !== '%PDF') {
        throw new Error(`Invalid PDF file: missing PDF header. Got: ${pdfHeader}`);
      }
      
      if (!pdfFooter.includes('%%EOF')) {
        console.warn(`PDF file might be incomplete: missing EOF marker. Footer: ${pdfFooter}`);
      }
      
      // Check PDF file size is reasonable (at least 1KB for a valid PDF)
      if (stats.size < 1024) {
        console.warn(`PDF file is very small (${stats.size} bytes) - might be incomplete`);
      }
      
      console.log(`PDF validation: Header=${pdfHeader}, Size=${stats.size} bytes, Footer ends with EOF=${pdfFooter.includes('%%EOF')}`);
    }

    console.log(`Conversion successful: ${outputFileName} (${stats.size} bytes)`);
    
    // Convert to base64
    const base64Data = outputBuffer.toString("base64");
    const base64Size = base64Data.length;
    console.log(`Base64 encoded size: ${base64Size} bytes (${(base64Size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Verify base64 encoding is complete
    const expectedBase64Size = Math.ceil(stats.size * 4 / 3);
    if (base64Size < expectedBase64Size * 0.9) {
      console.warn(`Base64 size (${base64Size}) is significantly smaller than expected (${expectedBase64Size}) - might be truncated`);
    }

    return {
      filename: outputFileName,
      mimetype: mimeFromExtension(outputFileName),
      size: stats.size,
      base64: base64Data,
    };
  } finally {
    await cleanupDir(workingDir);
  }
}

function mimeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".html":
    case ".htm":
      return "text/html";
    default:
      return "application/octet-stream";
  }
}

// Python backend URL for PDF conversions
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "https://pdf-converter-python-607448904463.us-central1.run.app";

// Routes that should use Python backend (PDF conversions)
const PYTHON_ROUTES = ["pdf-to-word", "pdf-to-ppt", "pdf-to-excel"];

function getMimeTypeForFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".html": "text/html",
    ".htm": "text/html",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function callPythonBackend(buffer, originalName, routeKey) {
  // Use global FormData (Node.js 18+)
  const formData = new globalThis.FormData();
  const mimeType = getMimeTypeForFile(originalName);
  
  // Create Blob from buffer and append to FormData
  const blob = new globalThis.Blob([buffer], { type: mimeType });
  formData.append("file", blob, originalName);

  const endpointMap = {
    "pdf-to-word": "pdf-to-word",
    "pdf-to-ppt": "pdf-to-ppt",
    "pdf-to-excel": "pdf-to-excel",
  };

  const endpoint = endpointMap[routeKey];
  if (!endpoint) {
    throw new Error(`No Python endpoint mapping for ${routeKey}`);
  }

  console.log(`Calling Python backend: ${PYTHON_BACKEND_URL}/convert/${endpoint}`);
  console.log(`File: ${originalName}, Size: ${buffer.length} bytes, MIME: ${mimeType}`);

  try {
    // undici FormData automatically sets Content-Type with boundary
    const response = await fetch(`${PYTHON_BACKEND_URL}/convert/${endpoint}`, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    console.log(`Python backend response status: ${response.status}`);
    console.log(`Python backend response: ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      throw new Error(`Python backend failed: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    if (!result.success) {
      throw new Error(result.error || result.detail || "Python conversion failed");
    }

    return {
      filename: result.filename,
      mimetype: result.format || "application/octet-stream",
      size: result.size,
      base64: result.file,
    };
  } catch (error) {
    console.error("Python backend call error:", error);
    throw error;
  }
}

async function processRequest(req, res, routeKey) {
  try {
    // Only handle Office to PDF conversions here
    // PDF conversions are handled directly by Python backend from frontend
    if (PYTHON_ROUTES.includes(routeKey)) {
      return res.status(400).json({
        success: false,
        error: "This endpoint should be called directly on Python backend",
        detail: "PDF conversions are handled by Python backend. Frontend should call Python backend directly.",
      });
    }
    
    // Use LibreOffice for Office to PDF (works well)
    console.log(`Using LibreOffice for ${routeKey}`);
    const result = await convertWithLibreOffice(req.file.buffer, req.file.originalname, routeKey);

    const responseData = {
      success: true,
      output: {
        filename: result.filename,
        mimetype: result.mimetype,
        size: result.size,
        data: result.base64,
      },
      original: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    };
    
    const responseSize = JSON.stringify(responseData).length;
    console.log(`Response size: ${responseSize} bytes (${(responseSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Base64 data length in response: ${result.base64.length} characters`);
    
    return res.json(responseData);
  } catch (error) {
    console.error(`Conversion failed for ${routeKey}:`, error);
    console.error("Error stack:", error.stack);
    
    // Provide more detailed error message
    let errorDetail = error.message;
    if (error.message.includes("LibreOffice did not produce")) {
      errorDetail = `Conversion failed: ${error.message}. This usually means:\n` +
        `1. LibreOffice could not process the input file\n` +
        `2. The file format is not supported\n` +
        `3. The file is corrupted or password-protected\n` +
        `4. LibreOffice installation is incomplete\n` +
        `Please check the server logs for more details.`;
    }
    
    return res.status(500).json({
      success: false,
      error: "Conversion failed",
      detail: errorDetail,
      route: routeKey,
    });
  }
}

export function handlePdfToWord(req, res) {
  return processRequest(req, res, "pdf-to-word");
}

export function handleWordToPdf(req, res) {
  return processRequest(req, res, "word-to-pdf");
}

export function handlePdfToPpt(req, res) {
  return processRequest(req, res, "pdf-to-ppt");
}

export function handlePptToPdf(req, res) {
  return processRequest(req, res, "ppt-to-pdf");
}

export function handlePdfToExcel(req, res) {
  return processRequest(req, res, "pdf-to-excel");
}

export function handleExcelToPdf(req, res) {
  return processRequest(req, res, "excel-to-pdf");
}

export function handleHtmlToPdf(req, res) {
  return processRequest(req, res, "html-to-pdf");
}

export function handleHtmToPdf(req, res) {
  return processRequest(req, res, "htm-to-pdf");
}

