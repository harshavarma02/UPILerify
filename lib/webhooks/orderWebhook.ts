import type { ActivityLog, PaymentOrder } from '../engine/types';
import type { StorageAdapter } from '../storage/storageAdapter';
import { WebhookDispatcher } from './webhookDispatcher';

/** Share signing, payload fields, and delivery tracking across order events. */
export async function dispatchOrderWebhook(
  order: PaymentOrder,
  event: 'payment.verified' | 'order.expired',
  storage: StorageAdapter,
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>
): Promise<void> {
  if (!order.webhookUrl) return;

  try {
    const result = await WebhookDispatcher.dispatch(order.webhookUrl, {
      event,
      timestamp: Date.now(),
      order: {
        id: order.id,
        amount: order.baseAmount,
        expectedAmount: order.expectedAmount,
        refNote: order.refNote,
        merchantUpiId: order.merchantUpiId,
        status: order.status,
        metadata: order.metadata,
        ...(event === 'payment.verified' ? {
          utr: order.matchedUtr,
          bank: order.matchedBank,
          sender: order.matchedSender,
          verifiedAt: order.verifiedAt,
        } : {}),
      },
    });
    // Re-read to avoid overwriting lifecycle changes made during delivery.
    const current = await storage.getOrder(order.id);
    if (current) {
      current.webhookStatus = result.success ? 'SENT' : 'FAILED';
      await storage.saveOrder(current);
    }
    await addLog({
      type: 'WEBHOOK_SENT',
      message: `${event} webhook ${result.success ? 'succeeded' : 'failed'} for order ${order.id}`,
      details: result,
    });
  } catch (error) {
    // A delivery or storage failure must not stop expiration of other orders.
    console.error(`[OrderManager] ${event} webhook failed for order ${order.id}:`, error);
  }
}
