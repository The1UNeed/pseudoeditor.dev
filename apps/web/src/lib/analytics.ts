import posthog, { type BeforeSendFn, type PostHogConfig } from "posthog-js";
import { POSTHOG_HOST } from "@/lib/posthogHost";

/**
 * Events the app reports. Properties are counts and public identifiers only: never source code,
 * file names, program output, or anything about the account.
 */
export type AnalyticsEvents = {
  program_run: {
    outcome: "success" | "compile_error" | "runtime_error" | "cancelled" | "input_limit";
    diagnostics: number;
    inputs: number;
  };
  flowchart_opened: Record<string, never>;
  syntax_changed: { syntax: string };
  practice_question_opened: { question: string; source: "link" | "random" };
};

// URL properties that can carry query strings such as Clerk handshake tokens. `navigationURL`
// appears inside each web vitals metric.
const URL_PROPERTIES = ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer", "navigationURL"];

export function stripQueryAndHash(value: string): string {
  const end = value.search(/[?#]/);
  return end === -1 ? value : value.slice(0, end);
}

function scrubUrlProperties(properties: Record<string, unknown>) {
  for (const key of URL_PROPERTIES) {
    const value = properties[key];
    if (typeof value === "string") {
      properties[key] = stripQueryAndHash(value);
    }
  }
}

export const scrubUrls: BeforeSendFn = (event) => {
  scrubUrlProperties(event.properties);
  // Web vitals nest one object per metric, each carrying its own $current_url.
  for (const value of Object.values(event.properties)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      scrubUrlProperties(value);
    }
  }
  return event;
};

/**
 * Cookieless and anonymous: PostHog stores nothing on the device, counts visitors with a
 * server-side hash whose salt rotates daily, and never builds person profiles. Session replay,
 * surveys, autocapture, and remote scripts are off; error tracking and web vitals are bundled.
 */
export const posthogConfig: Partial<PostHogConfig> = {
  api_host: POSTHOG_HOST,
  defaults: "2026-08-30",
  cookieless_mode: "always",
  person_profiles: "never",
  capture_pageview: "history_change",
  capture_pageleave: true,
  capture_exceptions: true,
  // Attribution would add DOM selectors and needs a separate bundle; plain metrics are enough.
  capture_performance: { web_vitals: true, web_vitals_attribution: false, network_timing: false },
  autocapture: false,
  capture_heatmaps: false,
  capture_dead_clicks: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_product_tours: true,
  disable_conversations: true,
  disable_web_experiments: true,
  disable_external_dependency_loading: true,
  advanced_disable_flags: true,
  before_send: scrubUrls,
};

/**
 * Do Not Track and Global Privacy Control turn analytics off entirely. PostHog's own
 * `respect_dnt` is ignored in cookieless "always" mode, so the check happens before init.
 */
export function prefersNoTracking(nav: Navigator = navigator): boolean {
  const { doNotTrack, globalPrivacyControl } = nav as Navigator & { globalPrivacyControl?: boolean };
  return doNotTrack === "1" || globalPrivacyControl === true;
}

export function track<E extends keyof AnalyticsEvents>(event: E, properties: AnalyticsEvents[E]) {
  if (!posthog.__loaded) {
    return;
  }
  posthog.capture(event, properties);
}
