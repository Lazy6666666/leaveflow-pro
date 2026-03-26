import * as SecureStore from "expo-secure-store";

const QUEUE_KEY = "leaveflow-mobile-offline-queue";

export type MobileOfflineEventType = "clock_in" | "clock_out";

export type MobileOfflineLocationData = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type MobileOfflineAttendanceEvent = {
  offlineSyncId: string;
  eventType: MobileOfflineEventType;
  timestamp: number;
  logId?: string;
  locationData?: MobileOfflineLocationData;
  selfieUri?: string;
};

async function readQueue() {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  if (!raw) {
    return [] as MobileOfflineAttendanceEvent[];
  }

  try {
    const parsed = JSON.parse(raw) as MobileOfflineAttendanceEvent[];
    return parsed
      .filter((item) => item && typeof item.offlineSyncId === "string")
      .sort((left, right) => left.timestamp - right.timestamp);
  } catch {
    return [];
  }
}

async function writeQueue(events: MobileOfflineAttendanceEvent[]) {
  if (events.length === 0) {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
    return;
  }

  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(events));
}

export function createOfflineEventId() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueueOfflineAttendanceEvent(
  event: MobileOfflineAttendanceEvent,
) {
  const current = await readQueue();
  current.push(event);
  await writeQueue(current);
}

export async function getPendingOfflineAttendanceEvents() {
  return readQueue();
}

export async function getOfflineQueueStatus() {
  const current = await readQueue();
  return {
    pending: current.length,
  };
}

export async function dequeueOfflineAttendanceEvent(offlineSyncId: string) {
  const current = await readQueue();
  const next = current.filter((item) => item.offlineSyncId !== offlineSyncId);
  await writeQueue(next);
}

export async function clearOfflineAttendanceQueue() {
  await SecureStore.deleteItemAsync(QUEUE_KEY);
}
