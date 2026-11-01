import { beforeEach, expect, it, vi } from "vitest";

const { initRuntime, runPseudocode } = vi.hoisted(() => ({
  initRuntime: vi.fn<() => Promise<void>>(),
  runPseudocode: vi.fn<(request: string) => string>(),
}));
vi.mock("@/runtime/wasm/pkg/pseudocode_runtime", () => ({
  default: initRuntime,
  run_pseudocode: runPseudocode,
}));

let scope: {
  location: URL;
  fetch: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
  onmessage: ((event: MessageEvent) => Promise<void>) | null;
};

beforeEach(() => {
  vi.resetModules();
  initRuntime.mockReset().mockResolvedValue(undefined);
  runPseudocode.mockReset().mockImplementation((request) => JSON.stringify({
    success: true,
    stdout: JSON.parse(request).stdin_lines.join(","),
    stderr: "",
    diagnostics: [],
    virtualFiles: {},
  }));
  scope = { location: new URL("https://example.test/worker.js"), fetch: vi.fn(), postMessage: vi.fn(), onmessage: null };
  vi.stubGlobal("self", scope);
});

const run = (id: number, stdinLines = ["latest input"]) => ({
  kind: "run", id, request: { astJson: "{}", stdinLines, virtualFiles: {} },
});
const send = (data: unknown) => scope.onmessage!({ data } as MessageEvent);

it("retries initialization after a preload failure", async () => {
  initRuntime.mockRejectedValueOnce(new Error("Temporary fetch failure"));
  await import("./wasmRuntime.worker");
  await send({ kind: "preload", id: 1 });
  expect(scope.postMessage).toHaveBeenCalledWith(expect.objectContaining({
    kind: "run-result", id: 1, result: expect.objectContaining({ success: false }),
  }));
  await send(run(2));
  expect(initRuntime).toHaveBeenCalledTimes(2);
  expect(scope.postMessage).toHaveBeenCalledWith(expect.objectContaining({
    kind: "run-result", id: 2, result: expect.objectContaining({ success: true, stdout: "latest input" }),
  }));
});

it("retries initialization after the first run fails to load WASM", async () => {
  initRuntime.mockRejectedValueOnce(new Error("Temporary fetch failure"));
  await import("./wasmRuntime.worker");
  await send(run(1));
  await send(run(2));
  expect(initRuntime).toHaveBeenCalledTimes(2);
  expect(runPseudocode).toHaveBeenCalledTimes(1);
  expect(scope.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
    id: 2, result: expect.objectContaining({ success: true }),
  }));
});

it("shares initialization between concurrent preload requests", async () => {
  let ready!: () => void;
  initRuntime.mockImplementationOnce(() => new Promise<void>((resolve) => { ready = resolve; }));
  await import("./wasmRuntime.worker");
  const first = send({ kind: "preload", id: 1 });
  const second = send({ kind: "preload", id: 2 });
  expect(initRuntime).toHaveBeenCalledTimes(1);
  ready();
  await Promise.all([first, second]);
  expect(scope.postMessage.mock.calls.filter(([message]) => message.kind === "runtime-status")).toHaveLength(1);
});

it("keeps the initialized runtime warm while executing each run with fresh inputs", async () => {
  await import("./wasmRuntime.worker");
  await send({ kind: "preload", id: 1 });
  await send(run(2, ["first"]));
  await send(run(3, ["second"]));
  expect(initRuntime).toHaveBeenCalledTimes(1);
  expect(runPseudocode).toHaveBeenCalledTimes(2);
  expect(scope.postMessage).toHaveBeenCalledWith(expect.objectContaining({
    id: 2, result: expect.objectContaining({ stdout: "first" }),
  }));
  expect(scope.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
    id: 3, result: expect.objectContaining({ stdout: "second" }),
  }));
});
