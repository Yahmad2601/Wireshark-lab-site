'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');

const app = express();

const VIEWS_DIR = path.join(__dirname, '..', 'views');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// --- View setup -------------------------------------------------------------
// We render each page view to a string, then wrap it in layout.ejs (which
// carries the persistent INSECURE banner). This keeps a single layout file
// without pulling in an extra layout-engine dependency.
app.set('views', VIEWS_DIR);
app.set('view engine', 'ejs');

// --- Body parsing -----------------------------------------------------------
// urlencoded = the /login, /search, /register lessons. extended:false keeps
// the parsed body shape simple and the wire format classic application/
// x-www-form-urlencoded. (multipart is handled per-route by multer later.)
app.use(express.urlencoded({ extended: false }));

// --- Session ----------------------------------------------------------------
// DELIBERATELY INSECURE: in-memory store, predictable cookie name, no secure
// flag, no httpOnly hardening beyond defaults. The visible Set-Cookie / Cookie
// headers ARE the lesson (session replay / hijacking). Do not harden.
app.use(
  session({
    name: 'lab.sid',
    secret: 'wireshark-lab-not-a-real-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // visible to client-side JS on purpose (teaching)
      secure: false, // sent over plain HTTP on purpose (teaching)
    },
  })
);

// --- Static assets ----------------------------------------------------------
// All assets are local (no CDNs) so captures stay clean.
app.use('/public', express.static(PUBLIC_DIR));

// --- Page render helper -----------------------------------------------------
// res.page('view', data) renders views/<view>.ejs then wraps it in layout.ejs.
app.use((req, res, next) => {
  res.locals.bannerText =
    '⚠ DELIBERATELY INSECURE TEACHING SITE — DO NOT ENTER REAL CREDENTIALS.';
  res.locals.user = (req.session && req.session.user) || null;

  res.page = function page(view, data = {}) {
    const ctx = Object.assign({}, res.locals, data);
    ejs.renderFile(path.join(VIEWS_DIR, `${view}.ejs`), ctx, (err, body) => {
      if (err) return next(err);
      ejs.renderFile(
        path.join(VIEWS_DIR, 'layout.ejs'),
        Object.assign({}, ctx, { body }),
        (err2, html) => {
          if (err2) return next(err2);
          res.send(html);
        }
      );
    });
  };

  next();
});

// --- Routes (mounted one lesson at a time) ----------------------------------
app.get('/', (req, res) => {
  res.page('index', { title: 'Wireshark Lab by Ahmad Yahaya — Lessons' });
});

// /login (GET form, POST cleartext urlencoded creds, sets lab.sid cookie), /logout
app.use('/', require('./routes/login'));

// /search — GET query string lands in the URL (leaks into logs/history)
app.use('/', require('./routes/search'));

// /register — multi-field urlencoded POST body (email, phone, dropdown, checkbox)
app.use('/', require('./routes/register'));

// /upload — multipart/form-data via multer (Export Objects carves the file out)
app.use('/', require('./routes/upload'));

// /api/data — JSON response (Content-Type: application/json dissection)
app.use('/', require('./routes/api'));

// /secret — HTTP Basic Auth (Authorization: Basic is Base64, not encryption)
app.use('/', require('./routes/secret'));

// /broken (404), /redirect (302 chain), /error (500) — status-code lessons
app.use('/', require('./routes/status'));

// /assets-demo — one page pulling several local assets (parallel requests, keep-alive)
app.use('/', require('./routes/assets-demo'));

// --- Error handler ----------------------------------------------------------
// Turns a thrown error (e.g. /error) into a clean 500 with a readable body, so
// the 500 status line is the lesson rather than a noisy stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res
    .status(500)
    .type('text/plain')
    .send(`500 Internal Server Error — ${err.message}`);
});

module.exports = app;
