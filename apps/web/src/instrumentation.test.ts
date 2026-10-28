import { afterEach, describe, expect, it, vi } from "vitest";

const captureServerError = vi.fn();
vi.mock("@/lib/serverAnalytics", () => ({ captureServerError }));

const context = {
  routerKind: "App Router",
  routePath: "/api/workspace",
  routeType: "route",
  renderSource: "server-rendering",
  revalidateReason: undefined,
  renderType: "dynamic",
} as const;

describe("onRequestError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    captureServerError.mockReset();
  });

  async function report(headers: Record<string, string>) {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_ENABLED", "1");
    const { onRequestError } = await import("@/instrumentation");
    await onRequestError(new Error("boom"), { path: "/api/workspace?token=secret", method: "PUT", headers }, context);
  }

  it("reports the path without its query string, and no headers", async () => {
    await report({ cookie: "__session=abc" });
    expect(captureServerError).toHaveBeenCalledWith(expect.any(Error), {
      path: "/api/workspace",
      method: "PUT",
      route_path: "/api/workspace",
      route_type: "route",
    });
  });

  it("skips reporting when the request carries Do Not Track or Global Privacy Control", async () => {
    await report({ dnt: "1" });
    await report({ "sec-gpc": "1" });
    expect(captureServerError).not.toHaveBeenCalled();
  });
});
