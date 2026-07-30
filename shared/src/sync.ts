import type { MemoryAddRequest } from './types.js';
import type { NoaClient } from './client.js';

export interface PendingMemoryEntry {
  id: string;
  createdAt: number;
  payload: MemoryAddRequest;
}

/**
 * Platform-neutral outbox contract. Clients persist only explicit memory writes
 * offline; chat, tool execution, and autonomous actions are never replayed.
 */
export interface MemoryOutboxStore {
  list(): Promise<PendingMemoryEntry[]>;
  remove(id: string): Promise<void>;
}

export async function syncPendingMemory(client: NoaClient, store: MemoryOutboxStore): Promise<{ synced: string[]; failed: string[] }> {
  const entries = await store.list();
  const synced: string[] = [];
  const failed: string[] = [];
  for (const entry of entries) {
    try {
      await client.addMemory(entry.payload);
      await store.remove(entry.id);
      synced.push(entry.id);
    } catch {
      failed.push(entry.id);
    }
  }
  return { synced, failed };
}
