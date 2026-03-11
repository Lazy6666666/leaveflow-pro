/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as absenceNotifications from "../absenceNotifications.js";
import type * as admin from "../admin.js";
import type * as assistant from "../assistant.js";
import type * as attendance from "../attendance.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as leave from "../leave.js";
import type * as leaveNotificationEmails from "../leaveNotificationEmails.js";
import type * as leaveNotifications from "../leaveNotifications.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_storage from "../lib/storage.js";
import type * as lib_types from "../lib/types.js";
import type * as manager from "../manager.js";
import type * as notificationScheduler from "../notificationScheduler.js";
import type * as notifications from "../notifications.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  absenceNotifications: typeof absenceNotifications;
  admin: typeof admin;
  assistant: typeof assistant;
  attendance: typeof attendance;
  constants: typeof constants;
  crons: typeof crons;
  files: typeof files;
  http: typeof http;
  leave: typeof leave;
  leaveNotificationEmails: typeof leaveNotificationEmails;
  leaveNotifications: typeof leaveNotifications;
  "lib/auth": typeof lib_auth;
  "lib/env": typeof lib_env;
  "lib/storage": typeof lib_storage;
  "lib/types": typeof lib_types;
  manager: typeof manager;
  notificationScheduler: typeof notificationScheduler;
  notifications: typeof notifications;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
