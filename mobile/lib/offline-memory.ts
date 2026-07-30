import * as SQLite from 'expo-sqlite';
import type { MemoryAddRequest, MemoryOutboxStore, PendingMemoryEntry } from '@noa/api-client';

const databasePromise = SQLite.openDatabaseAsync('noa-mobile.db');
let initialized = false;

async function database() {
  const db = await databasePromise;
  if (!initialized) {
    await db.execAsync('CREATE TABLE IF NOT EXISTS pending_memory (id TEXT PRIMARY KEY NOT NULL, created_at INTEGER NOT NULL, payload TEXT NOT NULL);');
    initialized = true;
  }
  return db;
}

export async function queueMemory(payload: MemoryAddRequest): Promise<void> {
  const db = await database();
  const id = `memory-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await db.runAsync('INSERT INTO pending_memory (id, created_at, payload) VALUES (?, ?, ?)', id, Date.now(), JSON.stringify(payload));
}

export const memoryOutbox: MemoryOutboxStore = {
  async list(): Promise<PendingMemoryEntry[]> {
    const db = await database();
    const rows = await db.getAllAsync<{ id: string; created_at: number; payload: string }>('SELECT * FROM pending_memory ORDER BY created_at ASC');
    return rows.map((row) => ({ id: row.id, createdAt: row.created_at, payload: JSON.parse(row.payload) as MemoryAddRequest }));
  },
  async remove(id: string): Promise<void> {
    const db = await database();
    await db.runAsync('DELETE FROM pending_memory WHERE id = ?', id);
  },
};
