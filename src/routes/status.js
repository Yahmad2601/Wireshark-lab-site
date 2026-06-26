'use strict';

const express = require('express');
const router = express.Router();

// Three small routes, each producing a distinct status code on the wire so
// students learn to read the HTTP status line in a capture.

// GET /broken — a 404. Explicit so the lesson is deterministic (rather than
// relying on a missing route). Plain-text body keeps the response easy to read.
router.get('/broken', (req, res) => {
  res
    .status(404)
    .type('text/plain')
    .send('404 Not Found — this resource does not exist (on purpose).');
});

// GET /redirect — a redirect CHAIN: 302 -> /redirect/step2 -> 302 -> final 200.
// Students follow the Location headers hop by hop in the capture.
router.get('/redirect', (req, res) => {
  res.redirect(302, '/redirect/step2');
});

router.get('/redirect/step2', (req, res) => {
  res.redirect(302, '/redirect/done');
});

router.get('/redirect/done', (req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send('Arrived. You followed two 302 hops to get here. Check the Location headers.');
});

// GET /error — a 500. We throw so Express' error handler produces the 500,
// mirroring how a real unhandled error looks on the wire.
router.get('/error', (req, res) => {
  throw new Error('Deliberate server error for the 500 lesson.');
});

module.exports = router;
