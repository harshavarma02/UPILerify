/**
 * UPIlerify Order & Verification Engine
 * Handles dynamic NPCI UPI QR code generation, 3-tier collision avoidance,
 * real-time SSE streaming, and signed webhook dispatches.
 */

import crypto from 'crypto';

import { ParsedUPIAlert } from '../parser/multiBankParser';
import { WebhookDispatcher } from '../webhooks/webhookDispatcher';
import type { StorageAdapter } from '../storage/storageAdapter';
import { SqliteAdapter } from '../storage/sqliteAdapter';

export type OrderStatus = 'PENDING' | 'CLAIMED' | 'VERIFIED' | 'EXPIRED';

export type MatchTier =
  | 'TIER_0_CLAIMED_CONFIRMED'
  | 'TIER_1_REMARK'
  | 'TIER_2_MICRO_OFFSET'
  | 'TIER_3_UTR_FALLBACK';

export interface PaymentOrder {
  id: string;
  merchantUpiId: string;
  merchantName: string;
  baseAmount: number;
  expectedAmount: number;
  refNote: string;
  status: OrderStatus;
  createdAt: number;
  expiresAt: number;
  verifiedAt?: number;
  claimedUtr?: string;
  claimedAt?: number;
  matchedUtr?: string;
  matchedBank?: string;
  matchedSender?: string;
  matchTier?: MatchTier;
  webhookUrl?: string;
  webhookStatus?: 'PENDING' | 'SENT' | 'FAILED';
  metadata?: Record<string, any>;
  customerEmail?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'ORDER_CREATED' | 'ALERT_RECEIVED' | 'CLAIMED' | 'VERIFIED' | 'COLLISION_RESOLVED' | 'WEBHOOK_SENT' | 'UNMATCHED';
  message: string;
  details?: any;
}

export interface CreateOrderParams {
  merchantUpiId?: string;
  merchantName?: string;
  amount: number;
  useMicroOffset?: boolean;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  customNote?: string;
  customerEmail?: string;
}

class OrderManager {
  private storage: StorageAdapter;
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private microOffsetCounter = 0;

