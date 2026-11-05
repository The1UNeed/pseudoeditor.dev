"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closeEditorTab,
  closePanel,
  createDocument,
  createFolder,
  createPanel,
  deleteNodes,
  dockPanel,
  ensureTerminalPanel,
  focusPanel,
  getActiveDocument,
  getNodePath,
  moveEditorTab,
  moveNodes,
  openDocumentInFocusedEditor,
  renameNode,
  resizeSplit,
  resetWorkspaceLayout,
  setDocumentCompileSummary,
  setEditorPanelActiveDocument,
  setExpandedFolders,
  setFilesPanelSelection,
  setWorkspaceSyntax,
  type WorkspaceSyntaxId,
  splitEditorPanel,
  type CompileSummary,
  type WorkspaceDockPosition,
  type WorkspacePanelKind,
  type WorkspaceState,
  updateDocumentSource,
  updateVirtualFiles,
  workspaceHasFolder,
} from "@pseudoeditor/workspace";
import type { Diagnostic, RunTraceStep } from "@/compiler/types";
import { track } from "@/lib/analytics";
import {
  isAccountUnreachable,
  loadWorkspace,
  saveDeviceCheckpoint,
  saveWorkspace,
  takeAccountSyncPending,
  takeRecoveredCopies,
} from "@/lib/storage";
import type { WorkspacePersistenceMode } from "@/lib/platform";
import { pseudocodeRuntimeRunner } from "@/runtime/executeRuntime";
import {
  compilePseudocodeInWorker,
  getCompileCacheKey,
  preloadPseudocodeCompiler,
} from "@/runtime/compilePseudocodeInWorker";

const INPUT_REQUEST_ERROR_TEXT = "INPUT requested but no stdin lines remain";
const MAX_INTERACTIVE_INPUTS = 200;
const TERMINAL_PROMPT = ">";
const DEFAULT_AUTO_SAVE_DELAY_MS = 5 * 60 * 1000;
const LIVE_DIAGNOSTICS_DELAY_MS = 450;
const GENERIC_RUNTIME_HINT = "Check pseudocode runtime state and input values.";
// Device-only saves are a cheap IndexedDB write: save shortly after typing stops, and at least this often.
const LOCAL_SAVE_IDLE_MS = 1000;
const LOCAL_SAVE_MAX_WAIT_MS = 5000;

/** The steps of the last finished run, which the flowchart replays block by block. */
export interface RunTrace {
  id: number;
  documentId: string;
  /** The code that ran; the trace's line numbers refer to it. */
  source: string;
  steps: RunTraceStep[];
  truncated: boolean;
  output: string[];
  /** False when the run stopped on an error. */
  completed: boolean;
  /** The line the error points at, when the run stopped on one. */
  errorLine?: number;
}

export interface AppNotice {
  tone: "error" | "info";
  message: string;
}

interface WorkspaceSessionOptions {
  autoSaveDelayMs?: number;
  cloudSyncEnabled?: boolean;
  cloudSyncLoading?: boolean;
  getCloudAuthToken?: () => Promise<string | null>;
  persistenceMode?: WorkspacePersistenceMode;
  /** The signed-in account id; enables the device checkpoint of not-yet-synced edits in cloud mode. */
  checkpointOwner?: string | null;
  /** Localized name of the folder that receives this device's versions after a sync conflict. */
  recoveredFolderName?: string;
}

interface PendingTerminalInput {
  panelId: string | null;
  prompt: string | null;
  text: string;
}

type SaveRequestSource = "autosave" | "manual";

function persistenceModeUsesCheckpoint(options: WorkspaceSessionOptions): boolean {
  return (options.persistenceMode ?? (options.cloudSyncEnabled ? "cloud" : "local")) === "cloud";
}

function isInputRequestRuntimeError(stderr: string): boolean {
  return stderr.includes(INPUT_REQUEST_ERROR_TEXT);
}

function formatDiagnostics(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) {
    return "";
  }
  return diagnostics
    .map(
      (diagnostic) =>
        `[${diagnostic.code}] ${diagnostic.severity.toUpperCase()} L${diagnostic.line}:C${diagnostic.column} ${diagnostic.message}`,
    )
    .join("\n");
}

function summarizeDiagnostics(diagnostics: Diagnostic[]): CompileSummary {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
  return {
    severity: errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "success",
    errorCount,
    warningCount,
    updatedAt: new Date().toISOString(),
  };
}

