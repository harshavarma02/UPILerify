/**
 * UPIlerify Webhook Dispatcher
 * Sends real-time payment verification events to merchant URLs with HMAC-SHA256 signature
 */

import crypto from 'crypto';

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
  responseBody?: string;
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
    secret: string = process.env.WEBHOOK_SECRET || 'upilerify_secret_key'
  ): Promise<WebhookDispatchResult> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: false, error: 'Invalid webhook URL' };
    }

    const jsonString = JSON.stringify(payload);
    const signature = this.generateSignature(jsonString, secret);

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
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseText = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        responseBody: responseText.slice(0, 500),
      };
    } catch (err: any) {
      console.error('[WebhookDispatcher] Delivery failed to', webhookUrl, err.message);
      return {
        success: false,
        error: err.message || 'Network error delivering webhook',
      };
    }
  }
}
