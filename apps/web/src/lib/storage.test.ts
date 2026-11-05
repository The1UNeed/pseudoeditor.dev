import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import {
  createDocument,
  createEmptyWorkspace,
  getActiveDocument,
  updateDocumentSource,
  updateVirtualFiles,
} from "@pseudoeditor/workspace";

const dbStore = new Map<string, unknown>();
const localStore = new Map<string, string>();

interface MockDatabase {
  objectStoreNames: {
    contains: () => boolean;
  };
  createObjectStore: ReturnType<typeof vi.fn>;
  get: (_storeName: string, key: string) => Promise<unknown>;
  put: (_storeName: string, value: unknown, key: string) => Promise<void>;
  delete: (_storeName: string, key: string) => Promise<void>;
  transaction: (_storeName: string, _mode: string) => {
    store: {
      get: (key: string) => Promise<unknown>;
      delete: (key: string) => Promise<void>;
      put: (value: unknown, key: string) => Promise<void>;
    };
    done: Promise<void>;
  };
}

interface MockOpenDbOptions {
  upgrade?: (database: MockDatabase) => void;
}

vi.mock("idb", () => ({
  openDB: vi.fn(async (_name: string, _version: number, options?: MockOpenDbOptions) => {
    const database: MockDatabase = {
      objectStoreNames: {
        contains: () => true,
      },
      createObjectStore: vi.fn(),
      async get(_storeName: string, key: string) {
        return dbStore.get(key);
      },
      async put(_storeName: string, value: unknown, key: string) {
        dbStore.set(key, value);
      },
      async delete(_storeName: string, key: string) {
        dbStore.delete(key);
      },
      transaction() {
        return {
          store: {
            async get(key: string) {
              return dbStore.get(key);
            },
            async delete(key: string) {
              dbStore.delete(key);
            },
            async put(value: unknown, key: string) {
              dbStore.set(key, value);
            },
          },
          done: Promise.resolve(),
        };
      },
    };

    options?.upgrade?.(database);
    return database;
  }),
}));

