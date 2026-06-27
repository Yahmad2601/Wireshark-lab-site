'use strict';

const http = require('http');
const app = require('./app');
const { enforceBindGuard, privateIPv4s } = require('./guard');

// Default to 0.0.0.0 = every IPv4 interface. That single bind covers BOTH
// loopback (127.0.0.1) AND the LAN IP, so the site is reachable locally and
// from other lab devices with no extra flags. The startup guard still refuses
// the wildcard if any interface is public. Override with HOST if you want to
// pin a single address (e.g. HOST=127.0.0.1 for loopback only).
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.HTTP_PORT) || 8080;

// Refuse to start on a public bind address unless --allow-public is passed.
enforceBindGuard(HOST);

// Build the list of URLs this bind is actually reachable at.
function reachableUrls() {
  const wildcard = HOST === '0.0.0.0' || HOST === '::' || HOST === '';
  const hosts = wildcard ? ['127.0.0.1', ...privateIPv4s()] : [HOST];
  return hosts.map((h) => `http://${h}:${PORT}`);
}

http.createServer(app).listen(PORT, HOST, () => {
  console.log('');
  console.log('  Wireshark Lab Site — PLAIN HTTP (everything is visible on the wire)');
  reachableUrls().forEach((u) => console.log('  ' + u));
  console.log('  ⚠ Deliberately insecure. Lab/localhost only. Use fake credentials.');
  console.log('');
});
