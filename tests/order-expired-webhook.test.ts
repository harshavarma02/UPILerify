import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, test } from 'node:test';
import { MemoryAdapter } from '../lib/storage/storageAdapter';
import type { StorageAdapter } from '../lib/storage/storageAdapter';
import type { PaymentOrder } from '../lib/engine/types';
import { WebhookDispatcher } from '../lib/webhooks/webhookDispatcher';
import type { WebhookPayload } from '../lib/webhooks/webhookDispatcher';
import { dispatchOrderWebhook } from '../lib/webhooks/orderWebhook';

const originalEnv = { ...process.env };
const databasePath = join(tmpdir(), `upilerify-expiry-${crypto.randomUUID()}.db`);
process.env.DATABASE_PATH = databasePath;
const { OrderManager, orderManager } = require('../lib/engine/orderManager') as typeof import('../lib/engine/orderManager');

beforeEach(() => {
  process.env.WEBHOOK_SECRET = 'expiration-test-secret';
  delete process.env.WEBHOOK_URL;
  delete process.env.WEBHOOK_ALLOWED_HOSTS;
  delete process.env.ALLOW_PRIVATE_WEBHOOK_TARGETS;
});
after(() => {
  (orderManager as unknown as { storage: StorageAdapter }).storage.close?.();
  for (const suffix of ['', '-wal', '-shm']) rmSync(databasePath + suffix, { force: true });
  process.env = originalEnv;
});

// Match the durable adapter's snapshot semantics instead of sharing references.
class SnapshotStorage extends MemoryAdapter {
  async getOrder(id: string) {
    return structuredClone(await super.getOrder(id));
  }
  async getAllOrders() {
    return structuredClone(await super.getAllOrders());
  }
  async saveOrder(order: PaymentOrder) {
    await super.saveOrder(structuredClone(order));
  }
}

function order(id: string, overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id, merchantUpiId: 'merchant@upi', merchantName: 'Test Merchant',
    baseAmount: 100, expectedAmount: 100.01, refNote: `REF-${id}`,
    status: 'PENDING', createdAt: 1, expiresAt: Date.now() - 1000,
    webhookUrl: 'https://merchant.example/webhooks', ...overrides,
  };
}

function cleanup(manager: InstanceType<typeof OrderManager>) {
  return (manager as unknown as { cleanupExpiredOrders(): Promise<void> }).cleanupExpiredOrders();
}

test('expiration sends the persisted order with the existing HMAC signature and SSE event', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  process.env.WEBHOOK_URL = 'https://merchant.example/webhooks';
  const { order: created } = await manager.createOrder({ amount: 100, customNote: 'REF-test' });
  await storage.saveOrder({ ...created, expectedAmount: 100.01, expiresAt: Date.now() - 1000 });
  const events: unknown[] = [];
  manager.subscribe((event, data) => {
    if (event === 'order_expired') events.push(data);
  });
  t.mock.method(dns, 'lookup', async () => [{ address: '93.184.216.34', family: 4 }]);
  const request = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options: RequestInit = {}) => {
    assert.equal(url, process.env.WEBHOOK_URL);
    assert.equal((await storage.getOrder(created.id))?.status, 'EXPIRED');
    const body = String(options.body);
    const payload = JSON.parse(body);
    assert.equal(payload.event, 'order.expired');
    assert.equal(payload.order.id, created.id);
    assert.equal(payload.order.amount, 100);
    assert.equal(payload.order.expectedAmount, 100.01);
    assert.equal(payload.order.refNote, 'REF-test');
    assert.equal(payload.order.status, 'EXPIRED');
    assert.equal(typeof payload.timestamp, 'number');
    const headers = new Headers(options.headers);
    assert.equal(headers.get('X-Upilerify-Event'), 'order.expired');
    assert.equal(headers.get('X-Upilerify-Signature'),
      crypto.createHmac('sha256', process.env.WEBHOOK_SECRET!).update(body).digest('hex'));
    assert.equal(options.redirect, 'error');
    return new Response('', { status: 200 });
  });
  await cleanup(manager);
  await cleanup(manager);
  assert.equal(request.mock.callCount(), 1);
  assert.deepEqual(events, [{ orderId: created.id }]);
  assert.equal((await storage.getOrder(created.id))?.webhookStatus, 'SENT');
  assert.ok((await storage.getRecentLogs(10)).some(log => log.type === 'WEBHOOK_SENT'));
});

