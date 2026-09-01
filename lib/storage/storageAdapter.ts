/**
 * UPILerify — Abstract Storage Adapter (Phase 5)
 *
 * SECURITY REMEDIATION / RESILIENCE:
 *  Decouples the verification engine from in-memory Maps so orders, UTR
 *  deduplication state and activity logs survive process restarts and give
 *  operators a durable audit trail.
 *
 * Two implementations ship:
 *  - SqliteAdapter (lib/storage/sqliteAdapter.ts) — default, zero-config, WAL
 *  - MemoryAdapter (below) — for unit tests and ephemeral environments
 */

import type { PaymentOrder, ActivityLog } from '../engine/orderManager';

export interface StorageAdapter {
  /** Orders */
  getOrder(orderId: string): Promise<PaymentOrder | undefined>;
  getAllOrders(): Promise<PaymentOrder[]>;
  saveOrder(order: PaymentOrder): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;

  /**
   * UTR deduplication — one row per UTR, owned by exactly one order.
   * `claimUtr` records a CLAIMED submission; `verifyUtr` upgrades the row to
   * VERIFIED when a real bank alert confirms it. `getUtrOwner` returns the
   * owning orderId regardless of state (dedup across CLAIMED and VERIFIED).
   */
  getUtrOwner(utr: string): Promise<string | undefined>;
  claimUtr(utr: string, orderId: string): Promise<void>;
  verifyUtr(utr: string, orderId: string): Promise<void>;

  /** Activity logs */
  addLog(log: ActivityLog): Promise<void>;
  getRecentLogs(limit: number): Promise<ActivityLog[]>;

  /** Lifecycle */
  close?(): void;
}

/**
 * Volatile in-memory implementation — used in unit tests. Deliberately NOT
 * wired into production defaults: restarts would erase UTR dedup state.
 */
export class MemoryAdapter implements StorageAdapter {
  private orders = new Map<string, PaymentOrder>();
  private utrs = new Map<string, { orderId: string; state: 'CLAIMED' | 'VERIFIED' }>();
  private logs: ActivityLog[] = [];

  async getOrder(orderId: string): Promise<PaymentOrder | undefined> {
    return this.orders.get(orderId);
  }

  async getAllOrders(): Promise<PaymentOrder[]> {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveOrder(order: PaymentOrder): Promise<void> {
    this.orders.set(order.id, order);
  }

  async deleteOrder(orderId: string): Promise<void> {
    this.orders.delete(orderId);
  }

  async getUtrOwner(utr: string): Promise<string | undefined> {
    return this.utrs.get(utr)?.orderId;
  }

  async claimUtr(utr: string, orderId: string): Promise<void> {
    this.utrs.set(utr, { orderId, state: 'CLAIMED' });
  }

  async verifyUtr(utr: string, orderId: string): Promise<void> {
    this.utrs.set(utr, { orderId, state: 'VERIFIED' });
  }

  async addLog(log: ActivityLog): Promise<void> {
    this.logs.unshift(log);
    if (this.logs.length > 500) this.logs.pop();
  }

  async getRecentLogs(limit: number): Promise<ActivityLog[]> {
    return this.logs.slice(0, limit);
  }

  close(): void {
    this.orders.clear();
    this.utrs.clear();
    this.logs = [];
  }
}