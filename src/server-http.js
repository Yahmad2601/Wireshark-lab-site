'use strict';

const http = require('http');
const app = require('./app');
const { enforceBindGuard } = require('./guard');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.HTTP_PORT) || 8080;

// Refuse to start on a public bind address unless --allow-public is passed.
enforceBindGuard(HOST);

http.createServer(app).listen(PORT, HOST, () => {
  console.log('');
  console.log('  Wireshark Lab Site — PLAIN HTTP (everything is visible on the wire)');
  console.log(`  http://${HOST}:${PORT}`);
  console.log('  ⚠ Deliberately insecure. Lab/localhost only. Use fake credentials.');
  console.log('');
});
