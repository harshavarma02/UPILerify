/**
 * UPILerify — SQLite Storage Adapter (Phase 5)
 *
 * Default persistent store. Zero-config, file-based, WAL mode for concurrent
 * read performance. Database path comes from DATABASE_PATH (default
 * ./data/upilerify.db).
 *
 * Schema:
 *   orders        — full PaymentOrder JSON (metadata etc. serialize naturally)
 *                   with status/createdAt extracted as indexed columns
 *   verified_utrs — one row per UTR: owner + state (CLAIMED → VERIFIED).
 *                   This is the durable dedup index that blocks replaying a
 *                   UTR across restarts.
 *   activity_logs — append-only audit trail, newest first on read
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import type { PaymentOrder, ActivityLog } from '../engine/orderManager';
import type { StorageAdapter } from './storageAdapter';

export class SqliteAdapter implements StorageAdapter {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolved = dbPath || process.env.DATABASE_PATH || './data/upilerify.db';
    const absolute = path.resolve(resolved);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });

    this.db = new Database(absolute);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

      CREATE TABLE IF NOT EXISTS verified_utrs (
        utr TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'CLAIMED',
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT
      );
    `);
  }

  async getOrder(orderId: string): Promise<PaymentOrder | undefined> {
    const row = this.db.prepare('SELECT data FROM orders WHERE id = ?').get(orderId) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as PaymentOrder) : undefined;
  }

  async getAllOrders(): Promise<PaymentOrder[]> {
    const rows = this.db.prepare('SELECT data FROM orders ORDER BY created_at DESC').all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as PaymentOrder);
  }

  async saveOrder(order: PaymentOrder): Promise<void> {
    this.db
      .prepare('INSERT OR REPLACE INTO orders (id, status, created_at, data) VALUES (?, ?, ?, ?)')
      .run(order.id, order.status, order.createdAt, JSON.stringify(order));
  }

  async deleteOrder(orderId: string): Promise<void> {
    this.db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
  }

  async getUtrOwner(utr: string): Promise<string | undefined> {
    const row = this.db.prepare('SELECT order_id FROM verified_utrs WHERE utr = ?').get(utr) as
      | { order_id: string }
      | undefined;
    return row?.order_id;
  }

  async claimUtr(utr: string, orderId: string): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO verified_utrs (utr, order_id, state, updated_at) VALUES (?, ?, 'CLAIMED', ?)
         ON CONFLICT(utr) DO UPDATE SET state = 'CLAIMED', updated_at = excluded.updated_at`
      )
      .run(utr, orderId, Date.now());
  }

  async verifyUtr(utr: string, orderId: string): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO verified_utrs (utr, order_id, state, updated_at) VALUES (?, ?, 'VERIFIED', ?)
         ON CONFLICT(utr) DO UPDATE SET state = 'VERIFIED', updated_at = excluded.updated_at`
      )
      .run(utr, orderId, Date.now());
  }

  async addLog(log: ActivityLog): Promise<void> {
    this.db
      .prepare('INSERT INTO activity_logs (id, timestamp, type, message, details) VALUES (?, ?, ?, ?, ?)')
      .run(log.id, log.timestamp, log.type, log.message, log.details ? JSON.stringify(log.details) : null);
  }

  async getRecentLogs(limit: number): Promise<ActivityLog[]> {
    const rows = this.db
      .prepare('SELECT id, timestamp, type, message, details FROM activity_logs ORDER BY seq DESC LIMIT ?')
      .all(limit) as Array<{ id: string; timestamp: number; type: string; message: string; details: string | null }>;
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      type: r.type as ActivityLog['type'],
      message: r.message,
      details: r.details ? JSON.parse(r.details) : undefined,
    }));
  }

  close(): void {
    this.db.close();
  }
}