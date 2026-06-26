'use strict';

const express = require('express');
const router = express.Router();

// GET /search?q=...  — a classic GET form. Because the method is GET, every
// field is appended to the URL as a query string. DELIBERATELY: the form also
// carries a second "sensitive" field so students see private data end up in
// the request line itself — which is logged, cached, and saved in history.
// The lesson: GET puts everything in the URL, in cleartext, in the GET line.
router.get('/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const secret = typeof req.query.secret === 'string' ? req.query.secret : '';

  // Fake, canned "results" — no real backend. Just enough to echo the query.
  const results = q
    ? [
        `Result for "${q}" — packet #1`,
        `Result for "${q}" — packet #2`,
        `Result for "${q}" — packet #3`,
      ]
    : [];

  res.page('search', {
    title: 'Search — Wireshark Lab',
    q,
    secret,
    results,
  });
});

module.exports = router;
