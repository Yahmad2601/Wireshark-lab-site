'use strict';

const express = require('express');
const router = express.Router();

// HTTP Basic Auth credentials. Fake, seeded, shown in the UI. (Distinct from
// the form-login user so students can tell the two lessons apart on the wire.)
const BASIC_USER = 'agent';
const BASIC_PASS = 'base64isnotencryption';

// GET /secret — HTTP Basic Auth. The browser sends
//   Authorization: Basic YWdlbnQ6YmFzZTY0aXNub3RlbmNyeXB0aW9u
// which is just base64("agent:base64isnotencryption"). DELIBERATELY: over plain
// HTTP this header is trivially decodable — the lesson is encoding ≠ encryption.
router.get('/secret', (req, res) => {
  const header = req.headers.authorization || '';

  // Expect "Basic <base64>"
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);

    if (user === BASIC_USER && pass === BASIC_PASS) {
      return res.page('secret', {
        title: 'Secret — Wireshark Lab',
        authed: true,
        encoded,
        decoded,
        basicUser: BASIC_USER,
        basicPass: BASIC_PASS,
      });
    }
  }

  // No / wrong credentials → 401 with the challenge. The browser then prompts
  // and retries with the Authorization header (that retry is what to capture).
  res.set('WWW-Authenticate', 'Basic realm="Wireshark Lab Secret"');
  res.status(401).page('secret', {
    title: 'Secret — Wireshark Lab',
    authed: false,
    encoded: null,
    decoded: null,
    basicUser: BASIC_USER,
    basicPass: BASIC_PASS,
  });
});

module.exports = router;