describe("workspace storage", () => {
  beforeEach(() => {
    dbStore.clear();
    localStore.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => localStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStore.set(key, value);
        },
        removeItem: (key: string) => {
          localStore.delete(key);
        },
        clear: () => {
          localStore.clear();
        },
      },
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => localStore.get(`session:${key}`) ?? null,
        setItem: (key: string, value: string) => {
          localStore.set(`session:${key}`, value);
        },
        removeItem: (key: string) => {
          localStore.delete(`session:${key}`);
        },
        clear: () => {
          for (const key of [...localStore.keys()]) {
            if (key.startsWith("session:")) {
              localStore.delete(key);
            }
          }
        },
      },
    });
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: vi.fn(),
    });
    vi.resetModules();
  });

  it("loads and saves the current workspace snapshot", async () => {
    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Hello"');
    const created = createDocument(loaded, { name: "main", source: 'OUTPUT "Hello"' });
    const updated = updateDocumentSource(created, getActiveDocument(created)!.id, 'OUTPUT "Saved"');

    await storage.saveWorkspace(updated);
    const reloaded = await storage.loadWorkspace('OUTPUT "Fallback"');

    expect(getActiveDocument(reloaded)?.source).toBe('OUTPUT "Saved"');
  });

  it("keeps memory-mode workspaces out of local storage", async () => {
    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Hello"', { mode: "memory" });
    const created = createDocument(loaded, { name: "main", source: 'OUTPUT "Transient"' });

    await storage.saveWorkspace(created, { mode: "memory" });
    const reloaded = await storage.loadWorkspace('OUTPUT "Fallback"');

    expect(getActiveDocument(reloaded)).toBeNull();
  });

  it("falls back to the default workspace when persisted data is malformed", async () => {
    dbStore.set("current", { version: 999 });
    const storage = await import("@/lib/storage");

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"');

    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "Fallback"');
  });

  it("resets only once per dev session when the dev reset flag is enabled", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_RESET_WORKSPACE_ON_DEV", "1");
    dbStore.set("current", {
      version: 2,
      rootFolderId: "root",
      activeDocumentId: "doc-main",
      nodes: {
        root: {
          id: "root",
          type: "folder",
          parentId: null,
          name: "Explorer",
          order: 0,
          createdAt: "2026-03-15T00:00:00.000Z",
          updatedAt: "2026-03-15T00:00:00.000Z",
        },
        "doc-main": {
          id: "doc-main",
          type: "document",
          parentId: "root",
          name: "main.pseudo",
          source: 'OUTPUT "Persisted"',
          order: 0,
          createdAt: "2026-03-15T00:00:00.000Z",
          updatedAt: "2026-03-15T00:00:00.000Z",
        },
      },
      expandedFolderIds: ["root"],
      recentDocumentIds: ["doc-main"],
      virtualFiles: {},
      panelInstances: {
        "panel-editor-main": {
          id: "panel-editor-main",
          kind: "editor",
          openDocumentIds: ["doc-main"],
          activeDocumentId: "doc-main",
          createdAt: "2026-03-15T00:00:00.000Z",
          updatedAt: "2026-03-15T00:00:00.000Z",
        },
      },
      layout: {
        id: "stack-editor",
        type: "stack",
        panelIds: ["panel-editor-main"],
        activePanelId: "panel-editor-main",
      },
      lastFocusedEditorPanelId: "panel-editor-main",
      lastFocusedTerminalPanelId: null,
    });
    localStore.set("igcse-editor-source-v2", 'OUTPUT "Legacy"');

    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"');

    expect(getActiveDocument(loaded)).toBeNull();
    expect(Object.values(loaded.nodes).filter((node) => node.type === "document")).toHaveLength(0);
    expect(localStore.has("igcse-editor-source-v2")).toBe(false);

    const savedWorkspace = createDocument(loaded, { name: "main", source: 'OUTPUT "Saved"' });
    await storage.saveWorkspace(savedWorkspace);

    const reloaded = await storage.loadWorkspace('OUTPUT "Fallback"');
    expect(getActiveDocument(reloaded)?.source).toBe('OUTPUT "Saved"');

    vi.unstubAllEnvs();
  });

  it("backfills the cloud workspace from local cache when Convex has no workspace yet", async () => {
    const localWorkspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "synced",
      source: 'OUTPUT "Local cache"',
      now: "2026-03-15T00:00:00.000Z",
    });
    dbStore.set("current", localWorkspace);
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: null }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud" });
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "Local cache"');
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/workspace", expect.objectContaining({ method: "GET" }));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/workspace",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ workspace: localWorkspace }),
      }),
    );
  });

  it("restores this account's newer unsynced checkpoint over the cloud copy and syncs it", async () => {
    const cloudWorkspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Cloud"', now: "2026-03-15T00:00:00.000Z",
    });
    const newer = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Typed after the last sync"', now: "2026-03-15T00:05:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: cloudWorkspace }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: cloudWorkspace }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(newer, "user_a", Date.parse("2026-03-15T00:05:00.000Z"));
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });

    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "Typed after the last sync"');
    expect(storage.takeRecoveredCopies("user_a")).toBe(false);
    // The session syncs recovered edits itself (so its status reflects the outcome); storage just flags them.
    expect(storage.takeAccountSyncPending("user_a")).toBe(true);
    expect(storage.takeAccountSyncPending("user_a")).toBe(false);
    expect(dbStore.has("unsynced:user_a")).toBe(true);
  });

  it("never restores another account's checkpoint", async () => {
    const cloudWorkspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "B cloud"', now: "2026-03-15T00:00:00.000Z",
    });
    const othersNewer = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "A on a shared computer"', now: "2026-03-15T00:09:00.000Z",
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ workspace: cloudWorkspace }), { status: 200 }));

    const storage = await import("@/lib/storage");
    await storage.saveDeviceCheckpoint(othersNewer, "user_a", Date.parse("2026-03-15T00:09:00.000Z"));
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_b" });

    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "B cloud"');
    expect(dbStore.has("unsynced:user_a")).toBe(true);
  });

  it("drops the checkpoint once an account sync succeeds", async () => {
    const workspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Synced"', now: "2026-03-15T00:00:00.000Z",
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.saveDeviceCheckpoint(workspace, "user_a", 1000);
    await storage.saveWorkspace(workspace, { mode: "cloud", checkpointOwner: "user_a", editedAt: 1000 });
    expect(dbStore.has("unsynced:user_a")).toBe(false);
  });

  it("keeps a checkpoint newer than the snapshot an account sync wrote", async () => {
    const workspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "A"', now: "2026-03-15T00:00:00.000Z",
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.saveDeviceCheckpoint(workspace, "user_a", 2000);
    await storage.saveWorkspace(workspace, { mode: "cloud", checkpointOwner: "user_a", editedAt: 1000 });
    expect(dbStore.has("unsynced:user_a")).toBe(true);
  });

  it("restores a newer checkpoint even when its change was a deletion", async () => {
    const cloudWorkspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Still here in the cloud"', now: "2026-03-15T00:00:00.000Z",
    });
    const afterDelete = createEmptyWorkspace("2026-03-15T00:00:00.000Z");
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: cloudWorkspace }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: cloudWorkspace }), { status: 200 }));
    const storage = await import("@/lib/storage");
    // A session that loaded the account, then deleted the file before it could sync.
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(afterDelete, "user_a", Date.parse("2026-03-15T00:10:00.000Z"));
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    expect(Object.values(loaded.nodes).some((node) => node.type === "document")).toBe(false);
  });

  it("prefers this account's checkpoint and skips the backfill when the account can't be read", async () => {
    const shared = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Old shared cache"', now: "2026-03-15T00:00:00.000Z",
    });
    const mine = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "My unsynced edit"', now: "2026-03-15T00:03:00.000Z",
    });
    dbStore.set("current", shared);
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.saveDeviceCheckpoint(mine, "user_a", Date.parse("2026-03-15T00:03:00.000Z"));
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "My unsynced edit"');
    expect(storage.takeAccountSyncPending("user_a")).toBe(true);
  });

  it("starts a new account empty instead of importing another student's device cache", async () => {
    const previousStudent = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "alice-homework", source: 'OUTPUT "Alice"', now: "2026-03-15T00:00:00.000Z",
    });
    dbStore.set("current", previousStudent);
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: null }), { status: 200 }));
    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_b" });
    expect(Object.values(loaded.nodes).some((node) => node.name === "alice-homework.pseudo")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("opens only the account's own copy after a failed read and holds account writes", async () => {
    dbStore.set("current", createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "someone-else", source: 'OUTPUT "Not mine"', now: "2026-03-15T00:00:00.000Z",
    }));
    const mine = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "mine", source: 'OUTPUT "Mine"', now: "2026-03-15T00:00:00.000Z",
    });
    dbStore.set("current:user_b", mine);
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    const storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_b" });
    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "Mine"');
    await expect(storage.saveWorkspace(loaded, { mode: "cloud", checkpointOwner: "user_b" })).rejects.toThrow(
      "couldn't be reached",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requires Convex to accept cloud-mode saves", async () => {
    const workspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "cloud",
      source: 'OUTPUT "Cloud"',
      now: "2026-03-15T00:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const storage = await import("@/lib/storage");

    await expect(storage.saveWorkspace(workspace, { mode: "cloud" })).rejects.toThrow(
      "Unable to save workspace to Convex. Unauthorized",
    );
    expect(dbStore.get("current")).toEqual(workspace);
  });

  it("sends a Clerk bearer token when cloud sync has one", async () => {
    const workspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "cloud",
      source: 'OUTPUT "Cloud"',
      now: "2026-03-15T00:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const storage = await import("@/lib/storage");
    await storage.saveWorkspace(workspace, {
      getAuthToken: async () => "session-token",
      mode: "cloud",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
        method: "PUT",
      }),
    );
  });

  it("writes to the account in order even when an earlier request is slower", async () => {
    const order: string[] = [];
    let releaseFirst: () => void = () => {};
    vi.mocked(fetch)
      .mockImplementationOnce(async (_url, init) => {
        await new Promise<void>((resolve) => { releaseFirst = resolve; });
        order.push(JSON.parse(String(init?.body)).workspace.marker);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
      .mockImplementationOnce(async (_url, init) => {
        order.push(JSON.parse(String(init?.body)).workspace.marker);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });
    const storage = await import("@/lib/storage");
    const base = createEmptyWorkspace("2026-03-15T00:00:00.000Z");
    const first = storage.saveWorkspace({ ...base, marker: "A" } as typeof base, { mode: "cloud" });
    const second = storage.saveWorkspace({ ...base, marker: "B" } as typeof base, { mode: "cloud" });
    await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1));
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(["A", "B"]);
  });

  it("never lets edits made while the account was unreachable replace it; they are added as copies", async () => {
    const account = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", source: 'OUTPUT "Twenty files of real work"', now: "2026-03-15T00:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }));
    const storage = await import("@/lib/storage");
    const offline = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const typedOffline = createDocument(offline, { name: "scratch", source: 'OUTPUT "Typed offline"' });
    await storage.saveDeviceCheckpoint(typedOffline, "user_a", Date.now());

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const names = Object.values(loaded.nodes).map((node) => node.name);
    expect(names).toContain("essay.pseudo");
    expect(names).toContain(storage.RECOVERED_FOLDER_NAME);
    expect(names).toContain("scratch.pseudo");
    expect(storage.takeRecoveredCopies("user_a")).toBe(true);
  });

  it("never replays a checkpoint over a deletion made elsewhere, even when no surviving file got newer", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T00:10:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const withOld = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "old", id: "doc-old", source: 'OUTPUT "old"', now: "2026-03-15T00:00:00.000Z",
    });
    const atLoad = createDocument(withOld, {
      name: "newest", id: "doc-newest", source: 'OUTPUT "v1"', now: "2026-03-15T00:05:00.000Z",
    });
    // Another device deleted "old"; "newest" is still the newest file, so the newest edit time did not change.
    const afterDeleteElsewhere = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "newest", id: "doc-newest", source: 'OUTPUT "v1"', now: "2026-03-15T00:05:00.000Z",
    });
    const deviceEdit = createDocument(withOld, {
      name: "newest", id: "doc-newest", source: 'OUTPUT "v1 plus edits here"', now: "2026-03-15T00:30:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: atLoad }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: afterDeleteElsewhere }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(deviceEdit, "user_a", Date.parse("2026-03-15T00:30:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).not.toContain('OUTPUT "old"');
    expect(sources).toContain('OUTPUT "v1"');
    expect(sources).toContain('OUTPUT "v1 plus edits here"');
    expect(storage.takeRecoveredCopies("user_a")).toBe(true);
  });

  it.each([
    { before: ["old"], after: ["new from home"] },
    { before: [], after: [""] },
  ])("never replays a checkpoint over runtime data files changed elsewhere ($before → $after)", async ({ before, after }) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T00:10:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const doc = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", id: "doc-main", source: 'OUTPUT "v1"', now: "2026-03-15T00:00:00.000Z",
    });
    const atLoad = updateVirtualFiles(doc, { "data.txt": before }, "2026-03-15T00:00:00.000Z");
    const changedElsewhere = updateVirtualFiles(doc, { "data.txt": after }, "2026-03-15T00:00:00.000Z");
    const deviceEdit = updateVirtualFiles(
      createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
        name: "main", id: "doc-main", source: 'OUTPUT "v1 plus edits here"', now: "2026-03-15T00:30:00.000Z",
      }),
      { "data.txt": before },
      "2026-03-15T00:30:00.000Z",
    );
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: atLoad }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: changedElsewhere }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(deviceEdit, "user_a", Date.parse("2026-03-15T00:30:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    expect(loaded.virtualFiles["data.txt"]).toEqual(after);
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "v1 plus edits here"');
  });

  it("replays a checkpoint on the unchanged account even when another device's clock ran ahead", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T00:10:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    // Saved by a device whose clock was a year fast.
    const account = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "future", id: "doc-future", source: 'OUTPUT "future"', now: "2027-03-15T00:00:00.000Z",
    });
    const afterLocalDelete = createEmptyWorkspace("2026-03-15T00:00:00.000Z");
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(afterLocalDelete, "user_a", Date.parse("2026-03-15T00:20:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    expect(Object.values(loaded.nodes).some((node) => node.type === "document")).toBe(false);
    expect(storage.takeAccountSyncPending("user_a")).toBe(true);
  });

  it("keeps work from another device when this device's older checkpoint differs", async () => {
    // This device read the account at 00:30 by its own clock; its edits are stamped by the same clock.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T00:30:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const atLoad = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "v1"', now: "2026-03-15T00:00:00.000Z",
    });
    const fromHome = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "v2 from home"', now: "2026-03-16T00:00:00.000Z",
    });
    const atSchool = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "v1 plus school edits"', now: "2026-03-15T01:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: atLoad }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: fromHome }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(atSchool, "user_a", Date.parse("2026-03-15T01:00:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "v2 from home"');
    expect(sources).toContain('OUTPUT "v1 plus school edits"');
  });

  it("clears a recovered checkpoint once its sync is acknowledged, so reloads don't add copies again", async () => {
    const account = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", source: 'OUTPUT "Account"', now: "2026-03-15T00:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    const offline = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(createDocument(offline, { name: "scratch", source: "OUTPUT 1" }), "user_a", Date.now() - 1000);
    const recovered = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    // What the session does: sync the recovered snapshot stamped as its latest edit.
    await storage.saveWorkspace(recovered, { mode: "cloud", checkpointOwner: "user_a", editedAt: Date.now() });
    expect(dbStore.has("unsynced:user_a")).toBe(false);
  });

  it("moves a newer checkpoint's base forward when this tab's earlier save is acknowledged", async () => {
    const account = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "v1"', now: "2026-03-15T00:00:00.000Z",
    });
    const savedA = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "A"', now: "2026-03-15T00:01:00.000Z",
    });
    const checkpointB = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "B"', now: "2026-03-15T00:02:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: savedA }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(checkpointB, "user_a", Date.parse("2026-03-15T00:02:00.000Z"));
    await storage.saveWorkspace(savedA, { mode: "cloud", checkpointOwner: "user_a", editedAt: Date.parse("2026-03-15T00:01:00.000Z") });
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    expect(getActiveDocument(loaded)?.source).toBe('OUTPUT "B"');
    expect(storage.takeRecoveredCopies("user_a")).toBe(false);
  });

  it("never lets another tab's save clear or rebase this tab's unsynced checkpoint", async () => {
    const workspace = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "main", source: 'OUTPUT "Tab B edit"', now: "2026-03-15T00:00:00.000Z",
    });
    const tabB = await import("@/lib/storage");
    await tabB.saveDeviceCheckpoint(workspace, "user_a", 1000);
    const before = dbStore.get("unsynced:user_a");

    vi.resetModules();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const tabA = await import("@/lib/storage");
    await tabA.saveWorkspace(workspace, { mode: "cloud", checkpointOwner: "user_a", editedAt: 5000 });

    expect(dbStore.get("unsynced:user_a")).toEqual(before);
  });

  it("copies only the files this device edited after its base version", async () => {
    // This device read the account at 00:30 by its own clock; its edits are stamped by the same clock.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T00:30:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const atLoad = createDocument(
      createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
        name: "untouched", id: "doc-untouched", source: 'OUTPUT "old"', now: "2026-03-15T00:00:00.000Z",
      }),
      { name: "essay", id: "doc-essay", source: 'OUTPUT "v1"', now: "2026-03-15T00:00:00.000Z" },
    );
    const fromHome = createDocument(
      createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
        name: "untouched", id: "doc-untouched", source: 'OUTPUT "updated at home"', now: "2026-03-16T00:00:00.000Z",
      }),
      { name: "essay", id: "doc-essay", source: 'OUTPUT "v2 home"', now: "2026-03-16T00:00:00.000Z" },
    );
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: atLoad }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: fromHome }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const atSchool = updateDocumentSource(atLoad, "doc-essay", 'OUTPUT "school edit"', "2026-03-15T01:00:00.000Z");
    await storage.saveDeviceCheckpoint(atSchool, "user_a", Date.parse("2026-03-15T01:00:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a", recoveredFolderName: "Recovered" });
    const folder = Object.values(loaded.nodes).find((node) => node.name === "Recovered");
    const copies = Object.values(loaded.nodes).filter((node) => node.parentId === folder?.id);
    expect(copies.map((node) => (node.type === "document" ? node.source : ""))).toEqual(['OUTPUT "school edit"']);
  });

  it("keeps this device's edits as copies even when another device's clock ran fast", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    // The account was last written by a lab PC whose clock ran 20 minutes fast.
    const fromFastLabPc = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "E0"', now: "2026-03-15T10:20:00.000Z",
    });
    const changedElsewhere = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "E2 phone"', now: "2026-03-15T10:30:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: fromFastLabPc }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: changedElsewhere }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    // This laptop edits at 10:05 by its own (correct) clock, earlier than the lab PC's skewed stamp.
    const laptopEdit = updateDocumentSource(fromFastLabPc, "doc-essay", 'OUTPUT "E1 laptop"', "2026-03-15T10:05:00.000Z");
    await storage.saveDeviceCheckpoint(laptopEdit, "user_a", Date.parse("2026-03-15T10:05:00.000Z"));

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "E2 phone"');
    expect(sources).toContain('OUTPUT "E1 laptop"');
  });

  it("clears an already-synced checkpoint on load even though a different tab wrote it", async () => {
    const synced = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "E1"', now: "2026-03-15T00:00:00.000Z",
    });
    const previousTab = await import("@/lib/storage");
    await previousTab.saveDeviceCheckpoint(synced, "user_a", 1000);
    vi.resetModules();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ workspace: synced }), { status: 200 }));
    const storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await vi.waitFor(() => expect(dbStore.has("unsynced:user_a")).toBe(false));
  });

  it("keeps an edit made while an earlier save was in flight recoverable after that save is acknowledged", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const account = createDocument(
      createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
        name: "notes", id: "doc-notes", source: 'OUTPUT "fast clock"', now: "2026-03-15T11:00:00.000Z",
      }),
      { name: "essay", id: "doc-essay", source: 'OUTPUT "v0"', now: "2026-03-15T09:00:00.000Z" },
    );
    const savedA = updateDocumentSource(account, "doc-essay", 'OUTPUT "A"', "2026-03-15T10:01:00.000Z");
    const editB = updateDocumentSource(savedA, "doc-essay", 'OUTPUT "B"', "2026-03-15T10:02:00.000Z");
    let releaseSave: () => void = () => {};
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }))
      .mockImplementationOnce(async () => {
        await new Promise<void>((resolve) => { releaseSave = resolve; });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: savedA }), { status: 200 }));
    const storage = await import("@/lib/storage");
    // A different tab's checkpoint for B (so this tab's acknowledgement can't rebase it), written mid-save.
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const save = storage.saveWorkspace(savedA, {
      mode: "cloud", checkpointOwner: "user_a", editedAt: Date.parse("2026-03-15T10:01:00.000Z"),
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    vi.setSystemTime(new Date("2026-03-15T10:02:00.000Z"));
    await storage.saveDeviceCheckpoint(editB, "user_a", Date.parse("2026-03-15T10:02:00.000Z"));
    vi.setSystemTime(new Date("2026-03-15T10:03:00.000Z"));
    releaseSave();
    await save;

    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "B"');
  });

  it("keeps restored edits recoverable when their sync fails and the tab crashes again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const account = createDocument(
      createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
        name: "notes", id: "doc-notes", source: 'OUTPUT "N0"', now: "2026-03-15T09:00:00.000Z",
      }),
      { name: "essay", id: "doc-essay", source: 'OUTPUT "E0"', now: "2026-03-15T09:00:00.000Z" },
    );
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }));
    let storage = await import("@/lib/storage");
    // 1. Laptop edits the essay and crashes.
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    vi.setSystemTime(new Date("2026-03-15T10:05:00.000Z"));
    const essayEdit = updateDocumentSource(account, "doc-essay", 'OUTPUT "E1 laptop"', "2026-03-15T10:05:00.000Z");
    await storage.saveDeviceCheckpoint(essayEdit, "user_a", Date.parse("2026-03-15T10:05:00.000Z"));

    // 2. Reopen restores it in place (its sync then fails); 3. the student edits notes and the tab crashes again.
    vi.resetModules();
    vi.setSystemTime(new Date("2026-03-15T11:00:00.000Z"));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }));
    storage = await import("@/lib/storage");
    const restored = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    vi.setSystemTime(new Date("2026-03-15T11:05:00.000Z"));
    const notesEdit = updateDocumentSource(restored, "doc-notes", 'OUTPUT "N1"', "2026-03-15T11:05:00.000Z");
    await storage.saveDeviceCheckpoint(notesEdit, "user_a", Date.parse("2026-03-15T11:05:00.000Z"));

    // 4. The phone changes another file; 5. the laptop reopens.
    const fromPhone = createDocument(account, { name: "phone", source: 'OUTPUT "P"', now: "2026-03-15T12:00:00.000Z" });
    vi.resetModules();
    vi.setSystemTime(new Date("2026-03-15T13:00:00.000Z"));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: fromPhone }), { status: 200 }));
    storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "E1 laptop"');
    expect(sources).toContain('OUTPUT "N1"');
  });

  it("keeps edits recoverable after a merged (copied) restore whose sync fails and a second crash", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-15T10:00:00.000Z"));
    onTestFinished(() => { vi.useRealTimers(); });
    const account = createDocument(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      name: "essay", id: "doc-essay", source: 'OUTPUT "E0"', now: "2026-03-15T09:00:00.000Z",
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: account }), { status: 200 }));
    let storage = await import("@/lib/storage");
    await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    vi.setSystemTime(new Date("2026-03-15T10:05:00.000Z"));
    const laptopEdit = updateDocumentSource(account, "doc-essay", 'OUTPUT "E1 laptop"', "2026-03-15T10:05:00.000Z");
    await storage.saveDeviceCheckpoint(laptopEdit, "user_a", Date.parse("2026-03-15T10:05:00.000Z"));

    // The account changes elsewhere before the reopen, so the restore merges the laptop edit as a copy;
    // its sync then fails and the tab crashes again without further edits.
    const changed = createDocument(account, { name: "phone", source: 'OUTPUT "P1"', now: "2026-03-15T10:30:00.000Z" });
    vi.resetModules();
    vi.setSystemTime(new Date("2026-03-15T11:00:00.000Z"));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: changed }), { status: 200 }));
    storage = await import("@/lib/storage");
    const merged = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    await storage.saveDeviceCheckpoint(merged, "user_a", Date.parse("2026-03-15T11:00:00.000Z"));

    const changedAgain = createDocument(changed, { name: "phone2", source: 'OUTPUT "P2"', now: "2026-03-15T12:00:00.000Z" });
    vi.resetModules();
    vi.setSystemTime(new Date("2026-03-15T13:00:00.000Z"));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ workspace: changedAgain }), { status: 200 }));
    storage = await import("@/lib/storage");
    const loaded = await storage.loadWorkspace('OUTPUT "Fallback"', { mode: "cloud", checkpointOwner: "user_a" });
    const sources = Object.values(loaded.nodes).flatMap((node) => (node.type === "document" ? [node.source] : []));
    expect(sources).toContain('OUTPUT "E1 laptop"');
  });

  it("sends a queued account write with the sign-in of the account that made it", async () => {
    let releaseFirst: () => void = () => {};
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockImplementationOnce(async () => {
        await new Promise<void>((resolve) => { releaseFirst = resolve; });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    let signedInAs = "account-A";
    const getAuthToken = async () => signedInAs;
    const workspace = createEmptyWorkspace("2026-03-15T00:00:00.000Z");
    const first = storage.saveWorkspace(workspace, { mode: "cloud", getAuthToken });
    const second = storage.saveWorkspace(workspace, { mode: "cloud", getAuthToken });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    signedInAs = "account-B";
    releaseFirst();
    await Promise.all([first, second]);
    const headers = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer account-A");
  });

  it("keeps saves in request order even when an earlier save's sign-in token is slower", async () => {
    const order: string[] = [];
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (_url, init) => {
      order.push(JSON.parse(String(init?.body)).workspace.marker);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const storage = await import("@/lib/storage");
    const base = createEmptyWorkspace("2026-03-15T00:00:00.000Z");
    let releaseSlowToken: (token: string) => void = () => {};
    const slowToken = () => new Promise<string>((resolve) => { releaseSlowToken = resolve; });
    const older = storage.saveWorkspace({ ...base, marker: "older" } as typeof base, { mode: "cloud", getAuthToken: slowToken });
    const newer = storage.saveWorkspace({ ...base, marker: "newer" } as typeof base, { mode: "cloud", getAuthToken: async () => "t" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    releaseSlowToken("t");
    await Promise.all([older, newer]);
    expect(order).toEqual(["older", "newer"]);
  });

  it("asks for the sign-in token as soon as the save is requested", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const storage = await import("@/lib/storage");
    let signedInAs = "account-A";
    const save = storage.saveWorkspace(createEmptyWorkspace("2026-03-15T00:00:00.000Z"), {
      mode: "cloud",
      getAuthToken: async () => signedInAs,
    });
    signedInAs = "account-B";
    await save;
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer account-A");
  });
});
