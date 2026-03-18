type LatLng = { lat: number; lng: number };

export type SiteScopeCandidate = {
  _id: string;
  name: string;
  geofenceCenter?: LatLng | null;
  geofenceRadiusMeters?: number | null;
  isActive?: boolean;
};

export type SiteScopedProfileCandidate = {
  userId: string;
  siteId?: string | null;
};

export type SiteScopedAttendanceCandidate = {
  employeeId: string;
  siteId?: string | null;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(from: LatLng, to: LatLng) {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasConfiguredSiteGeofence(site: SiteScopeCandidate) {
  return !!site.geofenceCenter && !!site.geofenceRadiusMeters && site.geofenceRadiusMeters > 0;
}

export function findMatchingSiteGeofence(
  sites: SiteScopeCandidate[],
  location?: LatLng | null,
) {
  if (!location) {
    return null;
  }

  return (
    sites
      .filter((site) => site.isActive !== false && hasConfiguredSiteGeofence(site))
      .find((site) => getDistanceMeters(location, site.geofenceCenter! as LatLng) <= (site.geofenceRadiusMeters as number)) ?? null
  );
}

export function filterRecordsBySiteScope<T extends { siteId?: string | null }>(
  records: T[],
  accessibleSiteIds: string[] | null,
  requestedSiteId?: string,
): T[] {
  return records.filter((record) => {
    if (accessibleSiteIds && !record.siteId) {
      return false;
    }
    if (accessibleSiteIds && !accessibleSiteIds.includes(record.siteId ?? "")) {
      return false;
    }
    if (requestedSiteId && record.siteId !== requestedSiteId) {
      return false;
    }
    return true;
  });
}

export function getEffectiveSiteScopeIds(
  accessibleSiteIds: string[] | null,
  requestedSiteId?: string,
) {
  return requestedSiteId ? [requestedSiteId] : accessibleSiteIds;
}

export function collectEmployeeIdsForSiteScope(
  profiles: SiteScopedProfileCandidate[],
  attendanceLogs: SiteScopedAttendanceCandidate[],
  accessibleSiteIds: string[] | null,
  requestedSiteId?: string,
) {
  const effectiveSiteIds = getEffectiveSiteScopeIds(accessibleSiteIds, requestedSiteId);
  if (!effectiveSiteIds) {
    return new Set(profiles.map((profile) => profile.userId));
  }

  const allowedSiteIds = new Set(effectiveSiteIds);
  const employeeIds = new Set<string>();

  for (const profile of profiles) {
    if (profile.siteId && allowedSiteIds.has(profile.siteId)) {
      employeeIds.add(profile.userId);
    }
  }

  for (const log of attendanceLogs) {
    if (log.siteId && allowedSiteIds.has(log.siteId)) {
      employeeIds.add(log.employeeId);
    }
  }

  return employeeIds;
}

export function filterProfilesBySiteScope<T extends SiteScopedProfileCandidate>(
  profiles: T[],
  attendanceLogs: SiteScopedAttendanceCandidate[],
  accessibleSiteIds: string[] | null,
  requestedSiteId?: string,
) {
  const scopedEmployeeIds = collectEmployeeIdsForSiteScope(
    profiles,
    attendanceLogs,
    accessibleSiteIds,
    requestedSiteId,
  );
  return profiles.filter((profile) => scopedEmployeeIds.has(profile.userId));
}
