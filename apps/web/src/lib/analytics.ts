import type { BeforeSendFn, PostHog, PostHogConfig } from "posthog-js";
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
  syntax_colors_changed: { scheme: string };
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
  before_send: (event) => (isBenignBrowserError(event) ? null : scrubUrls(event)),
};

// Chrome's and Firefox's wording, and the older "limit exceeded" Chrome used before version 109.
const RESIZE_OBSERVER_LOOP = /^ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;

/**
 * Exceptions that are expected and harmless, so they never reach error tracking:
 * - Monaco rejects in-flight work with `Canceled` when the editor switches models.
 * - The browser reports a ResizeObserver loop when a resize callback (Monaco's automaticLayout) changes layout
 *   again in the same frame; the remaining notifications are simply delivered in the next frame.
 */
function isBenignBrowserError(event: Parameters<typeof scrubUrls>[0]): boolean {
  if (!event || event.event !== "$exception") return false;
  const list = (event.properties?.$exception_list ?? []) as Array<{ type?: string; value?: string }>;
  return (
    list.length > 0 &&
    list.every(
      (entry) =>
        entry.type === "Canceled" ||
        entry.value === "Canceled" ||
        (typeof entry.value === "string" && RESIZE_OBSERVER_LOOP.test(entry.value)),
    )
  );
}

/**
 * Do Not Track and Global Privacy Control turn analytics off entirely. PostHog's own
 * `respect_dnt` is ignored in cookieless "always" mode, so the check happens before init.
 */
export function prefersNoTracking(nav: Navigator = navigator): boolean {
  const { doNotTrack, globalPrivacyControl } = nav as Navigator & { globalPrivacyControl?: boolean };
  return doNotTrack === "1" || globalPrivacyControl === true;
}

type AnalyticsClient = Pick<PostHog, "capture">;

// PostHog loads after the page is interactive (instrumentation-client.ts), so its ~120 KB never
// competes with hydration. Events from before then wait here, bounded, and are sent once it loads.
const MAX_QUEUED_EVENTS = 50;
let client: AnalyticsClient | null = null;
// Each held event keeps the page and time it happened on, not those of when PostHog loads.
let queue: Array<{ event: string; properties: Record<string, unknown>; url: string; at: Date }> = [];

export function setAnalyticsClient(next: AnalyticsClient | null) {
  client = next;
  if (!next) {
    queue = [];
    return;
  }
  const pending = queue;
  queue = [];
  for (const { event, properties, url, at } of pending) {
    next.capture(event, { ...properties, $current_url: url }, { timestamp: at });
  }
}

export function track<E extends keyof AnalyticsEvents>(event: E, properties: AnalyticsEvents[E]) {
  if (client) {
    client.capture(event, properties);
    return;
  }
  // Only production builds load PostHog; elsewhere nothing would ever drain the queue.
  if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "1" && queue.length < MAX_QUEUED_EVENTS) {
    queue.push({ event, properties, url: window.location.href, at: new Date() });
  }
}
