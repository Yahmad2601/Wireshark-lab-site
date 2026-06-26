'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { enforceBindGuard } = require('./guard');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.HTTPS_PORT) || 8443;

const CERT_DIR = path.join(__dirname, '..', 'certs');
const KEY = path.join(CERT_DIR, 'key.pem');
const CERT = path.join(CERT_DIR, 'cert.pem');

// Same private-IP guard as the HTTP server.
enforceBindGuard(HOST);

if (!fs.existsSync(KEY) || !fs.existsSync(CERT)) {
  console.error('');
  console.error('  Missing cert/key. Generate them first:');
  console.error('    npm run gen-cert');
  console.error(`  (expected ${KEY} and ${CERT})`);
  console.error('');
  process.exit(1);
}

const options = {
  key: fs.readFileSync(KEY),
  cert: fs.readFileSync(CERT),
};

// SAME app as server-http.js — identical routes. The only difference on the
// wire is TLS. That's what makes the HTTP-vs-HTTPS capture contrast valid:
// capture /login on :8080 (everything visible) vs :8443 (TLS Application Data,
// ciphertext).
https.createServer(options, app).listen(PORT, HOST, () => {
  console.log('');
  console.log('  Wireshark Lab Site — HTTPS twin (self-signed; browser will warn)');
  console.log(`  https://${HOST}:${PORT}`);
  console.log('  Same routes as :8080 — capture the same action and compare in Wireshark.');
  console.log('  In the capture you will see only TLS Application Data, not the cleartext.');
  console.log('');
});
