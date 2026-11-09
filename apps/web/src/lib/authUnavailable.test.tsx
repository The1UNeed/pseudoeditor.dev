import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (status: string) => void;

// A stand-in for Clerk's isomorphic instance: the public `status`, `on("status")` and `off("status")`.
const fakeClerk = vi.hoisted(() => {
  const listeners = new Set<Listener>();
  return {
    status: "loading",
    listeners,
    on: (_event: "status", listener: Listener) => {
      listeners.add(listener);
    },
    off: (_event: "status", listener: Listener) => {
      listeners.delete(listener);
    },
    emit(status: string) {
      this.status = status;
      for (const listener of listeners) listener(status);
    },
  };
});

vi.mock("@clerk/nextjs", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useClerk: () => fakeClerk,
}));

async function loadHook() {
  // The publishable key is read when the module loads.
  vi.resetModules();
  return (await import("@/lib/auth-components")).useAuthUnavailable;
}

describe("useAuthUnavailable", () => {
  beforeEach(() => {
    fakeClerk.status = "loading";
    fakeClerk.listeners.clear();
    Object.defineProperty(window, "location", { configurable: true, value: new URL("https://pseudoeditor.dev/app") });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("turns true when Clerk gives up loading, and unsubscribes on unmount", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_example");
    const useAuthUnavailable = await loadHook();
    const { result, unmount } = renderHook(() => useAuthUnavailable());

    expect(result.current).toBe(false);
    act(() => fakeClerk.emit("ready"));
    expect(result.current).toBe(false);
    act(() => fakeClerk.emit("error"));
    expect(result.current).toBe(true);

    unmount();
    expect(fakeClerk.listeners.size).toBe(0);
  });

  it("is always false where cloud sign-in is not used", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    fakeClerk.status = "error";
    const useAuthUnavailable = await loadHook();
    expect(renderHook(() => useAuthUnavailable()).result.current).toBe(false);
  });
});
