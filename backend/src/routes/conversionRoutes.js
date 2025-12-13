"use strict";

import express from "express";
import { ensureFileProvided } from "../utils/validators.js";
import {
  handlePdfToWord,
  handleWordToPdf,
  handlePdfToPpt,
  handlePptToPdf,
  handlePdfToExcel,
  handleExcelToPdf,
  handleHtmlToPdf,
  handleHtmToPdf,
} from "../services/conversionService.js";

const router = express.Router();

// Helper to show usage for GET requests
const showUsage = (req, res) => {
  res.status(405).json({
    error: "Method not allowed",
    message: "This endpoint only accepts POST requests with a file upload",
    usage: "POST /convert/" + req.path.split("/").pop() + " with multipart/form-data containing a 'file' field",
    example: "curl -F 'file=@document.pdf' " + req.protocol + "://" + req.get("host") + req.originalUrl
  });
};

// Define POST routes
router.post("/pdf-to-word", ensureFileProvided, handlePdfToWord);
router.post("/word-to-pdf", ensureFileProvided, handleWordToPdf);
router.post("/pdf-to-ppt", ensureFileProvided, handlePdfToPpt);
router.post("/ppt-to-pdf", ensureFileProvided, handlePptToPdf);
router.post("/pdf-to-excel", ensureFileProvided, handlePdfToExcel);
router.post("/excel-to-pdf", ensureFileProvided, handleExcelToPdf);
router.post("/html-to-pdf", ensureFileProvided, handleHtmlToPdf);
router.post("/htm-to-pdf", ensureFileProvided, handleHtmToPdf);

// Handle GET requests with helpful message
router.get("/pdf-to-word", showUsage);
router.get("/word-to-pdf", showUsage);
router.get("/pdf-to-ppt", showUsage);
router.get("/ppt-to-pdf", showUsage);
router.get("/pdf-to-excel", showUsage);
router.get("/excel-to-pdf", showUsage);
router.get("/html-to-pdf", showUsage);
router.get("/htm-to-pdf", showUsage);

export default router;

