/**
 * UPILerify — Sliding-Window Rate Limiter (Phase 5)
 *
 * SECURITY REMEDIATION:
 *  Per-IP brute-force throttling for sensitive endpoints. In-memory (per
 *  server instance) — sufficient for single-instance deployments; swap for a
 *  shared store (e.g. Redis) when scaling horizontally.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the oldest request falls out of the window. */
  retryAfterMs?: number;
  /** Requests remaining in the current window. */
  remaining: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  /**
   * Records a hit for `key` and reports whether it is within the limit.
   * The sliding window keeps only timestamps inside [now - windowMs, now].
   */
  public check(key: string): RateLimitResult {
    const now = Date.now();

    let timestamps = this.hits.get(key);
    if (!timestamps) {
      timestamps = [];
      this.hits.set(key, timestamps);
    }

    // Evict entries that slid out of the window
    while (timestamps.length > 0 && now - timestamps[0] >= this.windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= this.maxRequests) {
      const retryAfterMs = Math.max(this.windowMs - (now - timestamps[0]), 1000);
      return { allowed: false, retryAfterMs, remaining: 0 };
    }

    timestamps.push(now);

    // Opportunistic GC so abandoned keys don't grow the map unbounded
    if (this.hits.size > 10_000) {
      for (const [k, ts] of this.hits) {
        if (ts.length === 0 || now - ts[ts.length - 1] >= this.windowMs) {
          this.hits.delete(k);
        }
      }
    }

    return { allowed: true, remaining: this.maxRequests - timestamps.length };
  }

  /** Clears all buckets (used by tests). */
  public reset(): void {
    this.hits.clear();
  }
}

/**
 * Endpoint-specific limiters (per plan):
 *  - /api/orders/create   10 req/min per IP
 *  - /api/verify-utr       5 req/min per IP
 *  - /api/imap/sync        2 req/min per IP (+ test-connection)
 *  - /api/webhooks/test    3 req/min per IP
 */
export const rateLimiters = {
  orderCreate: new RateLimiter(10, 60_000),
  verifyUtr: new RateLimiter(5, 60_000),
  imapSync: new RateLimiter(2, 60_000),
  webhookTest: new RateLimiter(3, 60_000),
};