import { NextRequest, NextResponse } from 'next/server';
import { imapService } from '@/lib/imap/imapService';

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX (Phase 3): credentials are accepted ONLY from server-side
    // environment configuration. Request-body credentials were removed to
    // eliminate the arbitrary-mailbox / credential-injection attack vector.
    const email = process.env.GMAIL_ADDRESS;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!email || !appPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'IMAP credentials not configured on server. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD.',
        },
        { status: 503 }
      );
    }

    const result = await imapService.testConnection(email, appPassword);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
