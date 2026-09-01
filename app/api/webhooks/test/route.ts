import { NextRequest, NextResponse } from 'next/server';
import { WebhookDispatcher, WebhookPayload } from '@/lib/webhooks/webhookDispatcher';

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX (Phase 4): the target URL and signing secret are taken ONLY
    // from server configuration. User-supplied webhookUrl/secret were removed —
    // this endpoint previously allowed arbitrary outbound requests (SSRF).
    const targetUrl = process.env.WEBHOOK_URL;
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'WEBHOOK_URL is not configured on the server.' },
        { status: 400 }
      );
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: Date.now(),
      order: {
        id: `ord_test_${Date.now().toString(36)}`,
        amount: 499.0,
        expectedAmount: 499.0,
        refNote: 'ORD-TEST',
        merchantUpiId: process.env.DEFAULT_UPI_ID || 'merchant@upi',
        utr: '499012345678',
        bank: 'HDFC Bank',
        sender: 'Test Developer',
        verifiedAt: Date.now(),
        status: 'VERIFIED',
        metadata: { source: 'upilerify_starter_tester' },
      },
    };

    // Secret comes exclusively from the environment — never from the request.
    const result = await WebhookDispatcher.dispatch(targetUrl, testPayload);

    // SECURITY FIX: no responseSnippet — response bodies are never exposed
    // (prevents using this endpoint as an SSRF data exfiltration oracle).
    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
