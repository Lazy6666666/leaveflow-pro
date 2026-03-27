export const DEFAULT_NOTIFY_DAYS_BEFORE = [90, 60, 30, 0];

export function normalizeThresholds(thresholds?: number[]) {
  const source = thresholds && thresholds.length > 0 ? thresholds : DEFAULT_NOTIFY_DAYS_BEFORE;
  return Array.from(new Set(source.filter((value) => Number.isFinite(value) && value >= 0))).sort((left, right) => right - left);
}

export function notificationDateKey(reference: Date) {
  return reference.toISOString().slice(0, 10);
}

export function resolveDaysRemaining(expiryDate: string, reference: Date) {
  const expiryUtc = Date.parse(`${expiryDate}T00:00:00.000Z`);
  const referenceUtc = Date.parse(`${notificationDateKey(reference)}T00:00:00.000Z`);
  return Math.floor((expiryUtc - referenceUtc) / 86_400_000);
}

export function resolveDocumentStatus(daysRemaining: number) {
  if (daysRemaining <= 30) {
    return "critical" as const;
  }
  if (daysRemaining <= 90) {
    return "warning" as const;
  }
  return "good" as const;
}

export function matchNotificationThreshold(daysRemaining: number, thresholds?: number[]) {
  const normalized = normalizeThresholds(thresholds);
  if (daysRemaining <= 0 && normalized.includes(0)) {
    return 0;
  }
  return normalized.find((threshold) => threshold === daysRemaining) ?? null;
}
