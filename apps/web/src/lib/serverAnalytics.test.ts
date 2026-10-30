import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureExceptionImmediate = vi.fn();
const PostHog = vi.fn(function PostHog() {
  return { captureExceptionImmediate };
});
vi.mock("posthog-node", () => ({ PostHog }));

describe("captureServerError", () => {
  beforeEach(() => {
    vi.resetModules();
    captureExceptionImmediate.mockReset();
    PostHog.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does nothing without a project key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const { captureServerError } = await import("@/lib/serverAnalytics");
    await captureServerError(new Error("boom"), { path: "/api/workspace" });
    expect(PostHog).not.toHaveBeenCalled();
  });

  it("reports to the EU host under a fixed ID without person processing", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const { captureServerError } = await import("@/lib/serverAnalytics");
    const error = new Error("boom");
    await captureServerError(error, { path: "/api/workspace", method: "PUT" });

    expect(PostHog).toHaveBeenCalledWith("phc_test", expect.objectContaining({ host: "https://us.i.posthog.com", disableGeoip: true }));
    expect(captureExceptionImmediate).toHaveBeenCalledWith(error, "pseudoeditor-server", {
      path: "/api/workspace",
      method: "PUT",
      $process_person_profile: false,
    });
  });

  it("never throws when reporting fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    captureExceptionImmediate.mockRejectedValueOnce(new Error("network down"));
    const { captureServerError } = await import("@/lib/serverAnalytics");
    await expect(captureServerError(new Error("boom"), {})).resolves.toBeUndefined();
  });
});