test('preserves existing eligibility and expires orders without a webhook', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  for (const item of [
    order('no-webhook', { webhookUrl: undefined }),
    order('future', { expiresAt: Date.now() + 60_000 }),
    order('verified', { status: 'VERIFIED' }),
    order('claimed', { status: 'CLAIMED' }),
    order('expired', { status: 'EXPIRED' }),
  ]) await storage.saveOrder(item);
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch');
  await cleanup(manager);
  assert.equal(dispatch.mock.callCount(), 0);
  for (const [id, status] of [
    ['no-webhook', 'EXPIRED'], ['future', 'PENDING'], ['verified', 'VERIFIED'],
    ['claimed', 'CLAIMED'], ['expired', 'EXPIRED'],
  ]) assert.equal((await storage.getOrder(id))?.status, status);
});

test('failed deliveries do not prevent other orders from expiring', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  await storage.saveOrder(order('first'));
  await storage.saveOrder(order('second'));
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch',
    async () => ({ success: false, statusCode: 503 }));
  await cleanup(manager);
  await cleanup(manager);
  assert.equal(dispatch.mock.callCount(), 2);
  for (const id of ['first', 'second']) {
    assert.equal((await storage.getOrder(id))?.status, 'EXPIRED');
    assert.equal((await storage.getOrder(id))?.webhookStatus, 'FAILED');
  }
});

test('a failed expiration save sends no webhook and releases the cleanup guard', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  await storage.saveOrder(order('save-failure'));
  const events: string[] = [];
  manager.subscribe(event => events.push(event));
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch',
    async () => ({ success: true, statusCode: 200 }));
  const save = t.mock.method(storage, 'saveOrder', async () => {
    throw new Error('Storage unavailable');
  });
  await assert.rejects(cleanup(manager), /Storage unavailable/);
  assert.equal(dispatch.mock.callCount(), 0);
  assert.deepEqual(events, []);
  assert.equal((await storage.getOrder('save-failure'))?.status, 'PENDING');
  save.mock.restore();
  await cleanup(manager);
  assert.equal(dispatch.mock.callCount(), 1);
  assert.equal((await storage.getOrder('save-failure'))?.status, 'EXPIRED');
});

test('overlapping cleanup does not duplicate delivery or expire a newly verified order', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  await storage.saveOrder(order('first'));
  await storage.saveOrder(order('second'));
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const entered = new Promise<void>(resolve => { started = resolve; });
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch', async () => {
    started();
    await pending;
    return { success: true, statusCode: 200 };
  });
  const running = cleanup(manager);
  await entered;
  try {
    await cleanup(manager);
    await storage.saveOrder(order('second', { status: 'VERIFIED' }));
  } finally {
    release();
  }
  await running;
  assert.equal(dispatch.mock.callCount(), 1);
  assert.equal((await storage.getOrder('second'))?.status, 'VERIFIED');
});

test('missing signing secret fails closed without making a network request', async (t) => {
  delete process.env.WEBHOOK_SECRET;
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  await storage.saveOrder(order('unsigned'));
  const request = t.mock.method(globalThis, 'fetch');
  await cleanup(manager);
  assert.equal(request.mock.callCount(), 0);
  assert.equal((await storage.getOrder('unsigned'))?.webhookStatus, 'FAILED');
});

test('an unexpected dispatcher rejection does not abort the cleanup batch', async (t) => {
  const storage = new SnapshotStorage();
  const manager = new OrderManager(storage);
  await storage.saveOrder(order('first'));
  await storage.saveOrder(order('second'));
  const errorLog = t.mock.method(console, 'error', () => {});
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch', async () => {
    throw new Error('Unexpected delivery error');
  });
  await cleanup(manager);
  await cleanup(manager);
  assert.equal(dispatch.mock.callCount(), 2);
  assert.equal(errorLog.mock.callCount(), 2);
  assert.equal((await storage.getOrder('first'))?.status, 'EXPIRED');
  assert.equal((await storage.getOrder('second'))?.status, 'EXPIRED');
});

test('payment verification retains its existing webhook fields', async (t) => {
  const storage = new SnapshotStorage();
  const verified = order('paid', {
    status: 'VERIFIED', matchedUtr: '123456789012', matchedBank: 'HDFC',
    matchedSender: 'Customer', verifiedAt: 1234, metadata: { product: 'test' },
  });
  await storage.saveOrder(verified);
  const dispatch = t.mock.method(WebhookDispatcher, 'dispatch', async (_url: string, payload: WebhookPayload) => {
    assert.equal(payload.event, 'payment.verified');
    assert.equal(payload.order.utr, verified.matchedUtr);
    assert.equal(payload.order.bank, verified.matchedBank);
    assert.equal(payload.order.sender, verified.matchedSender);
    assert.equal(payload.order.verifiedAt, verified.verifiedAt);
    assert.deepEqual(payload.order.metadata, verified.metadata);
    return { success: true, statusCode: 200 };
  });
  await dispatchOrderWebhook(verified, 'payment.verified', storage, async () => {});
  assert.equal(dispatch.mock.callCount(), 1);
  assert.equal((await storage.getOrder('paid'))?.webhookStatus, 'SENT');
});
