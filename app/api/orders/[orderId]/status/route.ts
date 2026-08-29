import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = orderManager.getOrder(orderId);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      order: {
        id: order.id,
        amount: order.baseAmount,
        expectedAmount: order.expectedAmount,
        refNote: order.refNote,
        merchantUpiId: order.merchantUpiId,
        merchantName: order.merchantName,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        verifiedAt: order.verifiedAt,
        matchedUtr: order.matchedUtr,
        matchedBank: order.matchedBank,
        matchTier: order.matchTier,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
