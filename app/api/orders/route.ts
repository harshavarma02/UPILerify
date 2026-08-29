import { NextResponse } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';

export async function GET() {
  try {
    const orders = orderManager.getAllOrders();
    const logs = orderManager.getLogs();

    const verifiedCount = orders.filter((o) => o.status === 'VERIFIED').length;
    const totalVolume = orders
      .filter((o) => o.status === 'VERIFIED')
      .reduce((sum, o) => sum + (o.expectedAmount || o.baseAmount), 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders: orders.length,
        verifiedOrders: verifiedCount,
        pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        successRate: orders.length > 0 ? Math.round((verifiedCount / orders.length) * 100) : 0,
      },
      orders,
      logs: logs.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
