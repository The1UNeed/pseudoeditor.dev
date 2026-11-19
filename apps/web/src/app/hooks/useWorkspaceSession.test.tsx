import { act, renderHook, waitFor } from "@testing-library/react";
import { createDocument, createEmptyWorkspace, updateVirtualFiles, type WorkspaceState } from "@pseudoeditor/workspace";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  loadWorkspace: vi.fn(),
  saveWorkspace: vi.fn(),
  saveDeviceCheckpoint: vi.fn(),
  stashGuestDraft: vi.fn(),
  takeGuestImported: vi.fn(),
  takeRecoveredCopies: vi.fn(),
  takeAccountSyncPending: vi.fn(),
  isAccountUnreachable: vi.fn(),
  isWorkspaceConflictError: vi.fn(),
  getWorkspaceTooLargeDetail: vi.fn(),
}));

vi.mock("@/lib/storage", () => storage);
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
const { runMock, compileMock } = vi.hoisted(() => ({ runMock: vi.fn(), compileMock: vi.fn() }));
vi.mock("@/runtime/executeRuntime", () => ({ pseudocodeRuntimeRunner: { run: runMock } }));
vi.mock("@/compiler", () => ({ compilePseudocode: compileMock }));

import { useWorkspaceSession } from "./useWorkspaceSession";

