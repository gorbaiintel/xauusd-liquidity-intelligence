import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { JournalEntry, Signal } from '../shared/types.js';

export class JournalStore {
  private db!: Database<sqlite3.Database, sqlite3.Statement>;

  async open() {
    this.db = await open({ filename: process.env.JOURNAL_DB_PATH || './data/xauusd.sqlite', driver: sqlite3.Database });
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS signal_journal (
        id TEXT PRIMARY KEY,
        time INTEGER NOT NULL,
        decision TEXT NOT NULL,
        score INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT NOT NULL,
        rationale TEXT NOT NULL,
        gates_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_signal_journal_time ON signal_journal(time DESC);
    `);
  }

  async record(candleTime: number, signal: Signal, price: number) {
    const id = `${candleTime}:${signal.decision}:${signal.score}`;
    const status = signal.decision === 'WAIT' ? 'REJECTED' : signal.score >= 70 ? 'APPROVED' : 'VALIDATING';
    await this.db.run(
      `INSERT OR IGNORE INTO signal_journal
       (id, time, decision, score, price, status, rationale, gates_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id, signal.generatedAt, signal.decision, signal.score, price, status,
      signal.reasons.at(-1) ?? 'No rationale', JSON.stringify(signal.gates),
    );
    await this.db.run(`DELETE FROM signal_journal WHERE id NOT IN (SELECT id FROM signal_journal ORDER BY time DESC LIMIT 200)`);
  }

  async recent(limit = 50): Promise<JournalEntry[]> {
    const rows = await this.db.all<Array<{ id: string; time: number; decision: JournalEntry['decision']; score: number; price: number; status: JournalEntry['status']; rationale: string; gates_json: string }>>(
      `SELECT id, time, decision, score, price, status, rationale, gates_json
       FROM signal_journal ORDER BY time DESC LIMIT ?`, limit,
    );
    return rows.map(row => ({ id: row.id, time: row.time, decision: row.decision, score: row.score, price: row.price, status: row.status, rationale: row.rationale, gates: JSON.parse(row.gates_json) as Record<string, boolean> }));
  }

  async close() { await this.db?.close(); }
}
