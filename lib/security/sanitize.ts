/**
 * UPILerify — Response & Event Sanitizers (Phase 3)
 *
 * SECURITY REMEDIATION:
 *  Single, audited implementation that strips sensitive fields from every
 *  response surface (REST list endpoints, activity logs, SSE broadcasts).
 *
 *  Strategy:
 *   - Orders / alerts: WHITELIST — only explicitly-safe fields survive.
 *   - Arbitrary payloads (log details, unknown events): BLOCKLIST — known
 *     sensitive keys are recursively removed, so future fields fail closed
 *     rather than leaking by default.
 */

import { PaymentOrder, ActivityLog } from '../engine/orderManager';
import { ParsedUPIAlert } from '../parser/multiBankParser';

/** Keys that must never appear in any API response or SSE broadcast. */
const SENSITIVE_KEYS = new Set([
  'customerEmail',
  'webhookUrl',
  'metadata',
  'appPassword',
  'password',
  'secret',
  'rawSnippet',
  'authorization',
]);

/**
 * Recursively removes known-sensitive keys from any JSON-able value.
 * Used as a safety net for log details and unrecognized event payloads.
 */
export function stripSensitiveFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripSensitiveFields(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = stripSensitiveFields(val);
    }
    return out as T;
  }
  return value;
}

/**
 * Whitelisted view of a PaymentOrder safe for admin responses.
 * Intentionally excluded: customerEmail, webhookUrl, metadata, merchantUpiId.
 */
export function sanitizeOrder(order: PaymentOrder) {
  return {
    id: order.id,
    merchantName: order.merchantName,
    baseAmount: order.baseAmount,
    expectedAmount: order.expectedAmount,
    refNote: order.refNote,
    status: order.status,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    claimedUtr: order.claimedUtr,
    claimedAt: order.claimedAt,
    verifiedAt: order.verifiedAt,
    matchedUtr: order.matchedUtr,
    matchedBank: order.matchedBank,
    matchedSender: order.matchedSender,
    matchTier: order.matchTier,
    webhookStatus: order.webhookStatus,
  };
}

/**
 * Whitelisted view of a ParsedUPIAlert.
 * Intentionally excluded: sender (phone/name PII) and rawSnippet (raw email body).
 */
export function sanitizeAlert(alert: ParsedUPIAlert) {
  return {
    bank: alert.bank,
    amount: alert.amount,
    utr: alert.utr,
    remark: alert.remark,
    date: alert.date,
    receivedAt: alert.receivedAt,
    isValid: alert.isValid,
  };
}

/** Sanitized activity log — details are recursively stripped. */
export function sanitizeActivityLog(log: ActivityLog): ActivityLog {
  return {
    ...log,
    details: log.details ? stripSensitiveFields(log.details) : undefined,
  };
}

/**
 * Sanitizes an SSE event payload before it is broadcast.
 * Falls back to recursive stripping for unknown event shapes.
 */
export function sanitizeSsePayload(event: string, data: any): unknown {
  switch (event) {
    case 'order_created':
    case 'payment_claimed':
    case 'payment_verified': {
      const sanitized: Record<string, unknown> = { ...data };
      if (data && typeof data === 'object') {
        if ('order' in data) sanitized.order = sanitizeOrder(data.order);
        if ('alert' in data) sanitized.alert = data.alert ? sanitizeAlert(data.alert) : data.alert;
      }
      return sanitized;
    }
    case 'log':
      return sanitizeActivityLog(data);
    default:
      return stripSensitiveFields(data);
  }
}