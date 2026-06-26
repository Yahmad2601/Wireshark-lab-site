'use strict';

const express = require('express');
const router = express.Router();

// GET /api/data — returns JSON, not HTML. The response carries
// Content-Type: application/json, which Wireshark dissects as a JSON object you
// can expand field-by-field. DELIBERATELY: the payload includes who the session
// thinks you are (echoing the cookie) so students connect the JSON body to the
// Cookie header on the request.
router.get('/api/data', (req, res) => {
  const payload = {
    ok: true,
    service: 'wireshark-lab',
    you: (req.session && req.session.user) || 'anonymous',
    serverTime: new Date().toISOString(),
    note: 'Plain JSON over HTTP — fully readable in the capture.',
    packets: [
      { no: 1, proto: 'TCP', info: 'SYN' },
      { no: 2, proto: 'TCP', info: 'SYN, ACK' },
      { no: 3, proto: 'TCP', info: 'ACK' },
    ],
  };

  // express' res.json sets Content-Type: application/json; charset=utf-8.
  res.json(payload);
});

module.exports = router;
