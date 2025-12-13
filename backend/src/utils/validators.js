"use strict";

export function ensureFileProvided(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file upload (expected field 'file')" });
  }
  return next();
}



