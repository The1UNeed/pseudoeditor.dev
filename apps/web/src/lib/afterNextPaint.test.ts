import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { afterNextPaint } from "@/lib/afterNextPaint";

describe("afterNextPaint", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs once, in a task after the next frame", () => {
    const callback = vi.fn();
    afterNextPaint(callback);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersToNextFrame();
    expect(callback).not.toHaveBeenCalled();
    // Fake timers run a zero-delay timeout on the next millisecond.
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("still runs when no frame comes, as in a hidden tab", () => {
    const callback = vi.fn();
    afterNextPaint(callback);
    // No frame is advanced.
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does nothing once cancelled", () => {
    const callback = vi.fn();
    const cancel = afterNextPaint(callback);
    cancel();
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });
});
