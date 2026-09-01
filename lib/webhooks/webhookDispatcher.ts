/**
 * UPIlerify Webhook Dispatcher
 * Sends real-time payment verification events to merchant URLs with HMAC-SHA256 signature
 *
 * SECURITY REMEDIATION (Phase 4):
 *  - NO hardcoded signing secret fallback — refuses to sign if WEBHOOK_SECRET
 *    is not configured (was 'upilerify_secret_key', publicly known).
 *  - SSRF validation of the target URL before every dispatch.
 *  - Redirects are REJECTED (redirect: 'error') — a public URL 302-redirecting
 *    to 169.254.169.254 or an internal host can no longer bypass the validator.
 *  - Response bodies are NEVER returned to callers (no SSRF exfiltration oracle).
 */

import crypto from 'crypto';
import { validateWebhookUrl } from '../security/urlValidator';

export interface WebhookPayload {
  event: 'payment.verified' | 'order.expired' | 'webhook.test';
  timestamp: number;
  order: {
    id: string;
    amount: number;
    expectedAmount: number;
    refNote: string;
    merchantUpiId: string;
    utr?: string;
    bank?: string;
    sender?: string;
    verifiedAt?: number;
    status: string;
    metadata?: Record<string, any>;
  };
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

export class WebhookDispatcher {
  /**
   * Generates HMAC SHA256 signature for payload verification
   */
  public static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Dispatches signed webhook payload to merchant endpoint
   */
  public static async dispatch(
    webhookUrl: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<WebhookDispatchResult> {
    // SECURITY FIX: no default secret — refuse to sign with a known key.
    const signingSecret = secret || process.env.WEBHOOK_SECRET;
    if (!signingSecret) {
      return { success: false, error: 'WEBHOOK_SECRET is not configured. Cannot sign webhook.' };
    }

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: false, error: 'Invalid webhook URL' };
    }

    // SECURITY FIX: SSRF validation before any outbound request.
    const urlCheck = await validateWebhookUrl(webhookUrl);
    if (!urlCheck.valid) {
      return { success: false, error: urlCheck.error };
    }

    const jsonString = JSON.stringify(payload);
    const signature = this.generateSignature(jsonString, signingSecret);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Upilerify-Webhook-Daemon/1.0',
          'X-Upilerify-Signature': signature,
          'X-Upilerify-Event': payload.event,
        },
        body: jsonString,
        redirect: 'error', // SECURITY FIX: never follow redirects (SSRF bypass vector)
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      // SECURITY FIX: consume the body but never expose it — response content
      // could be internal service output (SSRF exfiltration oracle).
      await response.text().catch(() => '');

      return {
        success: response.ok,
        statusCode: response.status,
      };
    } catch (err: any) {
      console.error('[WebhookDispatcher] Delivery failed:', err.message);
      return {
        success: false,
        error: err.message || 'Network error delivering webhook',
      };
    }
  }
}
