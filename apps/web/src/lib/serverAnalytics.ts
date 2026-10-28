import { PostHog } from "posthog-node";
import { POSTHOG_HOST } from "@/lib/posthogHost";

// Server errors are not tied to a visitor; this fixed ID keeps them out of person profiles.
const SERVER_DISTINCT_ID = "pseudoeditor-server";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return null;
  }
  // Serverless functions can freeze after responding, so send each event immediately.
  client ??= new PostHog(key, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0, disableGeoip: true });
  return client;
}

export async function captureServerError(error: unknown, properties: Record<string, string>) {
  try {
    await getClient()?.captureExceptionImmediate(error, SERVER_DISTINCT_ID, {
      ...properties,
      $process_person_profile: false,
    });
  } catch {
    /* Reporting an error must never cause another one. */
  }
}
