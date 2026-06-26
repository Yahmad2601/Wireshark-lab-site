'use strict';

const express = require('express');
const router = express.Router();

// GET /assets-demo — one HTML page that references several local assets (CSS,
// JS, images). Loading it triggers many parallel GETs over kept-alive TCP
// connections — good practice for filtering and for seeing keep-alive / caching
// (304s on reload) in a capture.
router.get('/assets-demo', (req, res) => {
  res.page('assets-demo', { title: 'Assets demo — Wireshark Lab' });
});

module.exports = router;
