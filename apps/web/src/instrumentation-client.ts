// Bundled so PostHog never injects scripts from its own CDN (see disable_external_dependency_loading).
import "posthog-js/dist/exception-autocapture";
import "posthog-js/dist/web-vitals";
import posthog from "posthog-js";
import { posthogConfig, prefersNoTracking } from "@/lib/analytics";

// next.config.ts sets NEXT_PUBLIC_POSTHOG_ENABLED only for the production web deployment, so
// previews, local builds, and the desktop app never load analytics.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "1" && posthogKey && !prefersNoTracking()) {
  try {
    posthog.init(posthogKey, posthogConfig);
  } catch {
    /* Analytics must never break the app. */
  }
}
