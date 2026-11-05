import { afterEach, describe, expect, it } from "vitest";
import { startEarlyAnalytics } from "@/lib/analyticsBootstrap";

type Callback = (metric: { name: string; value: number }) => void;
type Extensions = { postHogWebVitalsCallbacks?: Record<string, (callback: Callback) => void> };

function installFakeWebVitals() {
  const emit: Record<string, Callback> = {};
  const callbacks: Record<string, (callback: Callback) => void> = {};
  for (const name of ["onLCP", "onCLS", "onFCP", "onINP"]) {
    callbacks[name] = (callback) => {
      emit[name] = callback;
    };
  }
  (window as Window & { __PosthogExtensions__?: Extensions }).__PosthogExtensions__ = {
    postHogWebVitalsCallbacks: callbacks,
  };
  return { callbacks, emit };
}

describe("startEarlyAnalytics", () => {
  let stop = () => {};
  afterEach(() => stop());

  it("observes web vitals from startup and replays them to PostHog when it subscribes", () => {
    const { callbacks, emit } = installFakeWebVitals();
    const early = startEarlyAnalytics();
    stop = early.stop;

    emit.onINP({ name: "INP", value: 96 });
    const received: number[] = [];
    callbacks.onINP((metric) => received.push(metric.value));
    expect(received).toEqual([96]);

    emit.onINP({ name: "INP", value: 120 });
    expect(received).toEqual([96, 120]);
  });

  it("replays only the latest report of a metric, and keeps nothing after PostHog subscribes", () => {
    const { callbacks, emit } = installFakeWebVitals();
    stop = startEarlyAnalytics().stop;

    emit.onINP({ id: "inp-1", name: "INP", value: 96 } as never);
    emit.onINP({ id: "inp-1", name: "INP", value: 120 } as never);
    const first: number[] = [];
    callbacks.onINP((metric) => first.push(metric.value));
    expect(first).toEqual([120]);

    emit.onINP({ id: "inp-1", name: "INP", value: 150 } as never);
    const late: number[] = [];
    callbacks.onINP((metric) => late.push(metric.value));
    expect(late).toEqual([]);
    expect(first).toEqual([120, 150]);
  });

  it("holds errors raised before PostHog loads, until stopped", () => {
    installFakeWebVitals();
    const early = startEarlyAnalytics();
    stop = early.stop;
    // Message-only events: an ErrorEvent carrying an Error object counts as unhandled in Vitest.
    window.dispatchEvent(new ErrorEvent("error", { message: "hydration failed" }));
    early.stop();
    window.dispatchEvent(new ErrorEvent("error", { message: "later" }));

    expect(early.errors.map((entry) => entry.error)).toEqual(["hydration failed"]);
    expect(early.landing.url).toBe(window.location.href);
  });
});