describe("useWorkspaceSession", () => {
  beforeEach(() => {
    for (const mock of Object.values(storage)) mock.mockReset();
    runMock.mockReset();
    compileMock.mockReset();
    storage.loadWorkspace.mockImplementation(async () => createEmptyWorkspace());
    storage.saveWorkspace.mockResolvedValue(undefined);
    storage.saveDeviceCheckpoint.mockResolvedValue(undefined);
    storage.getWorkspaceTooLargeDetail.mockReturnValue(null);
    storage.isWorkspaceConflictError.mockImplementation((error: unknown) => error instanceof Error && error.name === "WorkspaceConflictError");
  });

  it("keeps a guest's files when they sign in, and tells them where the files went", async () => {
    const { result, rerender } = renderHook(
      ({ signedIn }: { signedIn: boolean }) =>
        useWorkspaceSession("", {
          persistenceMode: signedIn ? "cloud" : "memory",
          checkpointOwner: signedIn ? "user_a" : null,
          guestFolderName: "Guest",
        }),
      { initialProps: { signedIn: false } },
    );
    await waitFor(() => expect(result.current.workspace).not.toBeNull());
    act(() => {
      result.current.createDocumentInWorkspace(undefined, { name: "draft", source: 'OUTPUT "guest work"' });
    });

    storage.takeGuestImported.mockReturnValueOnce(true);
    rerender({ signedIn: true });

    await waitFor(() => expect(result.current.syncNotice).toBe("guest-imported"));
    const stashed = storage.stashGuestDraft.mock.calls.at(-1)?.[0] as WorkspaceState;
    expect(Object.values(stashed.nodes).some((node) => node.type === "document" && node.source === 'OUTPUT "guest work"')).toBe(true);
    // The guest work is stashed before the account load that imports it.
    expect(storage.stashGuestDraft.mock.invocationCallOrder.at(-1)!).toBeLessThan(storage.loadWorkspace.mock.invocationCallOrder.at(-1)!);
    expect(storage.loadWorkspace).toHaveBeenLastCalledWith("", expect.objectContaining({ mode: "cloud", checkpointOwner: "user_a", guestFolderName: "Guest" }));
  });

  it("asks for a reload when another tab or device saved first", async () => {
    const conflict = Object.assign(new Error("changed"), { name: "WorkspaceConflictError" });
    storage.saveWorkspace.mockRejectedValue(conflict);
    const { result } = renderHook(() => useWorkspaceSession("", { persistenceMode: "cloud", checkpointOwner: "user_a" }));
    await waitFor(() => expect(result.current.workspace).not.toBeNull());

    act(() => {
      result.current.createDocumentInWorkspace(undefined, { name: "essay", source: "OUTPUT 1" });
    });

    await waitFor(() => expect(result.current.syncNotice).toBe("account-changed"));
    expect(result.current.saveError).not.toBeNull();
  });

  it("says cloud saving is paused, and why, when the account refuses the workspace as too large", async () => {
    const tooLarge = Object.assign(new Error("Workspace payload has too many nodes (501/500)."), { name: "WorkspaceTooLargeError" });
    storage.saveWorkspace.mockRejectedValue(tooLarge);
    storage.getWorkspaceTooLargeDetail.mockImplementation((error: unknown) => (error === tooLarge ? tooLarge.message : null));
    const { result } = renderHook(() => useWorkspaceSession("", { persistenceMode: "cloud", checkpointOwner: "user_a" }));
    await waitFor(() => expect(result.current.workspace).not.toBeNull());

    act(() => {
      result.current.createDocumentInWorkspace(undefined, { name: "essay", source: "OUTPUT 1" });
    });

    await waitFor(() => expect(result.current.saveError).toBe("Too large: Workspace payload has too many nodes (501/500)."));
  });

  it("never lets a run started before signing in replace the account's data files", async () => {
    const account = updateVirtualFiles(createDocument(createEmptyWorkspace(), { name: "essay", source: "OUTPUT 1" }), {
      "results.txt": ["saved in the account"],
    });
    storage.loadWorkspace.mockImplementation(async (_source: string, options: { mode?: string }) =>
      options.mode === "cloud" ? account : createEmptyWorkspace(),
    );
    compileMock.mockReturnValue({ success: true, diagnostics: [], astJson: "{}" });
    let finishRun: (result: unknown) => void = () => {};
    runMock.mockImplementation(() => new Promise((resolve) => { finishRun = resolve; }));
    const { result, rerender } = renderHook(
      ({ signedIn }: { signedIn: boolean }) =>
        useWorkspaceSession("", { persistenceMode: signedIn ? "cloud" : "memory", checkpointOwner: signedIn ? "user_a" : null }),
      { initialProps: { signedIn: false } },
    );
    await waitFor(() => expect(result.current.workspace).not.toBeNull());
    act(() => {
      result.current.createDocumentInWorkspace(undefined, { name: "guest", source: 'OUTPUT "x"' });
    });

    // The guest starts a run, then signs in while it is still running.
    let run: Promise<unknown> = Promise.resolve();
    act(() => {
      run = result.current.runNow();
    });
    await waitFor(() => expect(runMock).toHaveBeenCalled());
    rerender({ signedIn: true });
    await waitFor(() => expect(result.current.workspace?.virtualFiles).toEqual({ "results.txt": ["saved in the account"] }));

    await act(async () => {
      finishRun({ success: true, stdout: "done", stderr: "", diagnostics: [], virtualFiles: {} });
      await run;
    });
    expect(result.current.workspace?.virtualFiles).toEqual({ "results.txt": ["saved in the account"] });
  });

  it("drops a run whose workspace was replaced while it was still compiling", async () => {
    const account = updateVirtualFiles(createDocument(createEmptyWorkspace(), { name: "essay", source: "OUTPUT 1" }), {
      "results.txt": ["saved in the account"],
    });
    storage.loadWorkspace.mockImplementation(async (_source: string, options: { mode?: string }) =>
      options.mode === "cloud" ? account : createEmptyWorkspace(),
    );
    // Live diagnostics compile too, so hold every compile and release them all at once.
    const pendingCompiles: Array<(result: unknown) => void> = [];
    compileMock.mockImplementation(() => new Promise((resolve) => { pendingCompiles.push(resolve); }));
    runMock.mockResolvedValue({ success: true, stdout: "done", stderr: "", diagnostics: [], virtualFiles: {} });
    const { result, rerender } = renderHook(
      ({ signedIn }: { signedIn: boolean }) =>
        useWorkspaceSession("", { persistenceMode: signedIn ? "cloud" : "memory", checkpointOwner: signedIn ? "user_a" : null }),
      { initialProps: { signedIn: false } },
    );
    await waitFor(() => expect(result.current.workspace).not.toBeNull());
    act(() => {
      result.current.createDocumentInWorkspace(undefined, { name: "slow", source: 'OUTPUT "compiled slowly"' });
    });

    let run: Promise<unknown> = Promise.resolve();
    act(() => {
      run = result.current.runNow();
    });
    await waitFor(() => expect(compileMock).toHaveBeenCalled());
    rerender({ signedIn: true });
    await waitFor(() => expect(result.current.workspace?.virtualFiles).toEqual({ "results.txt": ["saved in the account"] }));

    await act(async () => {
      for (const finish of pendingCompiles) finish({ success: true, diagnostics: [], astJson: "{}" });
      await run;
    });
    expect(runMock).not.toHaveBeenCalled();
    expect(result.current.workspace?.virtualFiles).toEqual({ "results.txt": ["saved in the account"] });
  });
});
