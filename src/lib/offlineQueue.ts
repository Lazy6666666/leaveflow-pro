import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Id } from '../../convex/_generated/dataModel';

export type OfflineEventType = 'clock_in' | 'clock_out';

export interface OfflineAttendanceEvent {
  offlineSyncId: string;
  eventType: OfflineEventType;
  timestamp: number;
  locationData?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  selfieBlob?: Blob;
  logId?: string; // Optional: Only available if clocking out after an online clock-in
}

interface OfflineAttendanceDB extends DBSchema {
  events: {
    key: string;
    value: OfflineAttendanceEvent;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'balance-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'events';

let dbPromise: Promise<IDBPDatabase<OfflineAttendanceDB>> | null = null;

function getDb(): Promise<IDBPDatabase<OfflineAttendanceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineAttendanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'offlineSyncId' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Enqueue a new attendance event to IndexedDB
 */
export async function enqueueAttendanceEvent(event: OfflineAttendanceEvent): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, event);
}

/**
 * Get the current queue status (count of pending items)
 */
export async function getQueueStatus(): Promise<{ pending: number }> {
  try {
    const db = await getDb();
    const count = await db.count(STORE_NAME);
    return { pending: count };
  } catch (err) {
    console.error("Failed to read offline queue status:", err);
    return { pending: 0 };
  }
}

/**
 * Peek at all pending items, ordered by timestamp
 */
export async function getPendingEvents(): Promise<OfflineAttendanceEvent[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

/**
 * Mark an event as synced by removing it from the queue
 */
export async function dequeueAttendanceEvent(offlineSyncId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, offlineSyncId);
}

/**
 * Clear the entire queue (use carefully)
 */
export async function clearQueue(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}
