import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';
import { validateWebhookUrl } from '@/lib/security/urlValidator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, merchantUpiId, merchantName, useMicroOffset, webhookUrl, customNote, customerEmail, metadata } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid payment amount greater than 0 is required.' },
        { status: 400 }
      );
    }

    // SECURITY FIX (Phase 4): webhook targets are SSRF-validated BEFORE being
    // stored. If none is provided, fall back to the server-configured URL.
    const effectiveWebhookUrl = webhookUrl || process.env.WEBHOOK_URL;
    if (effectiveWebhookUrl) {
      const urlCheck = await validateWebhookUrl(effectiveWebhookUrl);
      if (!urlCheck.valid) {
        return NextResponse.json(
          { success: false, error: urlCheck.error },
          { status: 400 }
        );
      }
    }

    const { order, upiIntentUri } = await orderManager.createOrder({
      amount: Number(amount),
      merchantUpiId,
      merchantName,
      useMicroOffset: !!useMicroOffset,
      webhookUrl: effectiveWebhookUrl,
      customNote,
      customerEmail,
      metadata,
    });

    // SECURITY: the create response must not echo sensitive fields either.
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        merchantUpiId: order.merchantUpiId,
        merchantName: order.merchantName,
        baseAmount: order.baseAmount,
        expectedAmount: order.expectedAmount,
        refNote: order.refNote,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
      },
      upiIntentUri,
      checkoutUrl: `/pay/${order.id}`,
    });
  } catch (err: any) {
    console.error('[API /api/orders/create] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
