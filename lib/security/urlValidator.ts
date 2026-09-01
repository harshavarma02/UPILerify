/**
 * UPILerify — SSRF-Safe Webhook URL Validator (Phase 4)
 *
 * SECURITY REMEDIATION:
 *  Prevents the server from being weaponized as a proxy to reach internal
 *  networks, cloud metadata endpoints, or local services via webhook targets.
 *
 * Defense layers (all must pass):
 *   1. Scheme enforcement  — https:// in production (http only for explicit dev opt-out)
 *   2. Hostname blocklist  — localhost, *.internal, *.local, metadata endpoints
 *   3. Port blocklist      — SSH/SMTP/SMB/databases/other internal services
 *   4. Optional allowlist  — WEBHOOK_ALLOWED_HOSTS (comma-separated) if configured
 *   5. DNS resolution      — ALL resolved addresses checked (catches '127.1',
 *                            hex/octal IP tricks, and public-looking hostnames
 *                            that resolve privately)
 *   6. Range blocklist     — loopback, RFC1918, link-local/metadata, CGNAT,
 *                            ULA, multicast, unspecified, IPv4-mapped IPv6
 *
 * Environment overrides:
 *   - WEBHOOK_ALLOWED_HOSTS=host1.com,host2.com  → strict allowlist mode
 *   - ALLOW_PRIVATE_WEBHOOK_TARGETS=true         → dev-only escape hatch to
 *     permit private/loopback targets (NEVER enable in production)
 */

import { lookup } from 'dns/promises';

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

const BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.internal', '.local', '.zone'];

/** Ports commonly used by internal services — classic SSRF pivot targets. */
const BLOCKED_PORTS = new Set([
  22, // SSH
  23, // Telnet
  25, 465, 587, // SMTP
  110, 995, // POP3
  143, 993, // IMAP
  135, 139, 445, // RPC / NetBIOS / SMB
  1433, // MSSQL
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  9200, 9300, // Elasticsearch
  27017, 27018, 27019, // MongoDB
  3389, // RDP
]);

function privateRangesBlocked(): boolean {
  return process.env.ALLOW_PRIVATE_WEBHOOK_TARGETS !== 'true';
}

/** Checks an IPv4 dotted-quad against private/reserved ranges. */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true; // malformed → treat as private

  const [a, b] = parts;
  const inRange = (lo: [number, number], hi: [number, number]) =>
    (a > lo[0] || (a === lo[0] && b >= lo[1])) &&
    (a < hi[0] || (a === hi[0] && b <= hi[1]));

  return (
    a === 0 || // 0.0.0.0/8        "this network"
    a === 10 || // 10.0.0.0/8      RFC1918
    a === 127 || // 127.0.0.0/8    loopback
    inRange([100, 64], [100, 127]) || // 100.64.0.0/10 CGNAT
    inRange([169, 254], [169, 254]) || // 169.254.0.0/16 link-local / cloud metadata
    inRange([172, 16], [172, 31]) || // 172.16.0.0/12  RFC1918
    inRange([192, 168], [192, 168]) || // 192.168.0.0/16 RFC1918
    (a === 192 && b === 0) || // 192.0.0.0/24 & 192.0.2.0/24 reserved
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 benchmarking
    a >= 224 // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved + 255.255.255.255
  );
}
/** Expands an IPv6 address into its 8 16-bit groups. Returns null if invalid. */
function expandIPv6(ip: string): number[] | null {
  let addr = ip.toLowerCase();
  const zone = addr.indexOf('%');
  if (zone >= 0) addr = addr.slice(0, zone);

  // Embedded IPv4 (e.g. ::ffff:192.168.1.1)
  const v4 = addr.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4) {
    const p = v4[2].split('.').map(Number);
    if (p.length !== 4 || p.some((x) => x > 255)) return null;
    addr = `${v4[1]}${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }

  const halves = addr.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0) return null;
  const groups = [...head, ...Array(fill).fill('0'), ...tail];
  if (groups.length !== 8) return null;

  const out: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    out.push(parseInt(g, 16));
  }
  return out;
}

/** Checks an IPv6 address (any notation) against private/reserved ranges. */
export function isPrivateIPv6(ip: string): boolean {
  const g = expandIPv6(ip);
  if (!g) return true; // malformed → treat as private

  const unspecified = g.every((x) => x === 0);
  const loopback = g.slice(0, 7).every((x) => x === 0) && g[7] === 1;
  const first = g[0];

  if (unspecified || loopback) return true;
  if (first >= 0xfe80 && first <= 0xfebf) return true; // fe80::/10 link-local
  if (first >= 0xfc00 && first <= 0xfdff) return true; // fc00::/7 ULA
  if (first >= 0xff00) return true; // ff00::/8 multicast

  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded IPv4
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    const v4 = `${(g[6] >> 8) & 0xff}.${g[6] & 0xff}.${(g[7] >> 8) & 0xff}.${g[7] & 0xff}`;
    return isPrivateIPv4(v4);
  }

  return false;
}

/** Unified private/reserved check for any IP string. */
export function isPrivateAddress(ip: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return isPrivateIPv4(ip);
  if (ip.includes(':')) return isPrivateIPv6(ip);
  return true; // unknown format → fail closed
}

function hostnameIsBlocked(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, ''); // strip trailing dot (FQDN form)
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  // Obfuscated loopback forms resolvable by getaddrinfo (e.g. '127.1')
  if (/^127[\d.]*$/.test(host)) return true;
  return false;
}

/**
 * Validates a webhook URL for SSRF safety. Async because it performs DNS
 * resolution of the hostname and inspects every resolved address.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Webhook URL is required' };
  }

  // 1. Parse & scheme enforcement
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'Webhook URL is not a valid URL' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { valid: false, error: 'Webhook URL must use the http or https protocol' };
  }

  // 2. Hostname blocklist
  const hostname = url.hostname.toLowerCase();
  if (hostnameIsBlocked(hostname)) {
    return { valid: false, error: 'Blocked webhook URL: internal hostnames are not allowed' };
  }

  // 3. Port blocklist
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
  if (BLOCKED_PORTS.has(port)) {
    return { valid: false, error: 'Blocked webhook URL: this port targets internal services and is not allowed' };
  }

  // 4. Optional allowlist mode
  const allowlist = (process.env.WEBHOOK_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length > 0) {
    const allowed = allowlist.some((h) => hostname === h || hostname.endsWith(`.${h}`));
    if (!allowed) {
      return { valid: false, error: 'Blocked webhook URL: host is not on the configured allowlist' };
    }
  }

  // 5 & 6. Resolve DNS and inspect every address
  if (privateRangesBlocked()) {
    try {
      const addresses = await lookup(hostname, { all: true, verbatim: true });
      if (!addresses || addresses.length === 0) {
        return { valid: false, error: 'Blocked webhook URL: hostname does not resolve' };
      }
      for (const { address } of addresses) {
        if (isPrivateAddress(address)) {
          return { valid: false, error: 'Blocked webhook URL: private/internal IP address not allowed' };
        }
      }
    } catch {
      return { valid: false, error: 'Blocked webhook URL: hostname does not resolve' };
    }
  }

  // 7. Scheme enforcement (after SSRF checks so private-target errors are explicit)
  if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    return { valid: false, error: 'Webhook URL must use https in production' };
  }

  return { valid: true };
}