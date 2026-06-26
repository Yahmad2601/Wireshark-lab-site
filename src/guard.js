'use strict';

// Startup guard: refuse to run on a public bind address unless explicitly
// overridden. This site is deliberately insecure and must never face the
// public internet — it is for an isolated lab network or localhost only.

// Returns true if `host` is a private / loopback IPv4 address (or localhost).
function isPrivateBindAddress(host) {
  if (!host) return false;

  // Common loopback / wildcard names.
  if (host === 'localhost') return true;

  // IPv6 loopback and IPv4-mapped loopback.
  if (host === '::1' || host === '::ffff:127.0.0.1') return true;

  // Strip an IPv4-mapped IPv6 prefix if present (e.g. ::ffff:192.168.1.5).
  const v4 = host.replace(/^::ffff:/i, '');

  const m = v4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;

  const [a, b] = [Number(m[1]), Number(m[2])];
  if (m.slice(1).some((o) => Number(o) > 255)) return false;

  // 127.0.0.0/8  loopback
  if (a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12  (172.16 - 172.31)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

// Enforce the guard. Call before listen(). `argv` defaults to process.argv so
// `--allow-public` can override. Exits the process on a public bind unless
// overridden.
function enforceBindGuard(host, argv = process.argv) {
  const allowPublic = argv.includes('--allow-public');

  if (isPrivateBindAddress(host)) {
    return; // private / loopback — fine.
  }

  console.error('');
  console.error('  ============================================================');
  console.error('  ⚠  REFUSING TO START');
  console.error('  ------------------------------------------------------------');
  console.error(`  Bind address "${host}" is NOT a private/loopback address.`);
  console.error('');
  console.error('  This is a DELIBERATELY INSECURE teaching site. It transmits');
  console.error('  fake credentials in cleartext on purpose and must NEVER be');
  console.error('  exposed to a public network.');
  console.error('');
  console.error('  Bind to 127.0.0.1 or a private LAN address (10.x, 172.16-31.x,');
  console.error('  192.168.x). If you REALLY know what you are doing on an');
  console.error('  isolated lab, re-run with the explicit --allow-public flag.');
  console.error('  ============================================================');
  console.error('');

  if (!allowPublic) {
    process.exit(1);
  }

  console.error('  --allow-public set: starting anyway. You have been warned.');
  console.error('');
}

module.exports = { isPrivateBindAddress, enforceBindGuard };
