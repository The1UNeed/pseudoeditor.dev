// Bundled so PostHog never injects scripts from its own CDN (see disable_external_dependency_loading).
import "posthog-js/dist/exception-autocapture";
import posthog from "posthog-js";
import { posthogConfig, setAnalyticsClient, stripQueryAndHash } from "@/lib/analytics";
import type { EarlyAnalytics } from "@/lib/analyticsBootstrap";

/** Loaded on demand by instrumentation-client.ts once the page is idle. */
export function startPosthog(key: string, early: EarlyAnalytics) {
  posthog.init(key, posthogConfig);
  // PostHog's own exception autocapture takes over from here.
  early.stop();

  // init records a pageview for the current page. If the visitor already moved on from the page
  // they landed on, record that one too, at the time they arrived.
  const { landing } = early;
  if (stripQueryAndHash(landing.url) !== stripQueryAndHash(window.location.href)) {
    posthog.capture("$pageview", { $current_url: landing.url, $referrer: landing.referrer }, { timestamp: landing.at });
  }
  for (const { error } of early.errors) {
    posthog.captureException(error);
  }

  setAnalyticsClient(posthog);
}
