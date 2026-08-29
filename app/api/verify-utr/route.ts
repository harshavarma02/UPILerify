import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, utr } = body;

    if (!orderId || !utr) {
      return NextResponse.json(
        { success: false, error: 'Both orderId and 12-digit UTR are required.' },
        { status: 400 }
      );
    }

    const result = orderManager.verifyByManualUtr(orderId, utr);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.order,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
