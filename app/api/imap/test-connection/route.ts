import { NextRequest, NextResponse } from 'next/server';
import { imapService } from '@/lib/imap/imapService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || process.env.GMAIL_ADDRESS;
    const appPassword = body.appPassword || process.env.GMAIL_APP_PASSWORD;

    if (!email || !appPassword) {
      return NextResponse.json(
        { success: false, message: 'Gmail address and 16-character App Password are required.' },
        { status: 400 }
      );
    }

    const result = await imapService.testConnection(email, appPassword);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
