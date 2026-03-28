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
import type * as adminBalances from "../adminBalances.js";
import type * as adminBiometrics from "../adminBiometrics.js";
import type * as adminBiometricsHelpers from "../adminBiometricsHelpers.js";
import type * as adminCore from "../adminCore.js";
import type * as adminReports from "../adminReports.js";
import type * as agents_configs from "../agents/configs.js";
import type * as agents_leaveAgent from "../agents/leaveAgent.js";
import type * as agents_leaveTools from "../agents/leaveTools.js";
import type * as agents_mcpServer from "../agents/mcpServer.js";
import type * as agents_skills_attendanceAnomalySkill from "../agents/skills/attendanceAnomalySkill.js";
import type * as agents_skills_hrFaqSkill from "../agents/skills/hrFaqSkill.js";
import type * as agents_skills_policySkill from "../agents/skills/policySkill.js";
import type * as agents_toolRegistry from "../agents/toolRegistry.js";
import type * as analytics from "../analytics.js";
import type * as assistant from "../assistant.js";
import type * as assistantRateLimits from "../assistantRateLimits.js";
import type * as assistantReplies from "../assistantReplies.js";
import type * as assistantTypes from "../assistantTypes.js";
import type * as assistantUtils from "../assistantUtils.js";
import type * as attendance from "../attendance.js";
import type * as attendanceAdmin from "../attendanceAdmin.js";
import type * as attendanceEmployee from "../attendanceEmployee.js";
import type * as attendanceHelpers from "../attendanceHelpers.js";
import type * as backendIncidents from "../backendIncidents.js";
import type * as careers from "../careers.js";
import type * as careersSync from "../careersSync.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as documentExpiry from "../documentExpiry.js";
import type * as documentExpiryHelpers from "../documentExpiryHelpers.js";
import type * as expenses from "../expenses.js";
import type * as faceVerification from "../faceVerification.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as httpRateLimits from "../httpRateLimits.js";
import type * as httpSecurity from "../httpSecurity.js";
import type * as insights from "../insights.js";
import type * as integrations from "../integrations.js";
import type * as leave from "../leave.js";
import type * as leaveNotificationEmails from "../leaveNotificationEmails.js";
import type * as leaveNotifications from "../leaveNotifications.js";
import type * as lib_aiScaling from "../lib/aiScaling.js";
import type * as lib_analytics from "../lib/analytics.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_storage from "../lib/storage.js";
import type * as lib_types from "../lib/types.js";
import type * as manager from "../manager.js";
import type * as notificationScheduler from "../notificationScheduler.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as payroll from "../payroll.js";
import type * as payrollHelpers from "../payrollHelpers.js";
import type * as performanceReviews from "../performanceReviews.js";
import type * as policyAcknowledgements from "../policyAcknowledgements.js";
import type * as rag from "../rag.js";
import type * as rosters from "../rosters.js";
import type * as shifts from "../shifts.js";
import type * as siteScope from "../siteScope.js";
import type * as sites from "../sites.js";
import type * as training from "../training.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  absenceNotifications: typeof absenceNotifications;
  admin: typeof admin;
  adminBalances: typeof adminBalances;
  adminBiometrics: typeof adminBiometrics;
  adminBiometricsHelpers: typeof adminBiometricsHelpers;
  adminCore: typeof adminCore;
  adminReports: typeof adminReports;
  "agents/configs": typeof agents_configs;
  "agents/leaveAgent": typeof agents_leaveAgent;
  "agents/leaveTools": typeof agents_leaveTools;
  "agents/mcpServer": typeof agents_mcpServer;
  "agents/skills/attendanceAnomalySkill": typeof agents_skills_attendanceAnomalySkill;
  "agents/skills/hrFaqSkill": typeof agents_skills_hrFaqSkill;
  "agents/skills/policySkill": typeof agents_skills_policySkill;
  "agents/toolRegistry": typeof agents_toolRegistry;
  analytics: typeof analytics;
  assistant: typeof assistant;
  assistantRateLimits: typeof assistantRateLimits;
  assistantReplies: typeof assistantReplies;
  assistantTypes: typeof assistantTypes;
  assistantUtils: typeof assistantUtils;
  attendance: typeof attendance;
  attendanceAdmin: typeof attendanceAdmin;
  attendanceEmployee: typeof attendanceEmployee;
  attendanceHelpers: typeof attendanceHelpers;
  backendIncidents: typeof backendIncidents;
  careers: typeof careers;
  careersSync: typeof careersSync;
  constants: typeof constants;
  crons: typeof crons;
  documentExpiry: typeof documentExpiry;
  documentExpiryHelpers: typeof documentExpiryHelpers;
  expenses: typeof expenses;
  faceVerification: typeof faceVerification;
  files: typeof files;
  http: typeof http;
  httpRateLimits: typeof httpRateLimits;
  httpSecurity: typeof httpSecurity;
  insights: typeof insights;
  integrations: typeof integrations;
  leave: typeof leave;
  leaveNotificationEmails: typeof leaveNotificationEmails;
  leaveNotifications: typeof leaveNotifications;
  "lib/aiScaling": typeof lib_aiScaling;
  "lib/analytics": typeof lib_analytics;
  "lib/auth": typeof lib_auth;
  "lib/emailTemplates": typeof lib_emailTemplates;
  "lib/env": typeof lib_env;
  "lib/storage": typeof lib_storage;
  "lib/types": typeof lib_types;
  manager: typeof manager;
  notificationScheduler: typeof notificationScheduler;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  payroll: typeof payroll;
  payrollHelpers: typeof payrollHelpers;
  performanceReviews: typeof performanceReviews;
  policyAcknowledgements: typeof policyAcknowledgements;
  rag: typeof rag;
  rosters: typeof rosters;
  shifts: typeof shifts;
  siteScope: typeof siteScope;
  sites: typeof sites;
  training: typeof training;
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
