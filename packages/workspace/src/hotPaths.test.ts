import { describe, expect, it } from "vitest";
import {
  createDefaultWorkspace,
  createDocument,
  getActiveDocument,
  resizeSplit,
  setDocumentCompileSummary,
  updateDocumentSource,
  type WorkspaceState,
} from "./index";

const BEFORE = "2026-11-01T00:00:00.000Z";
const AFTER = "2026-11-01T00:01:00.000Z";

function freeze(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.freeze(value);
  for (const child of Object.values(value)) freeze(child);
}

function fixture(): WorkspaceState {
  const state = createDocument(createDefaultWorkspace({ sampleSource: "OUTPUT 1", now: BEFORE }), {
    id: "other", name: "Other", source: "OUTPUT 2", now: BEFORE,
  });
  state.virtualFiles = { "data.txt": ["one", "two"] };
  freeze(state);
  return state;
}

describe("workspace hot paths", () => {
  it("updates source and parent timestamp without copying unrelated state or mutating the previous state", () => {
    const state = fixture();
    const next = updateDocumentSource(state, "other", "OUTPUT 3", AFTER);
    expect(next.nodes.other).toEqual({ ...state.nodes.other, source: "OUTPUT 3", updatedAt: AFTER });
    expect(next.nodes[state.rootFolderId]).toEqual({ ...state.nodes[state.rootFolderId], updatedAt: AFTER });
    expect(next.nodes["doc-main"]).toBe(state.nodes["doc-main"]);
    expect(next.virtualFiles).toBe(state.virtualFiles);
    expect(next.panelInstances).toBe(state.panelInstances);
    expect(next.layout).toBe(state.layout);
    expect(next.expandedFolderIds).toBe(state.expandedFolderIds);
    expect(next.recentDocumentIds).toBe(state.recentDocumentIds);
    expect(state.nodes.other).toHaveProperty("source", "OUTPUT 2");
    expect(state.nodes[state.rootFolderId].updatedAt).toBe(BEFORE);
  });

  it("updates and clears compile summaries without changing other nodes or editor layout", () => {
    const state = fixture();
    const summary = { severity: "success" as const, errorCount: 0, warningCount: 0, updatedAt: AFTER };
    const next = setDocumentCompileSummary(state, "other", summary, AFTER);
    expect(next.nodes.other).toEqual({ ...state.nodes.other, lastCompileSummary: summary, updatedAt: AFTER });
    expect(next.nodes[state.rootFolderId]).toBe(state.nodes[state.rootFolderId]);
    expect(next.nodes["doc-main"]).toBe(state.nodes["doc-main"]);
    expect(next.virtualFiles).toBe(state.virtualFiles);
    expect(next.panelInstances).toBe(state.panelInstances);
    expect(next.layout).toBe(state.layout);
    expect(state.nodes.other).not.toHaveProperty("lastCompileSummary");
    const cleared = setDocumentCompileSummary(next, "other", undefined, BEFORE);
    expect(cleared.nodes.other).toHaveProperty("lastCompileSummary", undefined);
    expect(next.nodes.other).toHaveProperty("lastCompileSummary", summary);
  });

  it("normalizes split sizes while sharing unchanged layout children, panels, documents, and files", () => {
    const state = fixture();
    expect(state.layout.type).toBe("split");
    if (state.layout.type !== "split") return;
    const next = resizeSplit(state, state.layout.id, [3, 1], AFTER);
    expect(next.layout).toEqual({ ...state.layout, sizes: [0.75, 0.25] });
    if (next.layout.type !== "split") throw new Error("Expected a split");
    expect(next.layout.children).toBe(state.layout.children);
    expect(next.nodes).toBe(state.nodes);
    expect(next.virtualFiles).toBe(state.virtualFiles);
    expect(next.panelInstances).toBe(state.panelInstances);
    expect(getActiveDocument(next)).toBe(getActiveDocument(state));
    expect(resizeSplit(next, next.layout.id, [3, 1])).toBe(next);
    expect(resizeSplit(next, "missing", [1, 2])).toBe(next);
    expect(resizeSplit(next, next.layout.children[0].id, [1, 2])).toBe(next);
    const fallback = resizeSplit(state, state.layout.id, [Number.NaN, -1, 100]);
    expect(fallback.layout).toHaveProperty("sizes", [0.5, 0.5]);
  });
  it("copies only ancestors of a nested resized split", () => {
    const state = fixture();
    if (state.layout.type !== "split") throw new Error("Expected root split");
    const nested = state.layout.children.find((child) => child.type === "split");
    if (!nested || nested.type !== "split") throw new Error("Expected nested split");
    const next = resizeSplit(state, nested.id, [2, 3], AFTER);
    if (next.layout.type !== "split") throw new Error("Expected root split");
    expect(next.layout).not.toBe(state.layout);
    expect(next.layout.sizes).toBe(state.layout.sizes);
    for (let index = 0; index < state.layout.children.length; index++) {
      const before = state.layout.children[index];
      const after = next.layout.children[index];
      if (before === nested) {
        expect(after).toEqual({ ...nested, sizes: [0.4, 0.6] });
        if (after.type !== "split") throw new Error("Expected nested split");
        expect(after.children).toBe(nested.children);
      } else {
        expect(after).toBe(before);
      }
    }
    expect(next.nodes).toBe(state.nodes);
    expect(next.panelInstances).toBe(state.panelInstances);
    expect(next.virtualFiles).toBe(state.virtualFiles);
  });

});
