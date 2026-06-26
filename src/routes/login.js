'use strict';

const express = require('express');
const router = express.Router();

// The ONLY credentials this site knows. Fake, seeded, documented in the UI.
// Never a real secret. (CLAUDE.md: seed one demo user.)
const DEMO_USER = 'student';
const DEMO_PASS = 'packets123';

// GET /login — render the login form.
router.get('/login', (req, res) => {
  res.page('login', {
    title: 'Login — Wireshark Lab',
    error: null,
    welcome: req.query.welcome === '1',
    demoUser: DEMO_USER,
    demoPass: DEMO_PASS,
  });
});

// POST /login — urlencoded credentials arrive in the request body.
// DELIBERATELY INSECURE: plaintext comparison, no hashing, no CSRF token, no
// rate limiting. Over plain HTTP the body is fully readable — that is the
// lesson (Wireshark → Follow HTTP Stream shows username + password).
router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === DEMO_USER && password === DEMO_PASS) {
    // Writing to the session is what makes express-session emit Set-Cookie
    // (lab.sid). Every later request then carries the Cookie header — the
    // session-replay / hijacking lesson.
    req.session.user = username;
    return res.redirect('/login?welcome=1');
  }

  res.status(401).page('login', {
    title: 'Login — Wireshark Lab',
    error: 'Invalid credentials. Use the demo user shown below.',
    welcome: false,
    demoUser: DEMO_USER,
    demoPass: DEMO_PASS,
  });
});

// POST /logout — clear the session so the lesson can be repeated.
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
