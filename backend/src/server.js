"use strict";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import conversionRouter from "./routes/conversionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_CANDIDATES = [
  path.join(__dirname, "..", ".env.local"),
  path.join(__dirname, "..", ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
];

ENV_CANDIDATES.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});
dotenv.config(); // fall back to default lookup

const app = express();

// Config
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : "*",
    credentials: false,
  })
);
app.use(morgan("combined"));
// Increase JSON limit to handle large base64 responses (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer setup (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "52428800", 10), // default 50MB
  },
});

// Routes
app.use("/convert", upload.single("file"), conversionRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/convert/word-to-pdf",
      "/convert/pdf-to-word",
      "/convert/ppt-to-pdf",
      "/convert/pdf-to-ppt",
      "/convert/excel-to-pdf",
      "/convert/pdf-to-excel",
      "/convert/html-to-pdf",
      "/convert/htm-to-pdf",
    ],
  });
});

// Fallback JSON 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Converter backend listening on port ${PORT}`);
  });
}

export default app;

