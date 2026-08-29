import { NextRequest, NextResponse } from 'next/server';
import { imapService } from '@/lib/imap/imapService';
import { orderManager } from '@/lib/engine/orderManager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || process.env.GMAIL_ADDRESS;
    const appPassword = body.appPassword || process.env.GMAIL_APP_PASSWORD;

    if (!email || !appPassword) {
      return NextResponse.json(
        { success: false, error: 'Gmail address and App Password are required for IMAP sync.' },
        { status: 400 }
      );
    }

    const alerts = await imapService.fetchRecentAlerts(email, appPassword, 15);
    const matchResults = [];

    for (const alert of alerts) {
      const match = orderManager.processBankAlert(alert);
      matchResults.push({
        alert,
        matched: match.matched,
        orderId: match.order?.id,
        tier: match.tier,
      });
    }

    return NextResponse.json({
      success: true,
      scannedCount: alerts.length,
      matchedCount: matchResults.filter((m) => m.matched).length,
      results: matchResults,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
