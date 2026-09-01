import { NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';
import { sanitizeOrder, sanitizeActivityLog } from '@/lib/security/sanitize';

export async function GET() {
  try {
    const orders = await orderManager.getAllOrders();
    const logs = await orderManager.getLogs();

    const verifiedCount = orders.filter((o) => o.status === 'VERIFIED').length;
    const claimedCount = orders.filter((o) => o.status === 'CLAIMED').length;
    const totalVolume = orders
      .filter((o) => o.status === 'VERIFIED')
      .reduce((sum, o) => sum + (o.expectedAmount || o.baseAmount), 0);

    // SECURITY (Phase 3): respond with sanitized order views — customerEmail,
    // webhookUrl, metadata and merchantUpiId never leave the server. Log
    // details are recursively stripped as a safety net.
    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders: orders.length,
        verifiedOrders: verifiedCount,
        claimedOrders: claimedCount,
        pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        successRate: orders.length > 0 ? Math.round((verifiedCount / orders.length) * 100) : 0,
      },
      orders: orders.map(sanitizeOrder),
      logs: logs.slice(0, 50).map(sanitizeActivityLog),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
