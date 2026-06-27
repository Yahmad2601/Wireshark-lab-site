'use strict';

// Startup guard: refuse to run on a public bind address unless explicitly
// overridden. This site is deliberately insecure and must never face the
// public internet — it is for an isolated lab network or localhost only.

const os = require('os');

// Returns true if `host` is a private / loopback IPv4 address (or localhost).
function isPrivateIPv4(host) {
  if (!host) return false;

  // Common loopback / wildcard names.
  if (host === 'localhost') return true;

  // IPv4-mapped loopback.
  if (host === '::ffff:127.0.0.1') return true;

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

// Returns true if `addr` is a private / loopback IPv6 address.
function isPrivateIPv6(addr) {
  if (!addr) return false;
  const a = addr.toLowerCase().split('%')[0]; // drop zone id (e.g. %eth0)
  if (a === '::1') return true; // loopback
  if (a.startsWith('fe80')) return true; // link-local fe80::/10
  if (a.startsWith('fc') || a.startsWith('fd')) return true; // ULA fc00::/7
  return false;
}

// Returns true if `host` is a private/loopback bind address (IPv4 or IPv6).
function isPrivateBindAddress(host) {
  if (!host) return false;
  if (host === '::1') return true;
  return isPrivateIPv4(host) || isPrivateIPv6(host);
}

// A wildcard bind listens on every interface of its address family.
function isWildcard(host) {
  return host === '0.0.0.0' || host === '::' || host === '';
}

// Collect this machine's non-internal addresses for the given family and report
// whether they are ALL private. An empty set (loopback-only machine) counts as
// private/safe.
function machineAddressesAllPrivate(family) {
  const ifaces = os.networkInterfaces();
  const addrs = [];
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.internal) continue;
      if (ni.family !== family) continue;
      addrs.push(ni.address);
    }
  }
  const isPriv = family === 'IPv6' ? isPrivateIPv6 : isPrivateIPv4;
  const publicAddrs = addrs.filter((a) => !isPriv(a));
  return { allPrivate: publicAddrs.length === 0, addrs, publicAddrs };
}

// This machine's private, non-internal IPv4 addresses (e.g. the LAN IP). Used
// to print reachable URLs and to build the HTTPS cert SAN.
function privateIPv4s() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.internal || ni.family !== 'IPv4') continue;
      if (isPrivateIPv4(ni.address)) out.push(ni.address);
    }
  }
  return [...new Set(out)];
}

function refuse(lines, allowPublic) {
  console.error('');
  console.error('  ============================================================');
  console.error('  ⚠  REFUSING TO START');
  console.error('  ------------------------------------------------------------');
  lines.forEach((l) => console.error('  ' + l));
  console.error('');
  console.error('  This is a DELIBERATELY INSECURE teaching site. It transmits');
  console.error('  fake credentials in cleartext on purpose and must NEVER be');
  console.error('  exposed to a public network.');
  console.error('');
  console.error('  Bind to 127.0.0.1, a private LAN address (10.x, 172.16-31.x,');
  console.error('  192.168.x), or 0.0.0.0 on a machine with only private');
  console.error('  addresses. To override on an isolated lab, re-run with the');
  console.error('  explicit --allow-public flag.');
  console.error('  ============================================================');
  console.error('');

  if (!allowPublic) {
    process.exit(1);
  }
  console.error('  --allow-public set: starting anyway. You have been warned.');
  console.error('');
}

// Enforce the guard. Call before listen(). `argv` defaults to process.argv so
// `--allow-public` can override. Exits the process on a public bind unless
// overridden.
function enforceBindGuard(host, argv = process.argv) {
  const allowPublic = argv.includes('--allow-public');

  // Wildcard bind (0.0.0.0 / ::): listening on every interface is fine ONLY if
  // every non-loopback address on the machine is private. If any interface
  // carries a public address, this would expose the site — refuse.
  if (isWildcard(host)) {
    const family = host === '::' ? 'IPv6' : 'IPv4';
    const { allPrivate, addrs, publicAddrs } = machineAddressesAllPrivate(family);

    if (allPrivate) {
      const shown = addrs.length ? addrs.join(', ') : 'loopback only';
      console.error(
        `  Binding all ${family} interfaces (${shown}) — all private. OK.`
      );
      return;
    }

    refuse(
      [
        `Wildcard bind "${host}" would expose this machine's PUBLIC`,
        `address(es): ${publicAddrs.join(', ')}.`,
      ],
      allowPublic
    );
    return;
  }

  if (isPrivateBindAddress(host)) {
    return; // explicit private / loopback address — fine.
  }

  refuse([`Bind address "${host}" is NOT a private/loopback address.`], allowPublic);
}

module.exports = {
  isPrivateBindAddress,
  isPrivateIPv4,
  isPrivateIPv6,
  privateIPv4s,
  enforceBindGuard,
};