export function useWorkspaceSession(defaultSource: string, options: WorkspaceSessionOptions = {}) {
  const persistenceMode =
    options.persistenceMode ?? (options.cloudSyncEnabled ? "cloud" : "local");
  const cloudSyncLoading = options.cloudSyncLoading ?? false;
  const autoSaveDelayMs = Math.max(1000, options.autoSaveDelayMs ?? DEFAULT_AUTO_SAVE_DELAY_MS);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [compileDiagnostics, setCompileDiagnostics] = useState<Diagnostic[]>([]);
  const [terminalOutputs, setTerminalOutputs] = useState<Record<string, string>>({});
  const [pendingInput, setPendingInput] = useState<PendingTerminalInput>({
    panelId: null,
    prompt: null,
    text: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTrace, setLastRunTrace] = useState<RunTrace | null>(null);
  /** The error that stopped the last run, with its location, so Output can link straight to the line. */
  const [lastRunError, setLastRunError] = useState<
    (Diagnostic & { documentId: string; source: string; syntaxId: string }) | null
  >(null);
  const runTraceIdRef = useRef(0);
  const [runningTerminalPanelId, setRunningTerminalPanelId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  /** Cloud mode: every edit is already in this device's checkpoint, even if the account sync is still pending. */
  const [unsyncedEditsSafeOnDevice, setUnsyncedEditsSafeOnDevice] = useState(false);
  const checkpointOwner = persistenceModeUsesCheckpoint(options) ? (options.checkpointOwner ?? null) : null;
  const checkpointOwnerRef = useRef(checkpointOwner);
  const recoveredFolderNameRef = useRef(options.recoveredFolderName);
  useEffect(() => {
    recoveredFolderNameRef.current = options.recoveredFolderName;
  }, [options.recoveredFolderName]);
  const checkpointTimerRef = useRef<number | null>(null);
  const checkpointFirstChangeAtRef = useRef<number | null>(null);
  /** Wall-clock time of the latest workspace change; ties checkpoints and saves to the edits they contain. */
  const lastEditAtRef = useRef(0);
  const persistWorkspaceRef = useRef<
    ((state: WorkspaceState, requestId: number, source: SaveRequestSource) => Promise<boolean>) | null
  >(null);
  const [appNotice, setAppNotice] = useState<AppNotice | null>(null);
  /** Account-sync situations the page explains (localized) right after loading. */
  const [syncNotice, setSyncNotice] = useState<"account-unreachable" | "recovered-copies" | null>(null);

  const workspaceRef = useRef<WorkspaceState | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveRequestIdRef = useRef(0);
  const activeSaveCountRef = useRef(0);
  const firstUnsavedChangeAtRef = useRef<number | null>(null);
  const loadedRef = useRef(false);
  const getCloudAuthTokenRef = useRef(options.getCloudAuthToken);
  const pendingInputResolverRef = useRef<((value: string | null) => void) | null>(null);

  useEffect(() => {
    getCloudAuthTokenRef.current = options.getCloudAuthToken;
  }, [options.getCloudAuthToken]);

  useEffect(() => {
    checkpointOwnerRef.current = checkpointOwner;
  }, [checkpointOwner]);

  /** Writes the latest workspace to the device checkpoint now (cloud mode only). */
  const writeCheckpointNow = useCallback(() => {
    if (checkpointTimerRef.current !== null) {
      window.clearTimeout(checkpointTimerRef.current);
      checkpointTimerRef.current = null;
    }
    checkpointFirstChangeAtRef.current = null;
    const owner = checkpointOwnerRef.current;
    const latestWorkspace = workspaceRef.current;
    if (!owner || !latestWorkspace) return;
    const revision = saveRequestIdRef.current;
    void saveDeviceCheckpoint(latestWorkspace, owner, lastEditAtRef.current).then(
      () => {
        if (saveRequestIdRef.current === revision) setUnsyncedEditsSafeOnDevice(true);
      },
      () => {
        /* the account sync and unload warning still cover these edits */
      },
    );
  }, []);

  const getCurrentCloudAuthToken = useCallback(async () => {
    return await (getCloudAuthTokenRef.current?.() ?? null);
  }, []);

  useEffect(() => {
    if (cloudSyncLoading) {
      return;
    }

    let cancelled = false;
    loadedRef.current = false;
    workspaceRef.current = null;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setWorkspace(null);
      setHasPendingSave(false);
      setSaveError(null);
      setIsSaving(false);
    });

    void loadWorkspace(defaultSource, {
      ...(getCloudAuthTokenRef.current ? { getAuthToken: getCurrentCloudAuthToken } : {}),
      mode: persistenceMode,
      ...(checkpointOwnerRef.current
        ? { checkpointOwner: checkpointOwnerRef.current, recoveredFolderName: recoveredFolderNameRef.current }
        : {}),
    }).then((loadedWorkspace) => {
      if (cancelled) {
        return;
      }
      workspaceRef.current = loadedWorkspace;
      setWorkspace(loadedWorkspace);
      setHasPendingSave(false);
      setLastSavedAt(null);
      loadedRef.current = true;
      // Recovered edits (or an account that couldn't be read) still have to reach the account: sync through the
      // normal save path so "Unsaved", failures and the leave warning all reflect it until it is acknowledged.
      const owner = checkpointOwnerRef.current;
      setSyncNotice(
        isAccountUnreachable(owner) ? "account-unreachable" : takeRecoveredCopies(owner) ? "recovered-copies" : null,
      );
      if (takeAccountSyncPending(owner)) {
        // Stamp the recovered snapshot as this tab's latest edit so its acknowledged save clears the checkpoint.
        lastEditAtRef.current = Math.max(Date.now(), lastEditAtRef.current + 1);
        const requestId = saveRequestIdRef.current + 1;
        saveRequestIdRef.current = requestId;
        setHasPendingSave(true);
        void persistWorkspaceRef.current?.(loadedWorkspace, requestId, "autosave");
      }
    });

    return () => {
      cancelled = true;
      const owner = checkpointOwnerRef.current;
      const pendingWorkspace = workspaceRef.current;
      if (checkpointTimerRef.current !== null) {
        window.clearTimeout(checkpointTimerRef.current);
        checkpointTimerRef.current = null;
        // Unsynced edits must reach the checkpoint even when no account save is queued (an immediate save may
        // already have taken the timer and could still fail).
        if (owner && pendingWorkspace && loadedRef.current) {
          void saveDeviceCheckpoint(pendingWorkspace, owner, lastEditAtRef.current).catch(() => {});
        }
      }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        // Leaving the workspace (another page in the app, or a storage-mode change) must not drop the edits
        // that were waiting for autosave: write them to the store this workspace was loaded from.
        if (pendingWorkspace && loadedRef.current && persistenceMode !== "memory") {
          if (owner) void saveDeviceCheckpoint(pendingWorkspace, owner, lastEditAtRef.current).catch(() => {});
          void saveWorkspace(pendingWorkspace, {
            ...(getCloudAuthTokenRef.current ? { getAuthToken: getCurrentCloudAuthToken } : {}),
            mode: persistenceMode,
            ...(owner ? { checkpointOwner: owner, editedAt: lastEditAtRef.current } : {}),
          }).catch(() => {
            /* best effort; the unload warning covers closing the tab */
          });
        }
      }
      const resolver = pendingInputResolverRef.current;
      if (resolver) {
        pendingInputResolverRef.current = null;
        resolver(null);
      }
    };
  }, [cloudSyncLoading, defaultSource, getCurrentCloudAuthToken, persistenceMode, checkpointOwner]);

  const persistWorkspace = useCallback(async (
    nextWorkspace: WorkspaceState,
    requestId: number,
    source: SaveRequestSource,
  ) => {
    if (persistenceMode === "memory") {
      if (saveRequestIdRef.current !== requestId) {
        return false;
      }
      setSaveError(null);
      setHasPendingSave(true);
      setLastSavedAt(null);
      setIsSaving(false);
      return false;
    }

    activeSaveCountRef.current += 1;
    setIsSaving(true);
    // Saves always write the latest workspace, so the latest edit time describes this snapshot.
    const snapshotEditedAt = lastEditAtRef.current;
    try {
      await saveWorkspace(nextWorkspace, {
        ...(getCloudAuthTokenRef.current ? { getAuthToken: getCurrentCloudAuthToken } : {}),
        mode: persistenceMode,
        ...(checkpointOwnerRef.current
          ? { checkpointOwner: checkpointOwnerRef.current, editedAt: snapshotEditedAt }
          : {}),
      });
      if (saveRequestIdRef.current !== requestId) {
        // The write succeeded; newer edits arrived meanwhile and stay flagged as unsaved for the next save.
        return true;
      }
      setSaveError(null);
      setHasPendingSave(false);
      setLastSavedAt(Date.now());
      return true;
    } catch {
      if (saveRequestIdRef.current !== requestId) {
        return false;
      }
      setSaveError(
        source === "manual"
          ? "Save failed. Changes remain on this device."
          : "Autosave failed. Changes remain on this device.",
      );
      setHasPendingSave(true);
      return false;
    } finally {
      // "Saving" tracks writes in flight, not whether newer edits exist: an edit made during a save must not
      // leave the control stuck on "Saving…" (newer edits stay flagged through hasPendingSave instead).
      activeSaveCountRef.current = Math.max(0, activeSaveCountRef.current - 1);
      if (activeSaveCountRef.current === 0) {
        setIsSaving(false);
      }
    }
  }, [getCurrentCloudAuthToken, persistenceMode]);

  useEffect(() => {
    persistWorkspaceRef.current = persistWorkspace;
  }, [persistWorkspace]);

  const commitWorkspace = useCallback(
    (nextWorkspace: WorkspaceState, mode: "immediate" | "debounced") => {
      workspaceRef.current = nextWorkspace;
      lastEditAtRef.current = Math.max(Date.now(), lastEditAtRef.current + 1);
      setWorkspace(nextWorkspace);

      if (!loadedRef.current) {
        return;
      }

      const requestId = saveRequestIdRef.current + 1;
      saveRequestIdRef.current = requestId;
      setHasPendingSave(true);

      if (persistenceMode === "memory") {
        setSaveError(null);
        setLastSavedAt(null);
        return;
      }

      if (mode === "immediate") {
        if (saveTimerRef.current !== null) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        firstUnsavedChangeAtRef.current = null;
        if (checkpointOwnerRef.current) {
          setUnsyncedEditsSafeOnDevice(false);
          writeCheckpointNow();
        }
        void persistWorkspace(nextWorkspace, requestId, "autosave");
        return;
      }

      const flush = () => {
        saveTimerRef.current = null;
        firstUnsavedChangeAtRef.current = null;
        const latestWorkspace = workspaceRef.current;
        if (latestWorkspace) {
          void persistWorkspace(latestWorkspace, saveRequestIdRef.current, "autosave");
        }
      };

      if (persistenceMode === "local") {
        // Save a second after typing stops, but never let continuous typing hold a save back past the max wait.
        const now = Date.now();
        firstUnsavedChangeAtRef.current ??= now;
        const untilMaxWait = firstUnsavedChangeAtRef.current + LOCAL_SAVE_MAX_WAIT_MS - now;
        if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(flush, Math.max(0, Math.min(LOCAL_SAVE_IDLE_MS, untilMaxWait)));
        return;
      }

      // Account syncing is a network write, so it keeps the chosen interval; meanwhile a device checkpoint on the
      // fast local schedule makes sure a crash or closed tab between syncs loses nothing.
      setUnsyncedEditsSafeOnDevice(false);
      if (checkpointOwnerRef.current) {
        const now = Date.now();
        checkpointFirstChangeAtRef.current ??= now;
        const untilMaxWait = checkpointFirstChangeAtRef.current + LOCAL_SAVE_MAX_WAIT_MS - now;
        if (checkpointTimerRef.current !== null) window.clearTimeout(checkpointTimerRef.current);
        checkpointTimerRef.current = window.setTimeout(
          writeCheckpointNow,
          Math.max(0, Math.min(LOCAL_SAVE_IDLE_MS, untilMaxWait)),
        );
      }

      // The account interval is a ceiling, not a debounce: continuous typing must not postpone the sync forever.
      // The first unsaved change starts the clock; the save writes the latest state.
      if (saveTimerRef.current === null) {
        saveTimerRef.current = window.setTimeout(flush, autoSaveDelayMs);
      }
    },
    [autoSaveDelayMs, persistWorkspace, persistenceMode, writeCheckpointNow],
  );

  // Save before the page can be discarded: mobile Safari often skips beforeunload for backgrounded tabs.
  useEffect(() => {
    if (typeof window === "undefined" || persistenceMode === "memory") {
      return;
    }
    const flushPendingSave = () => {
      // The checkpoint is a local write, so it lands even when the account request is cut off by the unload.
      if (checkpointTimerRef.current !== null) writeCheckpointNow();
      if (saveTimerRef.current === null) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      firstUnsavedChangeAtRef.current = null;
      const latestWorkspace = workspaceRef.current;
      if (latestWorkspace) {
        void persistWorkspace(latestWorkspace, saveRequestIdRef.current, "autosave");
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushPendingSave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushPendingSave);
    };
  }, [persistWorkspace, persistenceMode, writeCheckpointNow]);

  const resolvePendingInput = useCallback((value: string | null) => {
    const resolver = pendingInputResolverRef.current;
    if (!resolver) {
      return;
    }
    pendingInputResolverRef.current = null;
    setPendingInput({
      panelId: null,
      prompt: null,
      text: "",
    });
    resolver(value);
  }, []);

  const waitForTerminalInput = useCallback((panelId: string, prompt: string) => {
    const existingResolver = pendingInputResolverRef.current;
    if (existingResolver) {
      pendingInputResolverRef.current = null;
      existingResolver(null);
    }
    setPendingInput({
      panelId,
      prompt,
      text: "",
    });
    return new Promise<string | null>((resolve) => {
      pendingInputResolverRef.current = resolve;
    });
  }, []);

  const showAppError = useCallback((message: string) => {
    setAppNotice({
      tone: "error",
      message,
    });
  }, []);

  const dismissNotice = useCallback(() => setAppNotice(null), []);

  const saveWorkspaceNow = useCallback(async () => {
    const current = workspaceRef.current;
    if (!current) {
      showAppError("Open or create a workspace before saving.");
      return false;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    firstUnsavedChangeAtRef.current = null;

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    setHasPendingSave(true);
    return await persistWorkspace(current, requestId, "manual");
  }, [persistWorkspace, showAppError]);

  const applyWorkspaceUpdate = useCallback(
    (updater: (current: WorkspaceState) => WorkspaceState, mode: "immediate" | "debounced") => {
      const current = workspaceRef.current;
      if (!current) {
        return null;
      }

      try {
        const next = updater(current);
        commitWorkspace(next, mode);
        return next;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update the workspace.";
        showAppError(message);
        return null;
      }
    },
    [commitWorkspace, showAppError],
  );

  const activeDocument = useMemo(() => {
    return workspace ? getActiveDocument(workspace) : null;
  }, [workspace]);

  const breadcrumbs = useMemo(() => {
    return workspace && activeDocument ? getNodePath(workspace, activeDocument.id) : [];
  }, [workspace, activeDocument]);

  const activeDocumentId = activeDocument?.id ?? null;
  const activeDocumentName = activeDocument?.name ?? "";
  const terminalPanelIds = useMemo(() => {
    if (!workspace) {
      return [];
    }
    return Object.entries(workspace.panelInstances)
      .filter(([, panel]) => panel.kind === "terminal")
      .map(([panelId]) => panelId)
      .sort();
  }, [workspace]);

  useEffect(() => {
    if (!activeDocumentId) {
      return;
    }
    let cancelled = false;
    resolvePendingInput(null);
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setCompileDiagnostics([]);
    });
    return () => {
      cancelled = true;
    };
  }, [activeDocumentId, resolvePendingInput]);

  useEffect(() => {
    if (!workspace || !activeDocumentName) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setTerminalOutputs((current) => {
        const next: Record<string, string> = {};
        for (const panelId of terminalPanelIds) {
          next[panelId] = current[panelId] ?? `Terminal ready for ${activeDocumentName}.`;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeDocumentName, terminalPanelIds, workspace]);

  const updateTerminalOutput = useCallback((panelId: string, text: string) => {
    setTerminalOutputs((current) => ({
      ...current,
      [panelId]: text,
    }));
  }, []);

  const updateWorkspaceCompileSummary = useCallback(
    (documentId: string, diagnostics: Diagnostic[]) => {
      applyWorkspaceUpdate(
        (current) => setDocumentCompileSummary(current, documentId, summarizeDiagnostics(diagnostics)),
        "immediate",
      );
    },
    [applyWorkspaceUpdate],
  );

  /** True while the active document still has the source and syntax a compile was started with. */
  const isStillActiveSnapshot = useCallback((documentId: string, source: string, syntaxId: string) => {
    const latestWorkspace = workspaceRef.current;
    const latestDocument = latestWorkspace ? getActiveDocument(latestWorkspace) : null;
    return (
      !!latestWorkspace &&
      latestDocument?.id === documentId &&
      latestDocument.source === source &&
      (latestWorkspace.syntaxId ?? "cambridge-igcse") === syntaxId
    );
  }, []);

  const liveDiagnosticsTimerRef = useRef<number | null>(null);

  /** Checks the active document in the background shortly after typing stops, like an IDE's live diagnostics. */
  const scheduleLiveDiagnostics = useCallback((delayMs = LIVE_DIAGNOSTICS_DELAY_MS) => {
    if (typeof window === "undefined") {
      return;
    }
    if (liveDiagnosticsTimerRef.current !== null) {
      window.clearTimeout(liveDiagnosticsTimerRef.current);
    }
    liveDiagnosticsTimerRef.current = window.setTimeout(() => {
      liveDiagnosticsTimerRef.current = null;
      const currentWorkspace = workspaceRef.current;
      const document = currentWorkspace ? getActiveDocument(currentWorkspace) : null;
      if (!currentWorkspace || !document) {
        return;
      }
      const syntaxId = currentWorkspace.syntaxId ?? "cambridge-igcse";
      void compilePseudocodeInWorker(
        { source: document.source, filename: document.name, strict: true, syntaxId },
        getCompileCacheKey(document.id, document.name, document.source, syntaxId),
        { background: true },
      ).then((run) => {
        const diagnostics = run?.result?.diagnostics;
        const latestWorkspace = workspaceRef.current;
        const latestDocument = latestWorkspace ? getActiveDocument(latestWorkspace) : null;
        if (
          !latestWorkspace ||
          latestDocument?.id !== document.id ||
          latestDocument.source !== document.source ||
          (latestWorkspace.syntaxId ?? "cambridge-igcse") !== syntaxId ||
          !diagnostics
        ) {
          return;
        }
        setCompileDiagnostics(diagnostics);
      }, () => {
        // A failed background check leaves the current markers; Run still reports compiler failures.
      });
    }, delayMs);
  }, []);

  useEffect(
    () => () => {
      if (liveDiagnosticsTimerRef.current !== null) {
        window.clearTimeout(liveDiagnosticsTimerRef.current);
      }
    },
    [],
  );

  const workspaceSyntaxId = workspace?.syntaxId;
  useEffect(() => {
    if (!activeDocumentId) {
      return;
    }
    scheduleLiveDiagnostics(0);
  }, [activeDocumentId, workspaceSyntaxId, scheduleLiveDiagnostics]);

  const compileSource = useCallback(async (workspaceState?: WorkspaceState) => {
    const currentWorkspace = workspaceState ?? workspaceRef.current;
    if (!currentWorkspace) {
      return null;
    }

    const document = getActiveDocument(currentWorkspace);
    if (!document) {
      return null;
    }
    const syntaxId = currentWorkspace.syntaxId ?? "cambridge-igcse";
    const cacheKey = getCompileCacheKey(document.id, document.name, document.source, syntaxId);
    const compileRun = await compilePseudocodeInWorker(
      {
        source: document.source,
        filename: document.name,
        strict: true,
        syntaxId,
      },
      cacheKey,
    );

    return {
      document,
      result: compileRun.result,
      stale: compileRun.stale,
      cached: compileRun.cached,
    };
  }, []);

  const ensureTerminalTarget = useCallback(() => {
    let targetPanelId: string | null = null;
    const nextWorkspace = applyWorkspaceUpdate((current) => {
      const ensured = ensureTerminalPanel(current);
      targetPanelId = ensured.panelId;
      return ensured.state;
    }, "immediate");

    if (!nextWorkspace || !targetPanelId) {
      return null;
    }

    return {
      workspace: nextWorkspace,
      panelId: targetPanelId,
    };
  }, [applyWorkspaceUpdate]);

  const compileNow = useCallback(async () => {
    const target = ensureTerminalTarget();
    if (!target) {
      return null;
    }

    const payload = await compileSource(target.workspace);
    if (!payload) {
      updateTerminalOutput(target.panelId, "Create your first file to compile and run code.");
      return null;
    }

    if (payload.stale) {
      return null;
    }

    const { document, result } = payload;
    if (isStillActiveSnapshot(document.id, document.source, target.workspace.syntaxId ?? "cambridge-igcse")) {
      setCompileDiagnostics(result.diagnostics);
    }
    updateWorkspaceCompileSummary(document.id, result.diagnostics);

    updateTerminalOutput(
      target.panelId,
      result.success
        ? result.diagnostics.length > 0
          ? `Compile succeeded with notes for ${document.name}.\n\n${formatDiagnostics(result.diagnostics)}`
          : `Compile succeeded for ${document.name}.`
        : `Compile failed for ${document.name}.\n\n${formatDiagnostics(result.diagnostics)}`,
    );

    return {
      panelId: target.panelId,
      document,
      result,
    };
  }, [compileSource, ensureTerminalTarget, isStillActiveSnapshot, updateTerminalOutput, updateWorkspaceCompileSummary]);

  const runNow = useCallback(async () => {
    const target = ensureTerminalTarget();
    if (!target) {
      return;
    }

    const payload = await compileSource(target.workspace);
    if (!payload) {
      updateTerminalOutput(target.panelId, "Create your first file to compile and run code.");
      return;
    }

    if (payload.stale) {
      return;
    }

    const { document, result: compileResult } = payload;
    // The student may have switched files or kept typing while this compiled; never show stale markers.
    if (isStillActiveSnapshot(document.id, document.source, target.workspace.syntaxId ?? "cambridge-igcse")) {
      setCompileDiagnostics(compileResult.diagnostics);
    }
    updateWorkspaceCompileSummary(document.id, compileResult.diagnostics);

    setLastRunError(null);
    if (!compileResult.success || !compileResult.astJson) {
      track("program_run", { outcome: "compile_error", diagnostics: compileResult.diagnostics.length, inputs: 0 });
      const errorCount = compileResult.diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
      updateTerminalOutput(
        target.panelId,
        `Couldn't run ${document.name}: fix the ${errorCount} problem${errorCount === 1 ? "" : "s"} in Problems first.`,
      );
      return "compile_error" as const;
    }

    const astJson = compileResult.astJson;
    setLastRunTrace(null);
    setIsRunning(true);
    setRunningTerminalPanelId(target.panelId);
    updateTerminalOutput(target.panelId, "");

    const stdinLines: string[] = [];
    const transcript: string[] = [];
    let renderedStdout = "";
    let latestVirtualFiles = target.workspace.virtualFiles;

    const syncStdoutToTranscript = (stdout: string) => {
      const normalizedStdout = stdout.replace(/\r\n/g, "\n");
      if (normalizedStdout === renderedStdout) {
        return;
      }

      let delta = normalizedStdout;
      if (normalizedStdout.startsWith(renderedStdout)) {
        delta = normalizedStdout.slice(renderedStdout.length);
      }

      if (delta.startsWith("\n")) {
        delta = delta.slice(1);
      }

      if (delta.length > 0) {
        transcript.push(...delta.split("\n"));
        updateTerminalOutput(target.panelId, transcript.join("\n"));
      }

      renderedStdout = normalizedStdout;
    };

    try {
      let runResult = await pseudocodeRuntimeRunner.run({
        astJson,
        stdinLines: [...stdinLines],
        virtualFiles: latestVirtualFiles,
        trace: true,
      });

      while (isInputRequestRuntimeError(runResult.stderr)) {
        syncStdoutToTranscript(runResult.stdout);

        if (stdinLines.length >= MAX_INTERACTIVE_INPUTS) {
          track("program_run", { outcome: "input_limit", diagnostics: 0, inputs: stdinLines.length });
          updateTerminalOutput(
            target.panelId,
            [...transcript, `Stopped after ${MAX_INTERACTIVE_INPUTS} INPUT requests to avoid an infinite input loop.`].join(
              "\n",
            ),
          );
          return;
        }

        const nextInput = await waitForTerminalInput(target.panelId, TERMINAL_PROMPT);
        if (nextInput === null) {
          track("program_run", { outcome: "cancelled", diagnostics: 0, inputs: stdinLines.length });
          updateTerminalOutput(target.panelId, [...transcript, "Run cancelled."].join("\n"));
          return;
        }

        stdinLines.push(nextInput);
        transcript.push(`${TERMINAL_PROMPT} ${nextInput}`);
        updateTerminalOutput(target.panelId, transcript.join("\n"));

        runResult = await pseudocodeRuntimeRunner.run({
          astJson,
          stdinLines: [...stdinLines],
          virtualFiles: latestVirtualFiles,
          trace: true,
        });
      }

      syncStdoutToTranscript(runResult.stdout);
      latestVirtualFiles = runResult.virtualFiles;
      if (runResult.trace) {
        const stdout = runResult.stdout.replace(/\r\n/g, "\n");
        runTraceIdRef.current += 1;
        setLastRunTrace({
          id: runTraceIdRef.current,
          documentId: document.id,
          source: document.source,
          steps: runResult.trace,
          truncated: Boolean(runResult.traceTruncated),
          output: stdout.length > 0 ? stdout.split("\n") : [],
          completed: runResult.success && runResult.stderr.trim().length === 0,
          errorLine: runResult.success ? undefined : runResult.diagnostics[0]?.line,
        });
      }
      const failed = runResult.stderr.trim().length > 0 || runResult.diagnostics.length > 0;
      track("program_run", {
        outcome: failed ? "runtime_error" : "success",
        diagnostics: runResult.diagnostics.length,
        inputs: stdinLines.length,
      });

      const reportedError = runResult.diagnostics.find((diagnostic) => diagnostic.severity === "error");
      // The runtime attaches the same generic hint to every error; it adds nothing, so only keep specific hints.
      const runtimeError =
        reportedError && reportedError.hint === GENERIC_RUNTIME_HINT ? { ...reportedError, hint: undefined } : reportedError;
      if (runtimeError) {
        // Output shows this as a linked error row; Problems and the editor mark the line until the next edit.
        setLastRunError({
          ...runtimeError,
          documentId: document.id,
          source: document.source,
          syntaxId: target.workspace.syntaxId ?? "cambridge-igcse",
        });
      } else if (runResult.stderr.trim().length > 0) {
        transcript.push(...runResult.stderr.trim().split("\n"));
      } else if (runResult.diagnostics.length > 0) {
        transcript.push(...formatDiagnostics(runResult.diagnostics).split("\n"));
      }

      if (transcript.length === 0 && !runtimeError) {
        transcript.push("Program finished with no output.");
      }

      updateTerminalOutput(target.panelId, transcript.join("\n"));
      applyWorkspaceUpdate((current) => updateVirtualFiles(current, latestVirtualFiles), "immediate");
      return runtimeError ? ("runtime_error" as const) : ("success" as const);
    } finally {
      resolvePendingInput(null);
      setIsRunning(false);
      setRunningTerminalPanelId(null);
    }
  }, [
    applyWorkspaceUpdate,
    compileSource,
    ensureTerminalTarget,
    isStillActiveSnapshot,
    resolvePendingInput,
    updateTerminalOutput,
    updateWorkspaceCompileSummary,
    waitForTerminalInput,
  ]);

  const preloadRunRuntime = useCallback(() => {
    preloadPseudocodeCompiler();
    if (typeof pseudocodeRuntimeRunner.preload === "function") {
      void pseudocodeRuntimeRunner.preload().catch(() => {
        /* Runtime errors are shown when the user runs code. */
      });
    }
  }, []);

  const selectDocument = useCallback(
    (documentId: string) => {
      applyWorkspaceUpdate((current) => openDocumentInFocusedEditor(current, documentId), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const setSyntaxId = useCallback(
    (syntaxId: WorkspaceSyntaxId) => {
      applyWorkspaceUpdate((current) => setWorkspaceSyntax(current, syntaxId), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const handleDocumentSourceChange = useCallback(
    (documentId: string, source: string) => {
      // Keep the current markers (Monaco moves them with the text) until the live check replaces them.
      applyWorkspaceUpdate((current) => updateDocumentSource(current, documentId, source), "debounced");
      scheduleLiveDiagnostics();
    },
    [applyWorkspaceUpdate, scheduleLiveDiagnostics],
  );

  const toggleFolder = useCallback(
    (folderId: string) => {
      applyWorkspaceUpdate((current) => {
        const expanded = new Set(current.expandedFolderIds ?? []);
        if (expanded.has(folderId)) {
          expanded.delete(folderId);
        } else {
          expanded.add(folderId);
        }
        expanded.add(current.rootFolderId);
        return setExpandedFolders(current, Array.from(expanded));
      }, "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const expandFolder = useCallback(
    (folderId: string) => {
      applyWorkspaceUpdate((current) => {
        const expanded = new Set(current.expandedFolderIds ?? []);
        if (expanded.has(folderId)) {
          return current;
        }
        expanded.add(current.rootFolderId);
        expanded.add(folderId);
        return setExpandedFolders(current, Array.from(expanded));
      }, "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const createFolderInWorkspace = useCallback(
    (parentId?: string) => {
      applyWorkspaceUpdate(
        (current) =>
          createFolder(current, {
            parentId: parentId && workspaceHasFolder(current, parentId) ? parentId : current.rootFolderId,
          }),
        "immediate",
      );
    },
    [applyWorkspaceUpdate],
  );

  const createDocumentInWorkspace = useCallback(
    (
      parentId?: string,
      options?: {
        name?: string;
        source?: string;
      },
    ) => {
      let createdDocumentId: string | null = null;
      const nextWorkspace = applyWorkspaceUpdate(
        (current) => {
          const next = createDocument(current, {
            parentId: parentId && workspaceHasFolder(current, parentId) ? parentId : current.rootFolderId,
            name: options?.name,
            source: options?.source ?? "",
          });
          createdDocumentId = next.activeDocumentId;
          return next;
        },
        "immediate",
      );
      return createdDocumentId ? nextWorkspace?.nodes[createdDocumentId] ?? null : null;
    },
    [applyWorkspaceUpdate],
  );

  const renameNodeInWorkspace = useCallback(
    (nodeId: string, name: string) => {
      return !!applyWorkspaceUpdate((current) => renameNode(current, nodeId, name), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const deleteNodesInWorkspace = useCallback(
    (nodeIds: string[]) => {
      return !!applyWorkspaceUpdate((current) => deleteNodes(current, nodeIds), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const moveNodesInWorkspace = useCallback(
    (nodeIds: string[], targetFolderId: string, targetIndex: number) => {
      return !!applyWorkspaceUpdate((current) => moveNodes(current, nodeIds, targetFolderId, targetIndex), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const focusWorkspacePanel = useCallback(
    (panelId: string) => {
      applyWorkspaceUpdate((current) => focusPanel(current, panelId), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const createWorkspacePanel = useCallback(
    (kind: WorkspacePanelKind) => {
      applyWorkspaceUpdate((current) => createPanel(current, kind).state, "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const dockWorkspacePanel = useCallback(
    (panelId: string, targetStackId: string, position: WorkspaceDockPosition, targetIndex?: number) => {
      applyWorkspaceUpdate(
        (current) => dockPanel(current, panelId, targetStackId, position, targetIndex),
        "immediate",
      );
    },
    [applyWorkspaceUpdate],
  );

  const closeWorkspacePanel = useCallback(
    (panelId: string) => {
      if (runningTerminalPanelId === panelId) {
        showAppError("A terminal panel cannot be closed while a run is still active.");
        return;
      }
      applyWorkspaceUpdate((current) => closePanel(current, panelId), "immediate");
    },
    [applyWorkspaceUpdate, runningTerminalPanelId, showAppError],
  );

  const resizeWorkspaceSplit = useCallback(
    (splitId: string, sizes: number[]) => {
      applyWorkspaceUpdate((current) => resizeSplit(current, splitId, sizes), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const resetDockLayout = useCallback(() => {
    applyWorkspaceUpdate((current) => resetWorkspaceLayout(current), "immediate");
  }, [applyWorkspaceUpdate]);

  const splitEditor = useCallback(
    (panelId: string, direction: "right" | "bottom") => {
      applyWorkspaceUpdate((current) => splitEditorPanel(current, panelId, direction).state, "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const setEditorActiveDocument = useCallback(
    (panelId: string, documentId: string) => {
      applyWorkspaceUpdate((current) => setEditorPanelActiveDocument(current, panelId, documentId), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const moveEditorDocumentTab = useCallback(
    (fromPanelId: string, toPanelId: string, documentId: string, targetIndex?: number) => {
      applyWorkspaceUpdate(
        (current) => moveEditorTab(current, fromPanelId, toPanelId, documentId, targetIndex),
        "immediate",
      );
    },
    [applyWorkspaceUpdate],
  );

  const closeEditorDocumentTab = useCallback(
    (panelId: string, documentId: string) => {
      applyWorkspaceUpdate((current) => closeEditorTab(current, panelId, documentId), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const updateFilesPanelSelection = useCallback(
    (panelId: string, fileName: string | undefined) => {
      applyWorkspaceUpdate((current) => setFilesPanelSelection(current, panelId, fileName), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const updateWorkspaceVirtualFiles = useCallback(
    (virtualFiles: Record<string, string[]>) => {
      applyWorkspaceUpdate((current) => updateVirtualFiles(current, virtualFiles), "immediate");
    },
    [applyWorkspaceUpdate],
  );

  const clearTerminal = useCallback(
    (panelId?: string) => {
      setLastRunError(null);
      const current = workspaceRef.current;
      if (!current || !activeDocument) {
        return;
      }

      const resolvedPanelId =
        panelId ??
        current.lastFocusedTerminalPanelId ??
        Object.entries(current.panelInstances).find(([, panel]) => panel.kind === "terminal")?.[0] ??
        null;

      if (!resolvedPanelId) {
        return;
      }

      resolvePendingInput(null);
      updateTerminalOutput(
        resolvedPanelId,
        activeDocument ? `Terminal ready for ${activeDocument.name}.` : "Create your first file to run code.",
      );
    },
    [activeDocument, resolvePendingInput, updateTerminalOutput],
  );

  const submitPendingInput = useCallback(() => {
    resolvePendingInput(pendingInput.text);
  }, [pendingInput.text, resolvePendingInput]);

  const setPendingInputText = useCallback((value: string) => {
    setPendingInput((current) => ({
      ...current,
      text: value,
    }));
  }, []);

  // A runtime error stays marked for as long as the file still has the source it ran with, even across file switches.
  const visibleDiagnostics = useMemo(() => {
    if (
      !lastRunError ||
      !activeDocument ||
      lastRunError.documentId !== activeDocument.id ||
      lastRunError.source !== activeDocument.source ||
      lastRunError.syntaxId !== (workspace?.syntaxId ?? "cambridge-igcse")
    ) {
      return compileDiagnostics;
    }
    const runtimeDiagnostic: Diagnostic = {
      code: lastRunError.code,
      message: lastRunError.message,
      severity: lastRunError.severity,
      line: lastRunError.line,
      column: lastRunError.column,
      endLine: lastRunError.endLine,
      endColumn: lastRunError.endColumn,
      ...(lastRunError.hint ? { hint: lastRunError.hint } : {}),
    };
    return [...compileDiagnostics, runtimeDiagnostic];
  }, [activeDocument, compileDiagnostics, lastRunError, workspace?.syntaxId]);

  return {
    workspace,
    activeDocument,
    breadcrumbs,
    compileDiagnostics: visibleDiagnostics,
    terminalOutputs,
    pendingInput,
    isRunning,
    lastRunTrace,
    lastRunError,
    runningTerminalPanelId,
    saveError,
    hasPendingSave,
    isSaving,
    lastSavedAt,
    unsyncedEditsSafeOnDevice,
    syncNotice,
    dismissSyncNotice: () => setSyncNotice(null),
    appNotice,
    dismissNotice,
    setPendingInputText,
    submitPendingInput,
    cancelPendingInput: () => resolvePendingInput(null),
    compileNow,
    runNow,
    preloadRunRuntime,
    saveWorkspaceNow,
    clearTerminal,
    syntaxId: workspace?.syntaxId ?? "cambridge-igcse",
    setSyntaxId,
    selectDocument,
    handleDocumentSourceChange,
    toggleFolder,
    expandFolder,
    createFolderInWorkspace,
    createDocumentInWorkspace,
    renameNodeInWorkspace,
    deleteNodesInWorkspace,
    moveNodesInWorkspace,
    focusWorkspacePanel,
    createWorkspacePanel,
    dockWorkspacePanel,
    closeWorkspacePanel,
    resizeWorkspaceSplit,
    resetDockLayout,
    splitEditor,
    setEditorActiveDocument,
    moveEditorDocumentTab,
    closeEditorDocumentTab,
    updateFilesPanelSelection,
    updateWorkspaceVirtualFiles,
  };
}
