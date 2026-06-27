'use strict';

// Generates a self-signed cert into certs/ for the HTTPS twin (port 8443).
// Self-signed is fine: this is a lab. Browsers will warn — that's expected,
// click through. Run via: npm run gen-cert
//
// Equivalent raw openssl one-liner (also documented in README.md):
//   openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
//     -keyout certs/key.pem -out certs/cert.pem \
//     -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { privateIPv4s } = require('./guard');

const CERT_DIR = path.join(__dirname, '..', 'certs');
const KEY = path.join(CERT_DIR, 'key.pem');
const CERT = path.join(CERT_DIR, 'cert.pem');

fs.mkdirSync(CERT_DIR, { recursive: true });

// Add every private IPv4 on this machine to the cert's SAN, so the HTTPS twin
// validates when reached over the LAN (e.g. https://192.168.1.5:8443) and not
// just over localhost. Re-run gen-cert if your LAN IP changes.
const sanEntries = ['DNS:localhost', 'IP:127.0.0.1'];
for (const ip of privateIPv4s()) sanEntries.push('IP:' + ip);
const san = sanEntries.join(',');

console.log('  Certificate SAN: ' + san);

const args = [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '365',
  '-keyout', KEY, '-out', CERT,
  '-subj', '/CN=localhost',
  '-addext', 'subjectAltName=' + san,
];

// Prefer openssl on PATH; otherwise fall back to common Windows locations
// (Git for Windows ships it but often isn't on the PATH).
function resolveOpenssl() {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
    'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
  ];
  for (const c of candidates) {
    if (c !== 'openssl' && !fs.existsSync(c)) continue;
    const probe = spawnSync(c, ['version'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return c;
  }
  return null;
}

const opensslBin = resolveOpenssl();
const r = opensslBin
  ? spawnSync(opensslBin, args, { stdio: 'inherit' })
  : { error: { code: 'ENOENT' } };

if (r.error && r.error.code === 'ENOENT') {
  console.error('');
  console.error('  openssl was not found on your PATH.');
  console.error('  Install it (Git for Windows ships it, or use WSL/choco), then');
  console.error('  re-run `npm run gen-cert`. Or run the openssl command from README.md.');
  console.error('');
  process.exit(1);
}
if (r.status !== 0) {
  console.error('\n  openssl failed (exit ' + r.status + ').');
  process.exit(r.status || 1);
}

console.log('\n  Wrote ' + KEY + '\n  Wrote ' + CERT);
console.log('  Now run: npm run start:https   (https://127.0.0.1:8443)\n');
