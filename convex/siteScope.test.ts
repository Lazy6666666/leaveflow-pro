import { describe, expect, it } from "vitest";

import {
  collectEmployeeIdsForSiteScope,
  filterProfilesBySiteScope,
  filterRecordsBySiteScope,
  findMatchingSiteGeofence,
} from "./siteScope";

describe("findMatchingSiteGeofence", () => {
  it("returns the matching active site when a location falls inside its geofence", () => {
    const match = findMatchingSiteGeofence(
      [
        {
          _id: "site-a",
          name: "HQ",
          isActive: true,
          geofenceCenter: { lat: 14.5995, lng: 120.9842 },
          geofenceRadiusMeters: 300,
        },
        {
          _id: "site-b",
          name: "Remote Hub",
          isActive: true,
          geofenceCenter: { lat: 14.676, lng: 121.0437 },
          geofenceRadiusMeters: 150,
        },
      ],
      { lat: 14.5997, lng: 120.9843 },
    );

    expect(match?._id).toBe("site-a");
  });

  it("ignores inactive or unconfigured sites", () => {
    const match = findMatchingSiteGeofence(
      [
        {
          _id: "inactive-site",
          name: "Inactive",
          isActive: false,
          geofenceCenter: { lat: 14.5995, lng: 120.9842 },
          geofenceRadiusMeters: 300,
        },
        {
          _id: "missing-geo",
          name: "Missing Geofence",
          isActive: true,
        },
      ],
      { lat: 14.5995, lng: 120.9842 },
    );

    expect(match).toBeNull();
  });
});

describe("filterRecordsBySiteScope", () => {
  const records = [
    { id: "1", siteId: "site-a" },
    { id: "2", siteId: "site-b" },
    { id: "3", siteId: undefined },
  ];

  it("keeps all records when there is no site restriction", () => {
    expect(filterRecordsBySiteScope(records, null)).toEqual(records);
  });

  it("limits records to the accessible site list", () => {
    expect(filterRecordsBySiteScope(records, ["site-b"])).toEqual([{ id: "2", siteId: "site-b" }]);
  });

  it("applies the requested site filter on top of the accessible scope", () => {
    expect(filterRecordsBySiteScope(records, null, "site-a")).toEqual([{ id: "1", siteId: "site-a" }]);
  });
});

describe("collectEmployeeIdsForSiteScope", () => {
  const profiles = [
    { userId: "emp-a", siteId: "site-a" },
    { userId: "emp-b", siteId: null },
    { userId: "emp-c", siteId: "site-c" },
  ];

  const logs = [
    { employeeId: "emp-b", siteId: "site-b" },
    { employeeId: "emp-d", siteId: "site-a" },
  ];

  it("includes employees matched by profile or attendance history for the scoped sites", () => {
    expect(Array.from(collectEmployeeIdsForSiteScope(profiles, logs, ["site-a", "site-b"])).sort()).toEqual([
      "emp-a",
      "emp-b",
      "emp-d",
    ]);
  });

  it("narrows to the requested site when provided", () => {
    expect(Array.from(collectEmployeeIdsForSiteScope(profiles, logs, null, "site-a")).sort()).toEqual([
      "emp-a",
      "emp-d",
    ]);
  });
});

describe("filterProfilesBySiteScope", () => {
  it("keeps only profiles that belong to the requested site scope", () => {
    const profiles = [
      { userId: "emp-a", siteId: "site-a" },
      { userId: "emp-b", siteId: null },
      { userId: "emp-c", siteId: "site-c" },
    ];
    const logs = [{ employeeId: "emp-b", siteId: "site-b" }];

    expect(filterProfilesBySiteScope(profiles, logs, ["site-b"])).toEqual([{ userId: "emp-b", siteId: null }]);
  });
});
