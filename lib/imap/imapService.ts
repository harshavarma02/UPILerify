/**
 * UPIlerify IMAP Service
 * Connects securely to Gmail via TLS IMAP using 16-character App Passwords.
 * Uses ImapFlow and simpleParser to read and extract UPI alerts in real-time.
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { parseUPIEmail, ParsedUPIAlert } from '../parser/multiBankParser';

export interface IMAPConnectionConfig {
  email: string;
  appPassword: string;
}

export interface IMAPTestResult {
  success: boolean;
  message: string;
  mailboxCount?: number;
  error?: string;
}

class ImapService {
  private processedUids: Set<string> = new Set();

  /**
   * Sanitizes 16-character App Password (removes spaces, enforces clean format)
   */
  private cleanAppPassword(pass: string): string {
    return (pass || '').replace(/\s+/g, '').trim();
  }

  /**
   * Creates an ImapFlow client instance configured for Gmail
   */
  private createClient(email: string, appPassword: string): ImapFlow {
    return new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: email.trim(),
        pass: this.cleanAppPassword(appPassword),
      },
      logger: false,
    });
  }

  /**
   * Tests the IMAP connection with provided credentials
   */
  public async testConnection(email: string, appPassword: string): Promise<IMAPTestResult> {
    if (!email || !appPassword) {
      return {
        success: false,
        message: 'Gmail address and 16-character App Password are required.',
      };
    }

    const client = this.createClient(email, appPassword);

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      const status = client.mailbox;
      const count = (status && typeof status === 'object' && 'exists' in status) ? Number((status as any).exists) : 0;
      lock.release();
      await client.logout();

      return {
        success: true,
        message: `Successfully connected to ${email}! Mailbox active.`,
        mailboxCount: count,
      };
    } catch (err: any) {
      console.error('[ImapService] Connection error:', err);
      let errorReason = err.message || 'Could not authenticate';

      if (err.message?.includes('Invalid credentials') || err.message?.includes('AUTHENTICATIONFAILED')) {
        errorReason = 'Invalid Gmail address or App Password. Ensure 2-Step Verification is ON and a 16-character App Password is used.';
      }

      return {
        success: false,
        message: 'Failed to connect to Gmail IMAP.',
        error: errorReason,
      };
    }
  }

  /**
   * Scans INBOX for recent UPI bank alert emails (last 15 minutes or UNSEEN)
   */
  public async fetchRecentAlerts(
    email: string,
    appPassword: string,
    sinceMinutes: number = 15
  ): Promise<ParsedUPIAlert[]> {
    const client = this.createClient(email, appPassword);
    const alerts: ParsedUPIAlert[] = [];

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        const sinceDate = new Date(Date.now() - sinceMinutes * 60 * 1000);
        
        // Search criteria for banking alerts
        const messages = client.fetch(
          {
            or: [
              { seen: false },
              { since: sinceDate }
            ]
          },
          { envelope: true, source: true, uid: true }
        );

        for await (const message of messages) {
          const uidKey = `${email}_${message.uid}`;
          
          if (this.processedUids.has(uidKey)) {
            continue;
          }

          if (!message.source) {
            continue;
          }

          const parsedMail: any = await simpleParser(message.source);
          const subject = parsedMail?.subject || '';
          const body = (parsedMail?.text || '') + ' ' + (parsedMail?.html || '');

          // Check if it's a UPI / Credit notification
          const isUpiCandidate =
            /upi|credited|received|payment|rrn|utr/i.test(subject) ||
            /upi|credited|received|payment|rrn|utr/i.test(body);

          if (isUpiCandidate) {
            const dateTimestamp = message.envelope?.date
              ? new Date(message.envelope.date).getTime()
              : Date.now();

            const parsedAlert = parseUPIEmail(subject, body, dateTimestamp);

            if (parsedAlert.isValid) {
              alerts.push(parsedAlert);
              this.processedUids.add(uidKey);
            }
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch (err: any) {
      console.error('[ImapService] Error fetching alerts:', err.message);
    }

    return alerts;
  }
}

export const imapService = new ImapService();
