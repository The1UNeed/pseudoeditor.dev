import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompileResult } from "@/compiler/types";

class MockWorker {
  static instances: MockWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  messages: unknown[] = [];

  constructor() {
    MockWorker.instances.push(this);
  }

  postMessage(message: unknown) {
    this.messages.push(message);
  }

  terminate = vi.fn();

  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const successResult: CompileResult = {
  success: true,
  diagnostics: [],
  astJson: "{}",
};

describe("compilePseudocodeInWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
  });

  it("marks older worker responses as stale", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");

    const first = compilePseudocodeInWorker(
      { source: "OUTPUT 1", filename: "first.pseudo", strict: true },
      "first",
    );
    const second = compilePseudocodeInWorker(
      { source: "OUTPUT 2", filename: "second.pseudo", strict: true },
      "second",
    );

    const worker = MockWorker.instances[0];
    worker.emit({ kind: "compiled", id: 2, result: successResult });
    worker.emit({ kind: "compiled", id: 1, result: successResult });

    await expect(second).resolves.toMatchObject({ stale: false, cached: false });
    await expect(first).resolves.toMatchObject({ stale: true, cached: false });
  });

  it("returns cached compile results without posting another worker request", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    const request = { source: "OUTPUT 1", filename: "main.pseudo", strict: true as const };

    const first = compilePseudocodeInWorker(request, "main");
    const worker = MockWorker.instances[0];
    worker.emit({ kind: "compiled", id: 1, result: successResult });

    await expect(first).resolves.toMatchObject({ cached: false, result: successResult });
    expect(worker.messages).toHaveLength(1);

    await expect(compilePseudocodeInWorker(request, "main")).resolves.toMatchObject({
      cached: true,
      result: successResult,
      stale: false,
    });
    expect(worker.messages).toHaveLength(1);
  });
  it("shares one worker compilation for identical pending requests", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    const request = { source: "OUTPUT 1", filename: "main.pseudo", strict: true as const };
    const first = compilePseudocodeInWorker(request, "main");
    const second = compilePseudocodeInWorker(request, "main");
    const worker = MockWorker.instances[0];
    expect(worker.messages).toHaveLength(1);
    worker.emit({ kind: "compiled", id: 1, result: successResult });
    await expect(first).resolves.toMatchObject({ requestId: 1, stale: true });
    await expect(second).resolves.toMatchObject({ requestId: 2, stale: false, result: successResult });
  });

  it("a cache hit supersedes an older in-flight compilation", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    const request = { source: "OUTPUT 1", filename: "main.pseudo", strict: true as const };
    const initial = compilePseudocodeInWorker(request, "main");
    const worker = MockWorker.instances[0];
    worker.emit({ kind: "compiled", id: 1, result: successResult });
    await initial;
    const pending = compilePseudocodeInWorker({ ...request, source: "OUTPUT 2" }, "changed");
    await expect(compilePseudocodeInWorker(request, "main")).resolves.toMatchObject({
      requestId: 3, cached: true, stale: false,
    });
    worker.emit({ kind: "compiled", id: 2, result: successResult });
    await expect(pending).resolves.toMatchObject({ stale: true });
  });

  it("does not reuse cached or pending results for different sources sharing a key", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    const request = { source: "OUTPUT 1", filename: "main.pseudo", strict: true as const };
    const first = compilePseudocodeInWorker(request, "shared");
    const second = compilePseudocodeInWorker({ ...request, source: "OUTPUT 2" }, "shared");
    const worker = MockWorker.instances[0];
    expect(worker.messages).toHaveLength(2);
    worker.emit({ kind: "compiled", id: 1, result: successResult });
    worker.emit({ kind: "compiled", id: 2, result: { ...successResult, astJson: "second" } });
    await Promise.all([first, second]);
    await expect(compilePseudocodeInWorker(request, "shared")).resolves.toMatchObject({
      cached: true, result: successResult,
    });
  });

  it("retries failed shared compilations instead of caching worker failures", async () => {
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    const request = { source: "OUTPUT 1", filename: "main.pseudo", strict: true as const };
    const first = compilePseudocodeInWorker(request, "main");
    const worker = MockWorker.instances[0];
    worker.emit({ kind: "error", id: 1, message: "Compiler failure" });
    await expect(first).resolves.toMatchObject({ result: { success: false } });
    const retry = compilePseudocodeInWorker(request, "main");
    expect(worker.messages).toHaveLength(2);
    worker.emit({ kind: "compiled", id: 2, result: successResult });
    await expect(retry).resolves.toMatchObject({ result: successResult });
  });

  it("loads the fallback compiler when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    const { compilePseudocodeInWorker } = await import("./compilePseudocodeInWorker");
    await expect(compilePseudocodeInWorker({
      source: "OUTPUT 1", filename: "main.pseudo", strict: true,
    })).resolves.toMatchObject({ result: { success: true }, stale: false });
  });

});
