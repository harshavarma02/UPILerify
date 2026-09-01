/**
 * UPILerify — Authentication & Security Proxy (Next.js 16 middleware)
 *
 * SECURITY REMEDIATION (Phase 1 of the hardening plan):
 *  - All /api routes are DENY-BY-DEFAULT. Public access requires an explicit
 *    allowlist entry (checkout status polling + customer checkout page).
 *  - Protected routes require `Authorization: Bearer <UPILERIFY_API_KEY>`.
 *  - Security headers are injected on every response.
 *
 * NOTE ON NAMING: In Next.js 16 the `middleware.ts` convention was renamed to
 * `proxy.ts` (the function export is `proxy` instead of `middleware`). The
 * behaviour is identical; this file IS the project's edge/Node middleware.
 *
 * API KEY TRANSPORT:
 *  - Preferred:  Authorization: Bearer <key>   (server-to-server calls)
 *  - Fallback:   ?api_key=<key>                (browser EventSource cannot set
 *                 headers; used by the dashboard SSE stream). Prefer the header
 *                 whenever the client supports it — query params can leak into
 *                 access logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimiters, RateLimiter } from './lib/security/rateLimiter';

/** Security headers applied to every response passing through this proxy. */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Routes that must remain accessible WITHOUT an API key.
 * Only safe, read-only endpoints belong here:
 *  - GET /api/orders/<orderId>/status — polled by the customer checkout page
 *  - GET /pay/*                       — customer-facing checkout UI
 */
const PUBLIC_GET_ROUTES: RegExp[] = [
  /^\/api\/orders\/[^/]+\/status$/,
  /^\/pay(\/|$)/,
];

/** Internal Next.js assets that should never be intercepted. */
const SKIP_ROUTES: RegExp[] = [
  /^\/_next\/static\//,
  /^\/_next\/image\//,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

function isPublicRoute(pathname: string, method: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false;
  return PUBLIC_GET_ROUTES.some((pattern) => pattern.test(pathname));
}

function extractApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return token;
  }

  // Fallback for EventSource (cannot set request headers).
  const queryKey = req.nextUrl.searchParams.get('api_key');
  if (queryKey && queryKey.trim()) return queryKey.trim();

  return null;
}

/**
 * Constant-time secret comparison.
 * Both values are hashed first so comparison length is fixed regardless of the
 * input lengths (avoids length leakage and satisfies timingSafeEqual's
 * equal-length requirement).
 */
function secureCompare(provided: string, expected: string): boolean {
  const hash = (value: string) =>
    crypto.createHash('sha256').update(value, 'utf8').digest();

  return crypto.timingSafeEqual(hash(provided), hash(expected));
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Authentication required. Provide a valid API key via the Authorization: Bearer header.' },
    { status: 401 }
  );
}

function misconfigured(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Server authentication is not configured. Set UPILERIFY_API_KEY to enable protected endpoints.' },
    { status: 503 }
  );
}

/**
 * RESILIENCE (Phase 5): per-IP sliding-window rate limits, applied AFTER
 * authentication and BEFORE the request reaches route handlers.
 */
const RATE_LIMIT_RULES: Array<{ pattern: RegExp; limiter: RateLimiter; name: string }> = [
  { pattern: /^\/api\/orders\/create$/, limiter: rateLimiters.orderCreate, name: 'order-create' },
  { pattern: /^\/api\/verify-utr$/, limiter: rateLimiters.verifyUtr, name: 'verify-utr' },
  { pattern: /^\/api\/imap\/sync$/, limiter: rateLimiters.imapSync, name: 'imap-sync' },
  { pattern: /^\/api\/imap\/test-connection$/, limiter: rateLimiters.imapSync, name: 'imap-test' },
  { pattern: /^\/api\/webhooks\/test$/, limiter: rateLimiters.webhookTest, name: 'webhook-test' },
];

function rateLimited(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const rule = RATE_LIMIT_RULES.find((r) => r.pattern.test(pathname));
  if (!rule) return null;

  // Behind a proxy, use the forwarded client IP; fall back to peer address.
  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp =
    (forwarded ? forwarded.split(',')[0].trim() : '') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const result = rule.limiter.check(`${rule.name}|${clientIp}`);
  if (result.allowed) return null;

  const res = NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please slow down.',
      retryAfterMs: result.retryAfterMs,
    },
    { status: 429 }
  );
  if (result.retryAfterMs) {
    res.headers.set('Retry-After', Math.ceil(result.retryAfterMs / 1000).toString());
  }
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass internal assets straight through (headers still applied below).
  const isInternalAsset = SKIP_ROUTES.some((pattern) => pattern.test(pathname));

  // DENY-BY-DEFAULT for the API surface: every /api route requires auth unless
  // explicitly allowlisted as public.
  if (!isInternalAsset && pathname.startsWith('/api/') && !isPublicRoute(pathname, req.method)) {
    const expectedKey = process.env.UPILERIFY_API_KEY;

    if (!expectedKey) {
      console.error('[UPILerify Proxy] UPILERIFY_API_KEY is not set — refusing protected request.');
      const res = misconfigured();
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const providedKey = extractApiKey(req);
    if (!providedKey || !secureCompare(providedKey, expectedKey)) {
      const res = unauthorized();
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Rate limiting (Phase 5): only for authenticated requests to protected routes
    const limited = rateLimited(req);
    if (limited) {
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => limited.headers.set(k, v));
      return limited;
    }
  }

  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export const config = {
  // Run on everything except Next.js internal static/image optimization paths.
  matcher: ['/((?!_next/static|_next/image).*)'],
};