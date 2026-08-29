import { NextRequest, NextResponse } from 'next/server';
import { WebhookDispatcher, WebhookPayload } from '@/lib/webhooks/webhookDispatcher';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { webhookUrl, secret } = body;

    const targetUrl = webhookUrl || process.env.WEBHOOK_URL;
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target webhook URL is required.' },
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

    const result = await WebhookDispatcher.dispatch(targetUrl, testPayload, secret || process.env.WEBHOOK_SECRET);

    return NextResponse.json({
      success: result.success,
      deliveredTo: targetUrl,
      statusCode: result.statusCode,
      responseSnippet: result.responseBody,
      payload: testPayload,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
