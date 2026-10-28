import posthog, { type CaptureResult } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { posthogConfig, prefersNoTracking, scrubUrls, stripQueryAndHash, track } from "@/lib/analytics";

function captureResult(properties: Record<string, unknown>): CaptureResult {
  return { uuid: "test", event: "$pageview", properties };
}

describe("analytics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the privacy guarantees the policy makes", () => {
    expect(posthogConfig).toMatchObject({
      api_host: "https://eu.i.posthog.com",
      cookieless_mode: "always",
      person_profiles: "never",
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
    });
  });

  it("strips query strings and fragments from URLs", () => {
    expect(stripQueryAndHash("https://pseudoeditor.dev/app?__clerk_handshake=abc#top")).toBe(
      "https://pseudoeditor.dev/app",
    );
    expect(stripQueryAndHash("https://pseudoeditor.dev/docs#syntax")).toBe("https://pseudoeditor.dev/docs");
    expect(stripQueryAndHash("https://pseudoeditor.dev/")).toBe("https://pseudoeditor.dev/");
  });

  it("scrubs every URL property before an event is sent", () => {
    const scrubbed = scrubUrls(
      captureResult({
        $current_url: "https://pseudoeditor.dev/callback?code=secret",
        $referrer: "https://example.com/search?q=name",
        $initial_current_url: "https://pseudoeditor.dev/app?practice=pass-or-fail",
        $pathname: "/callback",
        diagnostics: 2,
      }),
    );

    expect(scrubbed?.properties).toEqual({
      $current_url: "https://pseudoeditor.dev/callback",
      $referrer: "https://example.com/search",
      $initial_current_url: "https://pseudoeditor.dev/app",
      $pathname: "/callback",
      diagnostics: 2,
    });
  });

  it("scrubs the URL nested in each web vitals metric", () => {
    const scrubbed = scrubUrls(
      captureResult({
        $current_url: "https://pseudoeditor.dev/app?__clerk_handshake=SECRET",
        $web_vitals_FCP_event: {
          name: "FCP",
          value: 120,
          $current_url: "https://pseudoeditor.dev/app?__clerk_handshake=SECRET#top",
          navigationURL: "https://pseudoeditor.dev/app?__clerk_handshake=SECRET",
        },
        $web_vitals_FCP_value: 120,
      }),
    );

    expect(scrubbed?.properties.$current_url).toBe("https://pseudoeditor.dev/app");
    expect(scrubbed?.properties.$web_vitals_FCP_event).toEqual({
      name: "FCP",
      value: 120,
      $current_url: "https://pseudoeditor.dev/app",
      navigationURL: "https://pseudoeditor.dev/app",
    });
  });

  it("honours Do Not Track and Global Privacy Control", () => {
    const nav = (signals: { doNotTrack?: string | null; globalPrivacyControl?: boolean }) =>
      ({ doNotTrack: null, ...signals }) as unknown as Navigator;

    expect(prefersNoTracking(nav({}))).toBe(false);
    expect(prefersNoTracking(nav({ doNotTrack: "0" }))).toBe(false);
    expect(prefersNoTracking(nav({ doNotTrack: "1" }))).toBe(true);
    expect(prefersNoTracking(nav({ globalPrivacyControl: true }))).toBe(true);
  });

  it("does nothing until PostHog has been initialised", () => {
    const capture = vi.spyOn(posthog, "capture");
    track("syntax_changed", { syntax: "cambridge" });
    expect(capture).not.toHaveBeenCalled();
  });

  it("sends events once PostHog is loaded", () => {
    const capture = vi.spyOn(posthog, "capture").mockReturnValue(undefined);
    vi.spyOn(posthog, "__loaded", "get").mockReturnValue(true);
    track("program_run", { outcome: "success", diagnostics: 0, inputs: 1 });
    expect(capture).toHaveBeenCalledWith("program_run", { outcome: "success", diagnostics: 0, inputs: 1 });
  });
});
