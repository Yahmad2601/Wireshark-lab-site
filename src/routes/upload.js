'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const router = express.Router();

// Files land in uploads/ (gitignored). The point isn't storage — it's that the
// file's bytes travel across the wire inside a multipart/form-data body, so
// Wireshark's "Export Objects → HTTP" can carve the original file back out.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    // Keep the original name (prefixed to avoid collisions). Deliberately no
    // sanitizing beyond basename — this is a teaching toy, not production.
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  },
});
const upload = multer({ storage });

// GET /upload — render the file picker.
router.get('/upload', (req, res) => {
  res.page('upload', { title: 'Upload — Wireshark Lab', uploaded: null });
});

// POST /upload — multer parses the multipart body and writes the part to disk.
router.post('/upload', upload.single('file'), (req, res) => {
  const f = req.file;
  res.page('upload', {
    title: 'Upload — Wireshark Lab',
    uploaded: f
      ? {
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          note: req.body.note || '',
        }
      : null,
  });
});

module.exports = router;
