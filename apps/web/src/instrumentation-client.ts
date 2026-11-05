import { prefersNoTracking } from "@/lib/analytics";
import { startEarlyAnalytics, type EarlyAnalytics } from "@/lib/analyticsBootstrap";

// next.config.ts sets NEXT_PUBLIC_POSTHOG_ENABLED only for the production web deployment, so
// previews, local builds, and the desktop app never load analytics.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function loadAnalytics(key: string, early: EarlyAnalytics) {
  // A separate chunk, fetched and evaluated only after the page has loaded and gone idle, so
  // analytics never delays first paint or makes early clicks wait. startEarlyAnalytics already
  // observes web vitals and holds early errors, so nothing from before then is lost.
  import("@/lib/posthogClient")
    .then(({ startPosthog }) => startPosthog(key, early))
    .catch(() => {
      /* Analytics must never break the app. */
    });
}

function whenIdleAfterLoad(callback: () => void) {
  let started = false;
  const start = () => {
    if (!started) {
      started = true;
      callback();
    }
  };
  // Safari has no requestIdleCallback.
  const idle = () =>
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(start, { timeout: 5000 })
      : setTimeout(start, 1000);
  if (document.readyState === "complete") {
    idle();
  } else {
    window.addEventListener("load", idle, { once: true });
  }
  // A visitor switching away before then may not come back: start now, so the visit (and the
  // vitals PostHog reports when the page is hidden) still have a chance to be sent.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") start();
    },
    { once: true },
  );
}

if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "1" && posthogKey && !prefersNoTracking()) {
  try {
    const early = startEarlyAnalytics();
    whenIdleAfterLoad(() => loadAnalytics(posthogKey, early));
  } catch {
    /* Analytics must never break the app. */
  }
}
