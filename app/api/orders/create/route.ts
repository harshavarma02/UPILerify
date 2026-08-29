import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';

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

    const { order, upiIntentUri } = orderManager.createOrder({
      amount: Number(amount),
      merchantUpiId,
      merchantName,
      useMicroOffset: !!useMicroOffset,
      webhookUrl,
      customNote,
      customerEmail,
      metadata,
    });

    return NextResponse.json({
      success: true,
      order,
      upiIntentUri,
      checkoutUrl: `/pay/${order.id}`,
    });
  } catch (err: any) {
    console.error('[API /api/orders/create] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
