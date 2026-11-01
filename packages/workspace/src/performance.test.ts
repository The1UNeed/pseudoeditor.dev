import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import * as workspace from "./index";

// WORKSPACE_BENCHMARK=1 pnpm --filter @pseudoeditor/workspace exec vitest run src/performance.test.ts --reporter verbose
// Set WORKSPACE_BENCHMARK_BASELINE to an unchanged index.ts to measure the same fixture before a change.
describe.skipIf(process.env.WORKSPACE_BENCHMARK !== "1")("workspace hot-path benchmark", () => {
  it("measures editing, compile badges, and split resizing on a persistable workspace", async () => {
    const api: typeof workspace = process.env.WORKSPACE_BENCHMARK_BASELINE
      ? await import(process.env.WORKSPACE_BENCHMARK_BASELINE)
      : workspace;
    const now = "2026-11-01T00:00:00.000Z";
    const state = api.createDefaultWorkspace({ sampleSource: "OUTPUT 1", now });
    const template = api.getActiveDocument(state)!;
    for (let index = 0; index < 239; index++) {
      const id = `doc-${index}`;
      state.nodes[id] = { ...template, id, name: `${id}.pseudo`, order: index + 1 };
    }
    for (let file = 0; file < 80; file++) {
      state.virtualFiles[`data-${file}.txt`] = Array.from({ length: 30 }, (_, line) => `${line}:${"x".repeat(96)}`);
    }
    expect(api.validateWorkspaceForPersistence(state).ok).toBe(true);
    expect(state.layout.type).toBe("split");
    const summary: workspace.CompileSummary = { severity: "success", errorCount: 0, warningCount: 0, updatedAt: now };
    const operations = {
      typing: (current: workspace.WorkspaceState, index: number) => api.updateDocumentSource(current, template.id, `OUTPUT ${index}`, now),
      compileSummary: (current: workspace.WorkspaceState) => api.setDocumentCompileSummary(current, template.id, summary, now),
      resize: (current: workspace.WorkspaceState, index: number) => api.resizeSplit(current, state.layout.id, [0.25 + index % 10 / 100, 0.75 - index % 10 / 100], now),
    };
    for (const [name, operation] of Object.entries(operations)) {
      let current = state;
      for (let index = 0; index < 500; index++) current = operation(current, index);
      const samples: number[] = [];
      for (let sample = 0; sample < 9; sample++) {
        const start = performance.now();
        for (let index = 0; index < 2000; index++) current = operation(current, index);
        samples.push((performance.now() - start) / 2000);
      }
      samples.sort((left, right) => left - right);
      console.log(JSON.stringify({ operation: name, medianMs: samples[4], samplesMs: samples, documents: 240, virtualFiles: 80, fileLines: 2400, workspaceBytes: JSON.stringify(state).length }));
      expect(api.validateWorkspaceForPersistence(current).ok).toBe(true);
    }
  }, 15_000);
});
