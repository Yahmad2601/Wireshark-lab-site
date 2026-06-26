'use strict';

const express = require('express');
const router = express.Router();

const PLANS = ['Free', 'Student', 'Pro', 'Lab Admin'];

// GET /register — render the multi-field form.
router.get('/register', (req, res) => {
  res.page('register', {
    title: 'Register — Wireshark Lab',
    plans: PLANS,
    submitted: null,
  });
});

// POST /register — many fields of different types all arrive together in one
// application/x-www-form-urlencoded body, e.g.
//   email=a%40b.com&phone=...&plan=Pro&newsletter=on&fullname=...
// DELIBERATELY INSECURE: nothing is validated or stored; we just echo what the
// wire carried. The lesson is the richer urlencoded body shape (key=value pairs
// joined by &, with URL-encoding of @, spaces, etc.).
router.post('/register', (req, res) => {
  const submitted = {
    fullname: req.body.fullname || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    plan: req.body.plan || '',
    // An unchecked checkbox sends NOTHING — a good wire detail to point out.
    newsletter: req.body.newsletter === 'on',
  };

  res.page('register', {
    title: 'Register — Wireshark Lab',
    plans: PLANS,
    submitted,
  });
});

module.exports = router;
