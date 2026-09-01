import { NextRequest, NextResponse } from 'next/server';
import { imapService } from '@/lib/imap/imapService';
import { orderManager } from '@/lib/engine/orderManager';
import { sanitizeAlert } from '@/lib/security/sanitize';

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX (Phase 3): credentials are accepted ONLY from server-side
    // environment configuration. Request-body credentials were removed — they
    // previously allowed anyone to turn this endpoint into an arbitrary
    // mailbox probe / credential-injection vector.
    const email = process.env.GMAIL_ADDRESS;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!email || !appPassword) {
      return NextResponse.json(
        { success: false, error: 'IMAP credentials not configured on server. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD.' },
        { status: 503 }
      );
    }

    const alerts = await imapService.fetchRecentAlerts(email, appPassword, 15);
    const matchResults = [];

    for (const alert of alerts) {
      const match = await orderManager.processBankAlert(alert);
      matchResults.push({
        // SECURITY (Phase 3): sanitized alert — no raw email snippets or sender PII.
        alert: sanitizeAlert(alert),
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
