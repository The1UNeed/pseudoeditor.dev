// Bundled so PostHog never injects scripts from its own CDN (see disable_external_dependency_loading).
// About 4 KB gzipped: it registers the web-vitals callbacks PostHog calls when it starts.
import "posthog-js/dist/web-vitals";

/**
 * PostHog itself loads once the page is idle (instrumentation-client.ts). This small part runs at
 * startup so that delay loses nothing: web vitals are observed from the first frame, and errors and
 * the landing page from before PostHog loads are held for it.
 */

type Metric = { name: string; id?: string };
type MetricCallback = (metric: Metric) => void;
type OnMetric = (callback: MetricCallback, options?: Record<string, unknown>) => void;

const METRIC_SUBSCRIBERS = ["onLCP", "onCLS", "onFCP", "onINP"] as const;
const MAX_EARLY_ERRORS = 20;

export type EarlyAnalytics = {
  /** The page the visit started on, if the visitor navigated away before PostHog loaded. */
  landing: { url: string; referrer: string; at: Date };
  errors: Array<{ error: unknown; at: Date }>;
  stop: () => void;
};

function webVitalsCallbacks(): Record<string, OnMetric> | undefined {
  const extensions = (window as Window & {
    __PosthogExtensions__?: { postHogWebVitalsCallbacks?: Record<string, OnMetric> };
  }).__PosthogExtensions__;
  return extensions?.postHogWebVitalsCallbacks;
}

/**
 * Starts each web-vitals observer now and swaps in a subscriber that replays what it has reported.
 * The browser only buffers interactions of 104 ms or more, so an observer started late could miss
 * slower-than-usual but shorter interactions and under-report INP.
 */
function observeWebVitalsEarly() {
  const callbacks = webVitalsCallbacks();
  if (!callbacks) {
    return;
  }
  for (const name of METRIC_SUBSCRIBERS) {
    const subscribe = callbacks[name];
    if (typeof subscribe !== "function") {
      continue;
    }
    const listeners: MetricCallback[] = [];
    // Held only until PostHog subscribes, latest report per metric: web-vitals updates a metric
    // object in place and reports it again, so older reports of the same id are superseded.
    let pending: Map<string, Metric> | null = new Map();
    // PostHog passes { reportSoftNavs: false } unless soft navigations are enabled; that is the default.
    subscribe((metric) => {
      if (pending) {
        pending.delete(metric.id ?? metric.name);
        pending.set(metric.id ?? metric.name, metric);
      }
      for (const listener of listeners) {
        listener(metric);
      }
    });
    callbacks[name] = (callback) => {
      listeners.push(callback);
      for (const metric of pending?.values() ?? []) {
        callback(metric);
      }
      pending = null;
    };
  }
}

export function startEarlyAnalytics(): EarlyAnalytics {
  observeWebVitalsEarly();

  const errors: EarlyAnalytics["errors"] = [];
  const keep = (error: unknown) => {
    if (errors.length < MAX_EARLY_ERRORS) {
      errors.push({ error, at: new Date() });
    }
  };
  const onError = (event: ErrorEvent) => keep(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => keep(event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return {
    landing: { url: window.location.href, referrer: document.referrer, at: new Date() },
    errors,
    stop: () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    },
  };
}
