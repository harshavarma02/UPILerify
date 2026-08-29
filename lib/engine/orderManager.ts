/**
 * UPIlerify Order & Verification Engine
 * Handles dynamic NPCI UPI QR code generation, 3-tier collision avoidance,
 * real-time SSE streaming, and signed webhook dispatches.
 */

import { ParsedUPIAlert } from '../parser/multiBankParser';
import { WebhookDispatcher } from '../webhooks/webhookDispatcher';

export interface PaymentOrder {
  id: string;
  merchantUpiId: string;
  merchantName: string;
  baseAmount: number;
  expectedAmount: number;
  refNote: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  verifiedAt?: number;
  matchedUtr?: string;
  matchedBank?: string;
  matchedSender?: string;
  matchTier?: 'TIER_1_REMARK' | 'TIER_2_MICRO_OFFSET' | 'TIER_3_UTR_FALLBACK';
  webhookUrl?: string;
  webhookStatus?: 'PENDING' | 'SENT' | 'FAILED';
  metadata?: Record<string, any>;
  customerEmail?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'ORDER_CREATED' | 'ALERT_RECEIVED' | 'VERIFIED' | 'COLLISION_RESOLVED' | 'WEBHOOK_SENT' | 'UNMATCHED';
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
  private orders: Map<string, PaymentOrder> = new Map();
  private verifiedUTRs: Map<string, string> = new Map(); // utr -> orderId
  private logs: ActivityLog[] = [];
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private microOffsetCounter = 0;

  constructor() {
    // Start periodic background cleaner for expired orders
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupExpiredOrders(), 60000);
    }
  }

  /**
   * Generates a 5-character random alphanumeric reference ID
   */
  private generateRefId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
  public createOrder(params: CreateOrderParams): { order: PaymentOrder; upiIntentUri: string } {
    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
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

    this.orders.set(orderId, order);

    // Standard NPCI UPI Intent URI format
    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
      merchantName
    )}&am=${expectedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(refCode)}`;

    this.addLog({
      type: 'ORDER_CREATED',
      message: `Created order ${orderId} for ₹${expectedAmount} (Ref: ${refCode})`,
      details: { orderId, expectedAmount, refCode, merchantUpiId },
    });

    this.emitEvent('order_created', { order, upiIntentUri });

    return { order, upiIntentUri };
  }

  public getOrder(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  public getAllOrders(): PaymentOrder[] {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getLogs(): ActivityLog[] {
    return [...this.logs];
  }

  /**
   * 3-Tier resolution matching an incoming bank alert to pending orders
   */
  public processBankAlert(alert: ParsedUPIAlert): { matched: boolean; order?: PaymentOrder; tier?: string } {
    this.addLog({
      type: 'ALERT_RECEIVED',
      message: `Received ${alert.bank} alert: ₹${alert.amount} (UTR: ${alert.utr || 'N/A'}, Remark: ${alert.remark || 'None'})`,
      details: alert,
    });

    if (alert.utr && this.verifiedUTRs.has(alert.utr)) {
      console.log(`[OrderManager] UTR ${alert.utr} already claimed by order ${this.verifiedUTRs.get(alert.utr)}`);
      return { matched: false };
    }

    const pendingOrders = Array.from(this.orders.values()).filter((o) => o.status === 'PENDING');

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

    this.addLog({
      type: 'UNMATCHED',
      message: `Unmatched alert for ₹${alert.amount} (UTR: ${alert.utr})`,
      details: alert,
    });

    return { matched: false };
  }

  /**
   * Manual fallback verification by 12-digit UTR
   */
  public verifyByManualUtr(orderId: string, utr: string): { success: boolean; order?: PaymentOrder; message: string } {
    const cleanUtr = (utr || '').replace(/\D/g, '');
    if (cleanUtr.length !== 12) {
      return { success: false, message: 'Invalid UTR format. Must be a 12-digit number.' };
    }

    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    if (order.status === 'VERIFIED') {
      return { success: true, order, message: 'Order is already verified.' };
    }

    if (this.verifiedUTRs.has(cleanUtr) && this.verifiedUTRs.get(cleanUtr) !== orderId) {
      return { success: false, message: 'This UTR has already been claimed for another order.' };
    }

    const mockAlert: ParsedUPIAlert = {
      bank: 'Customer Claimed',
      amount: order.expectedAmount,
      utr: cleanUtr,
      sender: 'Customer Submission',
      date: new Date().toLocaleString('en-IN'),
      receivedAt: Date.now(),
      rawSnippet: `Manual UTR submission: ${cleanUtr}`,
      isValid: true,
    };

    const result = this.confirmVerification(order, mockAlert, 'TIER_3_UTR_FALLBACK');
    return { success: true, order: result.order, message: 'Payment verified successfully!' };
  }

  /**
   * Marks order as verified, updates indices, triggers webhook & SSE event
   */
  private confirmVerification(
    order: PaymentOrder,
    alert: ParsedUPIAlert,
    tier: 'TIER_1_REMARK' | 'TIER_2_MICRO_OFFSET' | 'TIER_3_UTR_FALLBACK'
  ) {
    order.status = 'VERIFIED';
    order.verifiedAt = Date.now();
    order.matchedUtr = alert.utr;
    order.matchedBank = alert.bank;
    order.matchedSender = alert.sender;
    order.matchTier = tier;

    if (alert.utr) {
      this.verifiedUTRs.set(alert.utr, order.id);
    }

    this.addLog({
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
      }).then((res) => {
        order.webhookStatus = res.success ? 'SENT' : 'FAILED';
        this.addLog({
          type: 'WEBHOOK_SENT',
          message: `Webhook dispatch ${res.success ? 'succeeded' : 'failed'} for order ${order.id}`,
          details: res,
        });
      });
    }

    return { matched: true, order, tier };
  }

  private addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const fullLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
      ...log,
    };
    this.logs.unshift(fullLog);
    if (this.logs.length > 100) this.logs.pop();
    this.emitEvent('log', fullLog);
  }

  private cleanupExpiredOrders() {
    const now = Date.now();
    for (const [id, order] of this.orders.entries()) {
      if (order.status === 'PENDING' && order.expiresAt < now) {
        order.status = 'EXPIRED';
        this.emitEvent('order_expired', { orderId: id });
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

export const orderManager = new OrderManager();
