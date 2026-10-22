/**
 * UPIlerify Order & Verification Engine
 * Handles dynamic NPCI UPI QR code generation, active micro-offset leasing,
 * durable order lifecycle management, real-time SSE streaming, and signed webhooks.
 *
 * RULES.md Compliance:
 *  - Rule 1 (SRP): Orchestrates order lifecycle, persistence, and event dispatches.
 *  - Rule 2 (Modularity): Delegates offsets to MicroOffsetManager and heuristics to OrderMatcher.
 *  - Rule 6 (< 300 lines): Strictly under 300 lines.
 */

import crypto from 'crypto';
import { ParsedUPIAlert } from '../parser/multiBankParser';
import { dispatchOrderWebhook } from '../webhooks/orderWebhook';
import type { StorageAdapter } from '../storage/storageAdapter';
import { SqliteAdapter } from '../storage/sqliteAdapter';
import { MicroOffsetManager } from './microOffsetManager';
import { OrderMatcher } from './orderMatcher';
import type {
  PaymentOrder,
  OrderStatus,
  MatchTier,
  ActivityLog,
  CreateOrderParams,
} from './types';

export * from './types';

class OrderManager {
  private storage: StorageAdapter;
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private cleaningExpiredOrders = false;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new SqliteAdapter();

    // Periodic background cleaner for expired orders
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        this.cleanupExpiredOrders().catch((err) =>
          console.error('[OrderManager] Expired-order cleanup failed:', err)
        );
      }, 60000);
      if (typeof timer.unref === 'function') timer.unref();
    }
  }

  private generateRefId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return result;
  }

  private generateOrderId(): string {
    return `ord_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  public async createOrder(params: CreateOrderParams): Promise<{ order: PaymentOrder; upiIntentUri: string }> {
    const orderId = this.generateOrderId();
    const refCode = params.customNote || `ORD-${this.generateRefId()}`;
    const baseAmount = Number(params.amount);

    // Active conflict-free micro-offset leasing
    const expectedAmount = await MicroOffsetManager.calculateExpectedAmount(
      baseAmount,
      !!params.useMicroOffset,
      this.storage
    );

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
      redirectUrl: params.redirectUrl,
      metadata: params.metadata,
      customerEmail: params.customerEmail,
    };

    await this.storage.saveOrder(order);

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

  public async processBankAlert(alert: ParsedUPIAlert): Promise<{ matched: boolean; order?: PaymentOrder; tier?: string }> {
    await this.addLog({
      type: 'ALERT_RECEIVED',
      message: `Received ${alert.bank} alert: ₹${alert.amount} (UTR: ${alert.utr || 'N/A'}, Remark: ${alert.remark || 'None'})`,
      details: alert,
    });

    let utrOwnerOrder: PaymentOrder | undefined;
    if (alert.utr) {
      const ownerId = await this.storage.getUtrOwner(alert.utr);
      if (ownerId) utrOwnerOrder = await this.storage.getOrder(ownerId);
    }

    const allOrders = await this.storage.getAllOrders();
    const result = OrderMatcher.matchAlert(alert, allOrders, utrOwnerOrder);

    if (result.replayed) {
      console.log(`[OrderManager] UTR ${alert.utr} already verified by order ${utrOwnerOrder?.id}`);
      return { matched: false };
    }

    if (result.matched && result.order && result.tier) {
      return this.confirmVerification(result.order, alert, result.tier);
    }

    if (result.unmatchedReason && result.order) {
      await this.addLog({
        type: 'UNMATCHED',
        message: result.unmatchedReason,
        details: { alert, orderId: result.order.id, expectedAmount: result.order.expectedAmount },
      });
      return { matched: false };
    }

    await this.addLog({
      type: 'UNMATCHED',
      message: `Unmatched alert for ₹${alert.amount} (UTR: ${alert.utr})`,
      details: alert,
    });
    return { matched: false };
  }

  public async verifyByManualUtr(orderId: string, utr: string): Promise<{ success: boolean; order?: PaymentOrder; message: string; status?: OrderStatus }> {
    const cleanUtr = (utr || '').replace(/\D/g, '');
    if (cleanUtr.length !== 12) {
      return { success: false, message: 'Invalid UTR format. Must be a 12-digit number.' };
    }

    const order = await this.storage.getOrder(orderId);
    if (!order) return { success: false, message: 'Order not found.' };
    if (order.status === 'VERIFIED') return { success: true, order, message: 'Order is already verified.', status: 'VERIFIED' };
    if (order.status === 'EXPIRED') return { success: false, message: 'Order has expired and can no longer accept a UTR submission.' };

    if (order.status === 'CLAIMED' && order.claimedUtr === cleanUtr) {
      return { success: true, order, message: 'UTR already submitted. Awaiting bank confirmation.', status: 'CLAIMED' };
    }

    const owner = await this.storage.getUtrOwner(cleanUtr);
    if (owner && owner !== orderId) {
      const ownerOrder = await this.storage.getOrder(owner);
      return {
        success: false,
        message: ownerOrder?.status === 'VERIFIED'
          ? 'This UTR has already been verified for another order.'
          : 'This UTR has already been claimed for another order.',
      };
    }

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
    return { success: true, order, message: 'UTR submitted successfully. Payment will be confirmed once the bank alert is received.', status: 'CLAIMED' };
  }

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
    if (alert.utr) await this.storage.verifyUtr(alert.utr, order.id);

    await this.addLog({
      type: 'VERIFIED',
      message: `Verified order ${order.id} for ₹${order.expectedAmount} via ${alert.bank} (${tier})`,
      details: { order, alert, tier },
    });

    this.emitEvent('payment_verified', { order, alert });

    void dispatchOrderWebhook(order, 'payment.verified', this.storage, (log) => this.addLog(log));

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
    if (this.cleaningExpiredOrders) return;
    this.cleaningExpiredOrders = true;
    try {
      const now = Date.now();
      const orders = await this.storage.getAllOrders();
      for (const candidate of orders) {
        // Earlier webhook deliveries may have yielded while this order changed.
        const order = await this.storage.getOrder(candidate.id);
        if (order?.status === 'PENDING' && order.expiresAt < now) {
          order.status = 'EXPIRED';
          await this.storage.saveOrder(order);
          this.emitEvent('order_expired', { orderId: order.id });
          await dispatchOrderWebhook(order, 'order.expired', this.storage, (log) => this.addLog(log));
        }
      }
    } finally {
      this.cleaningExpiredOrders = false;
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