  constructor(storage?: StorageAdapter) {
    // RESILIENCE (Phase 5): state lives in a StorageAdapter (SQLite by
    // default) instead of in-memory Maps, so orders and the UTR dedup index
    // survive process restarts.
    this.storage = storage ?? new SqliteAdapter();

    // Periodic background cleaner for expired orders
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        this.cleanupExpiredOrders().catch((err) =>
          console.error('[OrderManager] Expired-order cleanup failed:', err)
        );
      }, 60000);
      // Never keep the process alive just for the cleanup timer
      if (typeof timer.unref === 'function') timer.unref();
    }
  }

  /**
   * Generates a 5-character random alphanumeric reference ID.
   * SECURITY: uses a CSPRNG (crypto.randomInt) — Math.random is predictable
   * and would let attackers guess in-flight reference codes.
   */
  private generateRefId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return result;
  }

  /**
   * Generates a collision-resistant, unpredictable order ID.
   * SECURITY: crypto.randomUUID (CSPRNG) instead of Date.now()+Math.random.
   */
  private generateOrderId(): string {
    return `ord_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  /**
   * Calculates dynamic micro-paisa offset (e.g. +₹0.01, +₹0.02) to avoid collisions
   */
  private calculateExpectedAmount(baseAmount: number, useMicroOffset: boolean): number {
    if (!useMicroOffset) return baseAmount;
    this.microOffsetCounter = (this.microOffsetCounter + 1) % 99;
    const offset = (this.microOffsetCounter + 1) / 100;
    return parseFloat((baseAmount + offset).toFixed(2));
  }

  /**
   * Creates a new pending payment order and returns standard NPCI Intent URI
   */
  public async createOrder(params: CreateOrderParams): Promise<{ order: PaymentOrder; upiIntentUri: string }> {
    const orderId = this.generateOrderId();
    const refCode = params.customNote || `ORD-${this.generateRefId()}`;
    const baseAmount = Number(params.amount);
    const expectedAmount = this.calculateExpectedAmount(baseAmount, !!params.useMicroOffset);

    const merchantUpiId = params.merchantUpiId || process.env.DEFAULT_UPI_ID || 'merchant@upi';
    const merchantName = params.merchantName || process.env.DEFAULT_UPI_NAME || 'Demo Merchant';

    const order: PaymentOrder = {
      id: orderId,
      merchantUpiId,
      merchantName,
      baseAmount,
      expectedAmount,
      refNote: refCode,
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
      webhookUrl: params.webhookUrl || process.env.WEBHOOK_URL,
      metadata: params.metadata,
      customerEmail: params.customerEmail,
    };

    await this.storage.saveOrder(order);

    // Standard NPCI UPI Intent URI format
    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
      merchantName
    )}&am=${expectedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(refCode)}`;

    await this.addLog({
      type: 'ORDER_CREATED',
      message: `Created order ${orderId} for ₹${expectedAmount} (Ref: ${refCode})`,
      details: { orderId, expectedAmount, refCode, merchantUpiId },
    });

    this.emitEvent('order_created', { order, upiIntentUri });

    return { order, upiIntentUri };
  }

  public async getOrder(orderId: string): Promise<PaymentOrder | undefined> {
    return this.storage.getOrder(orderId);
  }

  public async getAllOrders(): Promise<PaymentOrder[]> {
    return this.storage.getAllOrders();
  }

  public async getLogs(): Promise<ActivityLog[]> {
    return this.storage.getRecentLogs(100);
  }

  /**
   * Matches an incoming bank alert to pending/claimed orders.
   * Tier 0 confirms CLAIMED orders (real bank alert with matching UTR + amount);
   * Tiers 1–3 resolve alerts for PENDING orders.
   */
  public async processBankAlert(alert: ParsedUPIAlert): Promise<{ matched: boolean; order?: PaymentOrder; tier?: string }> {
    await this.addLog({
      type: 'ALERT_RECEIVED',
      message: `Received ${alert.bank} alert: ₹${alert.amount} (UTR: ${alert.utr || 'N/A'}, Remark: ${alert.remark || 'None'})`,
      details: alert,
    });

    const allOrders = await this.storage.getAllOrders();

    // Durable UTR dedup: a UTR already VERIFIED by another order is replayed
    // and must never match again. A UTR owned by a CLAIMED order falls through
    // to Tier 0, which is the only path that can confirm it.
    if (alert.utr) {
      const owner = await this.storage.getUtrOwner(alert.utr);
      if (owner) {
        const ownerOrder = await this.storage.getOrder(owner);
        if (ownerOrder?.status === 'VERIFIED') {
          console.log(`[OrderManager] UTR ${alert.utr} already verified by order ${owner}`);
          return { matched: false };
        }
      }
    }

    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING');
    const claimedOrders = allOrders.filter((o) => o.status === 'CLAIMED');

    // Tier 0: Claimed UTR Confirmation (SECURITY FIX — Phase 2)
    // A manually submitted UTR only becomes a verified payment when a REAL bank
    // alert arrives with the SAME UTR and the matching amount. This closes the
    // verification bypass where anyone could submit an arbitrary UTR and
    // instantly mark an unpaid order as VERIFIED.
    if (alert.utr) {
      const claimedOrder = claimedOrders.find((o) => o.claimedUtr === alert.utr);
      if (claimedOrder) {
        if (Math.abs(claimedOrder.expectedAmount - alert.amount) < 0.009) {
          return this.confirmVerification(claimedOrder, alert, 'TIER_0_CLAIMED_CONFIRMED');
        }
        // UTR matches but the actual bank amount differs from what was claimed:
        // do NOT verify — log for investigation and keep the order CLAIMED.
        await this.addLog({
          type: 'UNMATCHED',
          message: `UTR ${alert.utr} matched CLAIMED order ${claimedOrder.id} but amount ₹${alert.amount} ≠ expected ₹${claimedOrder.expectedAmount}. Verification withheld.`,
          details: { alert, orderId: claimedOrder.id, expectedAmount: claimedOrder.expectedAmount },
        });
        return { matched: false };
      }
    }

    // Tier 1: Exact Remark Match (e.g. ORD-XXXX in transaction note)
    if (alert.remark) {
      const match = pendingOrders.find(
        (o) => o.refNote.toLowerCase() === alert.remark?.toLowerCase()
      );
      if (match) {
        return this.confirmVerification(match, alert, 'TIER_1_REMARK');
      }
    }

    // Tier 2: Micro-Offset Amount Match (Unique expectedAmount within recent window)
    const microAmountMatch = pendingOrders.find(
      (o) => Math.abs(o.expectedAmount - alert.amount) < 0.009
    );
    if (microAmountMatch) {
      return this.confirmVerification(microAmountMatch, alert, 'TIER_2_MICRO_OFFSET');
    }

    // Tier 3: Base Amount Match (if only one order matches that exact base amount)
    const baseAmountMatches = pendingOrders.filter(
      (o) => Math.abs(o.baseAmount - alert.amount) < 0.009
    );
    if (baseAmountMatches.length === 1) {
      return this.confirmVerification(baseAmountMatches[0], alert, 'TIER_2_MICRO_OFFSET');
    }

    await this.addLog({
      type: 'UNMATCHED',
      message: `Unmatched alert for ₹${alert.amount} (UTR: ${alert.utr})`,
      details: alert,
    });

    return { matched: false };
  }

  /**
   * Manual UTR submission (SECURITY FIX — Phase 2).
   *
   * BEFORE: customer submits any 12-digit UTR → order instantly VERIFIED →
   *         webhook fires → merchant ships the goods. Total bypass.
   * AFTER:  submission only records a CLAIM on the order. The order moves to
   *         CLAIMED and transitions to VERIFIED exclusively when a real bank
   *         alert arrives via processBankAlert() with the same UTR and a
   *         matching amount (Tier 0). No webhook and no verification happens
   *         here.
   */
  public async verifyByManualUtr(orderId: string, utr: string): Promise<{ success: boolean; order?: PaymentOrder; message: string; status?: OrderStatus }> {
    const cleanUtr = (utr || '').replace(/\D/g, '');
    if (cleanUtr.length !== 12) {
      return { success: false, message: 'Invalid UTR format. Must be a 12-digit number.' };
    }

    const order = await this.storage.getOrder(orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    if (order.status === 'VERIFIED') {
      return { success: true, order, message: 'Order is already verified.', status: 'VERIFIED' };
    }

    if (order.status === 'EXPIRED') {
      return { success: false, message: 'Order has expired and can no longer accept a UTR submission.' };
    }

    // Idempotent re-submission of the same UTR for the same order.
    if (order.status === 'CLAIMED' && order.claimedUtr === cleanUtr) {
      return {
        success: true,
        order,
        message: 'UTR already submitted. Awaiting bank confirmation.',
        status: 'CLAIMED',
      };
    }

    // UTR deduplication across VERIFIED and CLAIMED orders — a UTR can only
    // ever be associated with one order, regardless of its state. The index is
    // durable (SQLite), so replaying a UTR after a server restart is blocked.
    const owner = await this.storage.getUtrOwner(cleanUtr);
    if (owner && owner !== orderId) {
      const ownerOrder = await this.storage.getOrder(owner);
      return {
        success: false,
        message:
          ownerOrder?.status === 'VERIFIED'
            ? 'This UTR has already been verified for another order.'
            : 'This UTR has already been claimed for another order.',
      };
    }

    // Record the claim — DO NOT verify. Bank alert matching (Tier 0) is the
    // only path to VERIFIED from here.
    order.status = 'CLAIMED';
    order.claimedUtr = cleanUtr;
    order.claimedAt = Date.now();
    await this.storage.saveOrder(order);
    await this.storage.claimUtr(cleanUtr, orderId);

    await this.addLog({
      type: 'CLAIMED',
      message: `UTR claimed on order ${orderId} (${cleanUtr}). Awaiting bank alert confirmation.`,
      details: { orderId, claimedUtr: cleanUtr, expectedAmount: order.expectedAmount },
    });

    this.emitEvent('payment_claimed', { order });

    return {
      success: true,
      order,
      message: 'UTR submitted successfully. Payment will be confirmed once the bank alert is received.',
      status: 'CLAIMED',
    };
  }

  /**
   * Marks order as verified, updates indices, triggers webhook & SSE event
   */
  private async confirmVerification(
    order: PaymentOrder,
    alert: ParsedUPIAlert,
    tier: MatchTier
  ): Promise<{ matched: boolean; order: PaymentOrder; tier: MatchTier }> {
    order.status = 'VERIFIED';
    order.verifiedAt = Date.now();
    order.matchedUtr = alert.utr;
    order.matchedBank = alert.bank;
    order.matchedSender = alert.sender;
    order.matchTier = tier;

    await this.storage.saveOrder(order);

    if (alert.utr) {
      // Durable VERIFIED index — blocks UTR replay forever (even across restarts).
      await this.storage.verifyUtr(alert.utr, order.id);
    }

    await this.addLog({
      type: 'VERIFIED',
      message: `Verified order ${order.id} for ₹${order.expectedAmount} via ${alert.bank} (${tier})`,
      details: { order, alert, tier },
    });

    this.emitEvent('payment_verified', { order, alert });

    // Dispatch signed webhook asynchronously
    if (order.webhookUrl) {
      WebhookDispatcher.dispatch(order.webhookUrl, {
        event: 'payment.verified',
        timestamp: Date.now(),
        order: {
          id: order.id,
          amount: order.baseAmount,
          expectedAmount: order.expectedAmount,
          refNote: order.refNote,
          merchantUpiId: order.merchantUpiId,
          utr: order.matchedUtr,
          bank: order.matchedBank,
          sender: order.matchedSender,
          verifiedAt: order.verifiedAt,
          status: order.status,
          metadata: order.metadata,
        },
      }).then(async (res) => {
        order.webhookStatus = res.success ? 'SENT' : 'FAILED';
        await this.storage.saveOrder(order);
        await this.addLog({
          type: 'WEBHOOK_SENT',
          message: `Webhook dispatch ${res.success ? 'succeeded' : 'failed'} for order ${order.id}`,
          details: res,
        });
      });
    }

    return { matched: true, order, tier };
  }

  private async addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const fullLog: ActivityLog = {
      id: `log_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
      timestamp: Date.now(),
      ...log,
    };
    await this.storage.addLog(fullLog);
    this.emitEvent('log', fullLog);
  }

  private async cleanupExpiredOrders(): Promise<void> {
    const now = Date.now();
    const orders = await this.storage.getAllOrders();
    for (const order of orders) {
      if (order.status === 'PENDING' && order.expiresAt < now) {
        order.status = 'EXPIRED';
        await this.storage.saveOrder(order);
        this.emitEvent('order_expired', { orderId: order.id });
      }
    }
  }

  public subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: string, data: any) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('[OrderManager] Error notifying listener:', err);
      }
    }
  }
}

export { OrderManager };
export const orderManager = new OrderManager();
