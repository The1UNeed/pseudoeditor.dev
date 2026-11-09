"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BrandMark } from "@/app/components/BrandMark";
import {
  DragEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  type ReactNode,
  UIEvent as ReactUIEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronUp,
  CircleAlert,
  Code,
  CloudOff,
  FileCode,
  FilePlus,
  Folder,
  Workflow,
  LoaderCircle,
  LogIn,
  PanelBottom,
  PanelLeft,
  Palette,
  Play,
  Save,
  Settings,
  Shuffle,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import {
  getNodePath,
  type WorkspaceEditorPanelInstance,
} from "@pseudoeditor/workspace";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { Dialog } from "@/app/components/Dialog";
import { EditorLoader } from "@/app/components/EditorLoader";
import { PracticeQuestionBanner } from "@/app/components/PracticeQuestionBanner";
import { SettingsSelect } from "@/app/components/SettingsSelect";
import { SyntaxColorSchemePicker } from "@/app/components/SyntaxColorSchemePicker";
import { WorkspaceSidebar } from "@/app/components/WorkspaceSidebar";
import { ProblemsList, countProblems } from "@/app/components/ProblemsList";
import { StatusBar, type SaveIndicatorState } from "@/app/components/StatusBar";
import type { PseudocodeEditorApi } from "@/app/components/MonacoPseudocodeEditor";
import { disposeWorkspaceModels } from "@/lib/editorModels";
import {
  SHORTCUTS,
  formatShortcut,
  isApplePlatform,
  matchesShortcut,
  withShortcut,
  type WorkspaceCommand,
} from "@/lib/shortcuts";
import { usePracticeQuestion } from "@/app/hooks/usePracticeQuestion";
import { useWorkspaceSession } from "@/app/hooks/useWorkspaceSession";
import {
  Show,
  SignInButton,
  UserButton,
  isCloudAuthConfigured,
  mayHaveClerkSession,
  useAuth,
  useAuthUnavailable,
} from "@/lib/auth-components";
import { track } from "@/lib/analytics";
import { afterNextPaint } from "@/lib/afterNextPaint";
import { getTouchLayout } from "@/lib/appleTouch";
import type { Diagnostic } from "@/compiler/types";
import { useDictionary, useLocale } from "@/i18n/context";
import { localePath } from "@/i18n/config";
import { LocaleSwitcher } from "@/i18n/LocaleSwitcher";
import {
  getClientAppPlatform,
  getWorkspacePersistenceMode,
  platformUsesCloudSaving,
} from "@/lib/platform";
import {
  applyResolvedTheme,
  getSystemTheme,
  loadThemeMode,
  resolveTheme,
  saveThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import { SYNTAX_OPTIONS, resolveSyntax } from "@/lib/pseudocodeLanguages";
import {
  loadSyntaxColorScheme,
  saveSyntaxColorScheme,
  type SyntaxColorSchemeId,
} from "@/lib/syntaxColorSchemes";
import type { WorkspaceSyntaxId } from "@pseudoeditor/workspace";

/* ── constants ── */
const DEFAULT_SOURCE = `DECLARE Number : INTEGER
DECLARE Total : INTEGER

FOR Number <- 1 TO 5
    Total <- Total + Number
NEXT Number

OUTPUT "Total = ", Total`;

const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_TERMINAL_HEIGHT = 160;
const MIN_TERMINAL_HEIGHT = 96;
const MAX_TERMINAL_HEIGHT = 460;
const SIDEBAR_WIDTH_STORAGE_KEY = "pseudocode-compiler-sidebar-width";
const TERMINAL_HEIGHT_STORAGE_KEY = "pseudocode-compiler-terminal-height";
const AUTO_SAVE_INTERVAL_STORAGE_KEY = "pseudocode-compiler-autosave-minutes";
const EXPLORER_VISIBLE_STORAGE_KEY = "pseudocode-compiler-explorer-visible";
const PANEL_VISIBLE_STORAGE_KEY = "pseudocode-compiler-panel-visible";
const DEFAULT_AUTO_SAVE_INTERVAL_MINUTES = 5;
const MIN_AUTO_SAVE_INTERVAL_MINUTES = 1;
const MAX_AUTO_SAVE_INTERVAL_MINUTES = 60;
const MANUAL_SAVE_STATUS_TIMEOUT_MS = 2200;
const PSEUDO_EXTENSION = ".pseudo";
// Shared so editors without compile results don't get a new array (and reset markers) every render.
const EMPTY_DIAGNOSTICS: Diagnostic[] = [];

type TouchTab = "editor" | "files" | "output" | "settings";
type PanelView = "output" | "problems";

function loadStoredFlag(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

function saveStoredFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* storage can be blocked; the layout still works for this session */
  }
}
type ManualSaveStatus = "idle" | "saving" | "saved" | "error";

function EditorLoadingFallback() {
  return <EditorLoader label={useDictionary().editor.loading.editor} />;
}

function FlowchartLoadingFallback() {
  return <EditorLoader label={useDictionary().editor.loading.flowchart} />;
}

function DocsLoadingFallback() {
  return <EditorLoader label={useDictionary().editor.docs.title} />;
}

const MonacoPseudocodeEditor = dynamic(
  () =>
    import("@/app/components/MonacoPseudocodeEditor").then(
      (module) => module.MonacoPseudocodeEditor,
    ),
  {
    ssr: false,
    loading: () => <EditorLoadingFallback />,
  },
);

const DocsPanel = dynamic(
  () => import("@/app/components/docs/DocsPanel"),
  { loading: () => <DocsLoadingFallback /> },
);

const loadFlowchartEditor = () => import("@/app/components/flowchart/FlowchartEditor");

const FlowchartEditor = memo(
  dynamic(loadFlowchartEditor, {
    ssr: false,
    loading: () => <FlowchartLoadingFallback />,
  }),
);

function preloadFlowchartEditor() {
  void loadFlowchartEditor();
}

/* ── dialog state types ── */

interface RenameDialogState {
  nodeId: string;
  currentName: string;
  isDocument: boolean;
}

interface DeleteDialogState {
  nodeIds: string[];
  message: string;
}

function getDocumentEditableName(name: string): string {
  return name.endsWith(PSEUDO_EXTENSION) ? name.slice(0, -PSEUDO_EXTENSION.length) : name;
}

function normalizeDocumentEditableName(name: string): string {
  return getDocumentEditableName(name.trim());
}

/** The focusable explorer button for a workspace node, if it is still rendered. */
function findExplorerItem(nodeId: string | undefined): HTMLElement | null {
  if (!nodeId) return null;
  // The tree owns keyboard focus (rows are its active descendants), so focus returns to the tree itself.
  const row = document.querySelector<HTMLElement>(`[data-workspace-row-id="${CSS.escape(nodeId)}"]`);
  return row?.closest<HTMLElement>('[role="tree"]') ?? null;
}

function getSubmittedRenameValue(renameDialog: RenameDialogState, value: string): string {
  const trimmed = value.trim();
  return renameDialog.isDocument ? `${normalizeDocumentEditableName(trimmed)}${PSEUDO_EXTENSION}` : trimmed;
}

function clampAutoSaveIntervalMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_AUTO_SAVE_INTERVAL_MINUTES;
  }

  return Math.min(
    MAX_AUTO_SAVE_INTERVAL_MINUTES,
    Math.max(MIN_AUTO_SAVE_INTERVAL_MINUTES, Math.round(value)),
  );
}

function loadAutoSaveIntervalMinutes(): number {
  if (typeof window === "undefined") {
    return DEFAULT_AUTO_SAVE_INTERVAL_MINUTES;
  }

  const stored = window.localStorage.getItem(AUTO_SAVE_INTERVAL_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_AUTO_SAVE_INTERVAL_MINUTES;
  }

  return clampAutoSaveIntervalMinutes(Number(stored));
}

function saveAutoSaveIntervalMinutes(value: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTO_SAVE_INTERVAL_STORAGE_KEY, String(value));
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function loadStoredNumber(key: string, fallback: number, min: number, max: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  return clampNumber(Number(stored), min, max);
}

function saveStoredNumber(key: string, value: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, String(Math.round(value)));
}

function getMaxTerminalHeight(viewportHeight: number): number {
  return Math.max(MIN_TERMINAL_HEIGHT, Math.min(MAX_TERMINAL_HEIGHT, viewportHeight - 220));
}

/* ── component ── */

export default function HomePage() {
  const locale = useLocale();
  const t = useDictionary().editor;
  const themeOptions: Array<{ value: ThemeMode; label: string; description: string }> = [
    { value: "system", label: t.settings.system, description: t.settings.systemDescription },
    { value: "dark", label: t.settings.dark, description: t.settings.darkDescription },
    { value: "light", label: t.settings.light, description: t.settings.lightDescription },
  ];
  const appLegalLinks = [
    { href: localePath(locale, "/terms"), label: t.legal.userAgreement },
    { href: localePath(locale, "/privacy"), label: t.legal.privacy },
    { href: localePath(locale, "/security"), label: t.legal.security },
    { href: "https://github.com/The1UNeed/pseudoeditor.dev", label: t.legal.github },
  ];
  const { getToken, isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const [appPlatform] = useState(() => getClientAppPlatform());
  const cloudSavingRequired = platformUsesCloudSaving(appPlatform);
  // Signed-out visitors (no Clerk session cookie) get the in-memory workspace straight away instead
  // of waiting for Clerk's scripts and API calls. If Clerk then reports a session anyway, the
  // persistence mode changes and the workspace reloads from the cloud.
  const [awaitClerkSession] = useState(() => mayHaveClerkSession());
  // If Clerk's script never loads (blocked or offline) it never reports isLoaded: stop waiting and open the
  // in-memory workspace, with a notice, instead of leaving a signed-in student on an empty editor.
  const authUnavailable = useAuthUnavailable() && !authLoaded;
  // Guests lose nothing when Clerk is blocked, so only someone who has signed in here before gets the notice.
  const showAuthUnavailableNotice = authUnavailable && awaitClerkSession;
  const authLoading = !authLoaded && awaitClerkSession && !authUnavailable;
  const workspacePersistenceMode = getWorkspacePersistenceMode({
    platform: appPlatform,
    signedIn: Boolean(isSignedIn),
  });
  const getCloudAuthToken = useCallback(async () => {
    if (typeof getToken !== "function") {
      return null;
    }

    return await getToken({ template: "convex", skipCache: true });
  }, [getToken]);
  const workspaceAuthTokenProvider =
    workspacePersistenceMode === "cloud" ? getCloudAuthToken : undefined;
  const canSaveWorkspace = workspacePersistenceMode !== "memory";
  const isDesktopShell = appPlatform === "desktop";
  const [autoSaveIntervalMinutes, setAutoSaveIntervalMinutes] = useState(
    () => loadAutoSaveIntervalMinutes(),
  );

  const {
    workspace,
    activeDocument,
    compileDiagnostics,
    terminalOutputs,
    pendingInput,
    isRunning,
    lastRunTrace,
    lastRunError,
    runningTerminalPanelId,
    saveError,
    hasPendingSave,
    unsyncedEditsSafeOnDevice,
    syncNotice,
    dismissSyncNotice,
    isSaving,
    appNotice,
    dismissNotice,
    setPendingInputText,
    submitPendingInput,
    cancelPendingInput,
    runNow,
    preloadRunRuntime,
    saveWorkspaceNow,
    clearTerminal,
    selectDocument,
    handleDocumentSourceChange,
    toggleFolder,
    expandFolder,
    createFolderInWorkspace,
    syntaxId,
    setSyntaxId,
    createDocumentInWorkspace,
    renameNodeInWorkspace,
    deleteNodesInWorkspace,
    moveNodesInWorkspace,
    setEditorActiveDocument,
    moveEditorDocumentTab,
    closeEditorDocumentTab,
  } = useWorkspaceSession(DEFAULT_SOURCE, {
    autoSaveDelayMs: autoSaveIntervalMinutes * 60 * 1000,
    getCloudAuthToken: workspaceAuthTokenProvider,
    persistenceMode: workspacePersistenceMode,
    cloudSyncLoading: cloudSavingRequired ? authLoading : false,
    checkpointOwner: userId ?? null,
    recoveredFolderName: t.sync.recoveredFolder,
  });

  /* ── local state ── */

  const [renameDialog, setRenameDialog] = useState<RenameDialogState | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    loadStoredNumber(
      SIDEBAR_WIDTH_STORAGE_KEY,
      DEFAULT_SIDEBAR_WIDTH,
      MIN_SIDEBAR_WIDTH,
      MAX_SIDEBAR_WIDTH,
    ),
  );
  const [terminalHeight, setTerminalHeight] = useState(() =>
    loadStoredNumber(
      TERMINAL_HEIGHT_STORAGE_KEY,
      DEFAULT_TERMINAL_HEIGHT,
      MIN_TERMINAL_HEIGHT,
      MAX_TERMINAL_HEIGHT,
    ),
  );
  const [showTerminal, setShowTerminalState] = useState(() => loadStoredFlag(PANEL_VISIBLE_STORAGE_KEY, true));
  const setShowTerminal = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    setShowTerminalState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      saveStoredFlag(PANEL_VISIBLE_STORAGE_KEY, value);
      return value;
    });
  }, []);
  const [showExplorer, setShowExplorerState] = useState(() => loadStoredFlag(EXPLORER_VISIBLE_STORAGE_KEY, true));
  const setShowExplorer = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    setShowExplorerState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      saveStoredFlag(EXPLORER_VISIBLE_STORAGE_KEY, value);
      return value;
    });
  }, []);
  const [panelView, setPanelView] = useState<PanelView>("output");
  const [touchOutputView, setTouchOutputView] = useState<PanelView>("output");
  const editorApiRef = useRef<PseudocodeEditorApi | null>(null);
  const [apple] = useState(() => isApplePlatform());
  const [touchTab, setTouchTab] = useState<TouchTab>("editor");
  const [touchSidebarVisible, setTouchSidebarVisible] = useState(true);
  const [touchOutputVisible, setTouchOutputVisible] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showDocsPanel, setShowDocsPanel] = useState(false);
  // Kept outside the panel so reopening it returns to the last guide.
  const [docsSlug, setDocsSlug] = useState("syntax");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  // The flowchart editor loads React Flow, so it mounts the first time it opens and then stays mounted.
  const [flowchartMounted, setFlowchartMounted] = useState(false);
  const [showCreateFileDialog, setShowCreateFileDialog] = useState(false);
  const [createFileName, setCreateFileName] = useState("main");
  const [createFileParentId, setCreateFileParentId] = useState<string | undefined>(undefined);
  const [showFlowchartPrompt, setShowFlowchartPrompt] = useState(false);
  const [flowchartFileName, setFlowchartFileName] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());
  const [syntaxColorScheme, setSyntaxColorScheme] = useState<SyntaxColorSchemeId>(() =>
    loadSyntaxColorScheme(),
  );
  const [manualSaveStatus, setManualSaveStatus] = useState<ManualSaveStatus>("idle");
  const manualSaveStatusTimerRef = useRef<number | null>(null);

  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());

  const clearManualSaveStatusTimer = useCallback(() => {
    if (manualSaveStatusTimerRef.current !== null) {
      window.clearTimeout(manualSaveStatusTimerRef.current);
      manualSaveStatusTimerRef.current = null;
    }
  }, []);

  const showTemporaryManualSaveStatus = useCallback(
    (status: Exclude<ManualSaveStatus, "idle" | "saving">) => {
      clearManualSaveStatusTimer();
      setManualSaveStatus(status);
      manualSaveStatusTimerRef.current = window.setTimeout(() => {
        setManualSaveStatus("idle");
        manualSaveStatusTimerRef.current = null;
      }, MANUAL_SAVE_STATUS_TIMEOUT_MS);
    },
    [clearManualSaveStatusTimer],
  );

  useEffect(() => {
    return () => clearManualSaveStatusTimer();
  }, [clearManualSaveStatusTimer]);

  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
  }));
  const [coarsePointer, setCoarsePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
  const maxTerminalHeight = getMaxTerminalHeight(viewportSize.height);

  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopTerminalScrollRef = useRef<HTMLDivElement | null>(null);
  const touchOutputScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollOutputRef = useRef(true);
  const sidebarWidthRef = useRef(sidebarWidth);
  const terminalHeightRef = useRef(terminalHeight);
  const sidebarResizeFrameRef = useRef<number | null>(null);
  const terminalResizeFrameRef = useRef<number | null>(null);
  const pendingSidebarWidthRef = useRef(sidebarWidth);
  const pendingTerminalHeightRef = useRef(terminalHeight);

  /* ── derived workspace data ── */

  const editorPanel = useMemo<WorkspaceEditorPanelInstance | null>(() => {
    if (!workspace) return null;
    const entry = Object.entries(workspace.panelInstances).find(
      ([, p]) => p.kind === "editor",
    );
    return entry ? (entry[1] as WorkspaceEditorPanelInstance) : null;
  }, [workspace]);

  const editorPanelId = editorPanel?.id ?? null;

  const terminalPanelId = useMemo(() => {
    if (!workspace) return null;
    const entry = Object.entries(workspace.panelInstances).find(
      ([, p]) => p.kind === "terminal",
    );
    return entry?.[0] ?? null;
  }, [workspace]);

  const editorActiveDoc = useMemo(() => {
    if (!workspace || !editorPanel?.activeDocumentId) return null;
    const node = workspace.nodes[editorPanel.activeDocumentId];
    return node?.type === "document" ? node : null;
  }, [workspace, editorPanel]);
  const currentDocument = editorActiveDoc ?? activeDocument;
  const currentDocumentId = currentDocument?.id;
  const editorDocumentId = editorActiveDoc?.id;
  const handleCurrentSourceChange = useCallback((value: string) => {
    if (currentDocumentId) handleDocumentSourceChange(currentDocumentId, value);
  }, [currentDocumentId, handleDocumentSourceChange]);
  const handleEditorSourceChange = useCallback((value: string) => {
    if (editorDocumentId) handleDocumentSourceChange(editorDocumentId, value);
  }, [editorDocumentId, handleDocumentSourceChange]);
  const { currentQuestion, openRandomQuestion } = usePracticeQuestion(
    workspace,
    currentDocument?.name,
    createDocumentInWorkspace,
    selectDocument,
  );
  const practiceBanner = currentQuestion ? (
    <PracticeQuestionBanner
      question={currentQuestion}
      onAnother={() => openRandomQuestion(currentQuestion.id)}
    />
  ) : null;

  const titlePath = useMemo(() => {
    if (!workspace || !editorActiveDoc) return [];
    return getNodePath(workspace, editorActiveDoc.id)
      .filter((node) => node.parentId !== null)
      .map((node) => node.name);
  }, [workspace, editorActiveDoc]);

  const breadcrumbs = useMemo(() => {
    if (!workspace || !currentDocument) return [];
    return getNodePath(workspace, currentDocument.id);
  }, [workspace, currentDocument]);

  const terminalOutput = terminalPanelId
    ? (terminalOutputs[terminalPanelId] ?? "")
    : "";
  const resolvedTheme = resolveTheme(themeMode, systemTheme);
  // Warn while the account copy is behind, even when edits are safe in this device's checkpoint: a student who
  // closes the tab and then works on another device would otherwise not see these edits there.
  const shouldWarnBeforeUnload = hasPendingSave || saveError !== null;
  // The hook reports failures in English; show the dictionary's wording (manual Save vs. autosave) instead.
  const localizedSaveError = saveError?.startsWith("Save failed")
    ? t.save.failedKeptManual
    : saveError?.startsWith("Autosave failed")
      ? t.save.failedKeptAuto
      : saveError;
  const flowchartVisible = showFlowchart;
  const currentSource = currentDocument?.source ?? "";
  // The flowchart stays mounted while hidden; only feed it source updates while it is visible.
  const [flowchartSource, setFlowchartSource] = useState(currentSource);
  if (flowchartVisible && flowchartSource !== currentSource) {
    setFlowchartSource(currentSource);
  }
  const currentDocumentRef = useRef(currentDocument);

  /* ── effects ── */

  useEffect(() => {
    currentDocumentRef.current = currentDocument;
  }, [currentDocument]);

  // Run executes the workspace's active document (the last focused panel), so the deferred Run
  // checks that one, not the first panel's.
  useEffect(() => {
    runTargetIdRef.current = activeDocument?.id;
  }, [activeDocument]);

  useEffect(() => {
    if (renameDialog) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renameDialog]);

  useEffect(() => {
    if (showCreateFileDialog) {
      createFileInputRef.current?.focus();
      createFileInputRef.current?.select();
    }
  }, [showCreateFileDialog]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const handlePointerChange = (event: MediaQueryListEvent) => {
      setCoarsePointer(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    pointerQuery.addEventListener("change", handlePointerChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      pointerQuery.removeEventListener("change", handlePointerChange);
    };
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
    saveThemeMode(themeMode);
  }, [resolvedTheme, themeMode]);

  // Set once the user has already agreed to leave (Retry below), so the browser does not ask a second time.
  const leaveConfirmedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !shouldWarnBeforeUnload) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leaveConfirmedRef.current) return;
      event.preventDefault();
      event.returnValue = t.save.leaveWarning;
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarnBeforeUnload, t.save.leaveWarning]);

  const scrollOutputToBottom = useCallback(() => {
    if (!shouldAutoScrollOutputRef.current) {
      return;
    }

    for (const element of [desktopTerminalScrollRef.current, touchOutputScrollRef.current]) {
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, []);

  const handleOutputScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldAutoScrollOutputRef.current = distanceFromBottom <= 24;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollOutputToBottom();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    isRunning,
    pendingInput.panelId,
    pendingInput.prompt,
    runningTerminalPanelId,
    scrollOutputToBottom,
    showTerminal,
    terminalOutput,
    touchOutputVisible,
    touchTab,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
    };
  }, []);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
    pendingSidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    terminalHeightRef.current = terminalHeight;
    pendingTerminalHeightRef.current = terminalHeight;
  }, [terminalHeight]);

  useEffect(() => {
    return () => {
      if (sidebarResizeFrameRef.current !== null) {
        window.cancelAnimationFrame(sidebarResizeFrameRef.current);
      }
      if (terminalResizeFrameRef.current !== null) {
        window.cancelAnimationFrame(terminalResizeFrameRef.current);
      }
    };
  }, []);

  /* ── resize handlers ── */

  const scheduleSidebarWidth = useCallback((nextWidth: number) => {
    pendingSidebarWidthRef.current = clampNumber(nextWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH);
    if (sidebarResizeFrameRef.current !== null) {
      return;
    }

    sidebarResizeFrameRef.current = window.requestAnimationFrame(() => {
      sidebarResizeFrameRef.current = null;
      setSidebarWidth(pendingSidebarWidthRef.current);
    });
  }, []);

  const scheduleTerminalHeight = useCallback(
    (nextHeight: number) => {
      pendingTerminalHeightRef.current = clampNumber(
        nextHeight,
        MIN_TERMINAL_HEIGHT,
        maxTerminalHeight,
      );
      if (terminalResizeFrameRef.current !== null) {
        return;
      }

      terminalResizeFrameRef.current = window.requestAnimationFrame(() => {
        terminalResizeFrameRef.current = null;
        setTerminalHeight(pendingTerminalHeightRef.current);
      });
    },
    [maxTerminalHeight],
  );

  const handleSidebarResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.focus();
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const startX = event.clientX;
      const startW = sidebarWidthRef.current;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const onMove = (e: PointerEvent) => {
        scheduleSidebarWidth(startW + e.clientX - startX);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        const finalWidth = pendingSidebarWidthRef.current;
        setSidebarWidth(finalWidth);
        saveStoredNumber(SIDEBAR_WIDTH_STORAGE_KEY, finalWidth);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scheduleSidebarWidth],
  );

  const handleTerminalResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.focus();
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const startY = event.clientY;
      const startH = terminalHeightRef.current;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";

      const onMove = (e: PointerEvent) => {
        scheduleTerminalHeight(startH + startY - e.clientY);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        const finalHeight = pendingTerminalHeightRef.current;
        setTerminalHeight(finalHeight);
        saveStoredNumber(TERMINAL_HEIGHT_STORAGE_KEY, finalHeight);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scheduleTerminalHeight],
  );

  const handleSidebarResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 16 : -16;
      const nextWidth = clampNumber(sidebarWidthRef.current + delta, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH);
      setSidebarWidth(nextWidth);
      saveStoredNumber(SIDEBAR_WIDTH_STORAGE_KEY, nextWidth);
    },
    [],
  );

  const handleTerminalResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? 16 : -16;
      const nextHeight = clampNumber(
        terminalHeightRef.current + delta,
        MIN_TERMINAL_HEIGHT,
        maxTerminalHeight,
      );
      setTerminalHeight(nextHeight);
      saveStoredNumber(TERMINAL_HEIGHT_STORAGE_KEY, nextHeight);
    },
    [maxTerminalHeight],
  );

  /* ── actions ── */

  // A run re-renders the workspace, terminal and layout (and on a tablet the keyboard closes).
  // Starting it after the next paint lets the tap itself paint at once.
  const cancelScheduledRunRef = useRef<(() => void) | null>(null);
  const runTargetIdRef = useRef<string | undefined>(undefined);
  useEffect(() => () => cancelScheduledRunRef.current?.(), []);
  const handleRun = useCallback(() => {
    if (cancelScheduledRunRef.current) {
      return;
    }
    // The run is for the file that was active when Run was pressed.
    const requestedId = runTargetIdRef.current;
    shouldAutoScrollOutputRef.current = true;
    preloadRunRuntime();
    cancelScheduledRunRef.current = afterNextPaint(() => {
      cancelScheduledRunRef.current = null;
      if (runTargetIdRef.current !== requestedId) {
        return;
      }
      setShowTerminal(true);
      setPanelView("output");
      void runNow().then((outcome) => {
        // A program that doesn't compile has nothing to show in Output; the fix list is what the student needs.
        if (outcome === "compile_error") {
          setPanelView("problems");
          setTouchOutputView("problems");
        }
      });
    });
  }, [preloadRunRuntime, runNow, setShowTerminal]);

  const handleSaveWorkspace = useCallback(() => {
    if ((cloudSavingRequired && authLoading) || isSaving) {
      return;
    }

    if (!canSaveWorkspace) {
      // Signing in can't work while Clerk is unavailable; the account control says so (and the notice bar, for
      // anyone who has signed in here before).
      if (!authUnavailable) setShowSignInPrompt(true);
      return;
    }

    clearManualSaveStatusTimer();
    setManualSaveStatus("saving");
    void saveWorkspaceNow().then((saved) => {
      showTemporaryManualSaveStatus(saved ? "saved" : "error");
    });
  }, [
    authLoading,
    authUnavailable,
    canSaveWorkspace,
    clearManualSaveStatusTimer,
    cloudSavingRequired,
    isSaving,
    saveWorkspaceNow,
    showTemporaryManualSaveStatus,
  ]);

  const handleClearTerminal = useCallback(() => {
    shouldAutoScrollOutputRef.current = true;
    if (terminalPanelId) clearTerminal(terminalPanelId);
  }, [clearTerminal, terminalPanelId]);
  const handleThemeModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  const handleSyntaxColorSchemeChange = useCallback((scheme: SyntaxColorSchemeId) => {
    track("syntax_colors_changed", { scheme });
    setSyntaxColorScheme(scheme);
    saveSyntaxColorScheme(scheme);
  }, []);

  const handleAutoSaveIntervalChange = useCallback((value: number) => {
    const nextValue = clampAutoSaveIntervalMinutes(value);
    setAutoSaveIntervalMinutes(nextValue);
    saveAutoSaveIntervalMinutes(nextValue);
  }, []);

  const handleToggleFlowchart = useCallback(() => {
    if (!currentDocument) {
      setShowFlowchartPrompt(true);
      return;
    }
    if (!showFlowchart) {
      track("flowchart_opened", {});
      setFlowchartMounted(true);
    }
    setShowFlowchart((prev) => !prev);
  }, [currentDocument, showFlowchart]);

  const syncFlowchartCodeToWorkspace = useCallback(
    (
      code: string,
      options?: {
        createDocumentWhenEmpty?: boolean;
        revealCodeView?: boolean;
      },
    ) => {
      // Read the document through a ref so these callbacks stay stable and the memoized
      // flowchart doesn't re-render or re-run its sync effect on every keystroke.
      const doc = currentDocumentRef.current;
      if (doc) {
        if (doc.source !== code) {
          handleDocumentSourceChange(doc.id, code);
        }
      } else if (code.trim().length > 0 || options?.createDocumentWhenEmpty) {
        createDocumentInWorkspace(undefined, { source: code });
      }

      if (options?.revealCodeView) {
        setShowFlowchart(false);
      }
    },
    [createDocumentInWorkspace, handleDocumentSourceChange],
  );

  const handleFlowchartCodeChange = useCallback(
    (code: string) => {
      syncFlowchartCodeToWorkspace(code);
    },
    [syncFlowchartCodeToWorkspace],
  );

  const handleGenerateCode = useCallback(
    (code: string) => {
      syncFlowchartCodeToWorkspace(code, {
        createDocumentWhenEmpty: true,
        revealCodeView: true,
      });
    },
    [syncFlowchartCodeToWorkspace],
  );
  // Browser-only values; the workspace loading gate renders first, so this can't cause a hydration mismatch.
  const touchLayout = getTouchLayout(viewportSize.width, coarsePointer, viewportSize.height);
  const isTouchTablet = touchLayout === "tablet";
  const isTouchPhone = touchLayout === "phone";

  const handleTouchRun = useCallback(() => {
    setTouchOutputView("output");
    if (isTouchTablet) {
      setTouchOutputVisible(true);
      // Give output a useful share of a tall tablet screen instead of a thin strip under a mostly empty editor.
      const comfortableHeight = Math.round(viewportSize.height * 0.35);
      setTerminalHeight((current) => clampNumber(Math.max(current, comfortableHeight), MIN_TERMINAL_HEIGHT, maxTerminalHeight));
    }
    if (isTouchPhone) {
      setTouchTab("output");
    }
    handleRun();
  }, [handleRun, isTouchPhone, isTouchTablet, maxTerminalHeight, viewportSize.height]);

  const handlePhoneBack = useCallback(() => {
    setTouchTab((current) => (current === "editor" ? "files" : "editor"));
  }, []);

  const handleTouchDocumentSelect = useCallback(
    (documentId: string) => {
      selectDocument(documentId);
      if (isTouchPhone) {
        setTouchTab("editor");
      }
    },
    [isTouchPhone, selectDocument],
  );

  const touchSafeAreaStyle = {
    paddingTop: "env(safe-area-inset-top, 0px)",
    paddingRight: "env(safe-area-inset-right, 0px)",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    paddingLeft: "env(safe-area-inset-left, 0px)",
  } as const;

  const currentSyntax = resolveSyntax(syntaxId);

  const handleSyntaxChange = (nextSyntaxId: WorkspaceSyntaxId) => {
    track("syntax_changed", { syntax: nextSyntaxId });
    setSyntaxId(nextSyntaxId);
  };

  // Settings read like an IDE preferences pane: one card of rows, each with the label and what it does on the left
  // and the control on the right (stacked on phones so descriptions keep a readable measure).
  const settingsRowClass = (compact: boolean) =>
    compact
      ? "flex flex-col items-stretch gap-3 px-4 py-3.5"
      : "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5";
  const settingsLabel = (label: string, description: ReactNode) => (
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-medium text-[var(--text)]">{label}</span>
      <span className="mt-0.5 block text-xs leading-5 text-[var(--text3)]">{description}</span>
    </span>
  );

  const renderSyntaxSettings = (compact = false) => (
    <label className={settingsRowClass(compact)}>
      {settingsLabel(
        t.settings.examSyntax,
        <>
          {t.settings.syntaxDescription}{" "}
          <span className="text-[var(--text2)]">
            {currentSyntax.board} {currentSyntax.syllabus}.
          </span>
        </>,
      )}
      <SettingsSelect
        value={currentSyntax.id}
        aria-label={t.settings.examSyntax}
        onChange={(event) => handleSyntaxChange(event.target.value as WorkspaceSyntaxId)}
        className={compact ? "w-full" : "w-[210px] max-w-full"}
      >
        {SYNTAX_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SettingsSelect>
    </label>
  );

  const renderThemeSettings = (compact = false) => (
    <div className={settingsRowClass(compact)}>
      {settingsLabel(
        t.settings.theme,
        <>
          {t.settings.themeDescription}{" "}
          {themeMode === "system"
            ? `${t.settings.activeAppearance} ${resolvedTheme === "dark" ? t.settings.dark : t.settings.light}`
            : null}
        </>,
      )}
      <div
        role="group"
        aria-label={t.settings.theme}
        className={`flex rounded-[var(--radius-control)] border border-[var(--separator)] bg-[var(--surface2)] p-0.5 ${compact ? "w-full" : ""}`}
      >
        {themeOptions.map((option) => {
          const selected = themeMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeModeChange(option.value)}
              aria-pressed={selected}
              className={`rounded-[4px] px-3 text-[13px] font-medium transition ${compact ? "h-11 flex-1" : "h-7 pointer-coarse:min-h-11"} ${
                selected
                  ? "bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text2)] hover:text-[var(--text)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // The scheme previews need the full width, so this row stacks its picker under the label.
  const renderSyntaxColorSettings = () => (
    <div className="flex flex-col items-stretch gap-3 px-4 py-3.5">
      {settingsLabel(t.settings.syntaxColors, t.settings.syntaxColorsDescription)}
      <SyntaxColorSchemePicker
        value={syntaxColorScheme}
        theme={resolvedTheme}
        label={t.settings.syntaxColors}
        names={t.settings.syntaxColorSchemes}
        onChange={handleSyntaxColorSchemeChange}
      />
    </div>
  );

  const renderSaveSettings = (compact = false) =>
    workspacePersistenceMode !== "cloud" ? (
      <div className={settingsRowClass(compact)}>
        {settingsLabel(
          t.settings.autosave,
          workspacePersistenceMode === "local" ? t.settings.autosaveLocal : t.settings.autosaveMemory,
        )}
      </div>
    ) : (
      <label className={settingsRowClass(compact)}>
        {settingsLabel(t.settings.autosaveInterval, t.settings.autosaveEvery(autoSaveIntervalMinutes))}
        <SettingsSelect
          value={autoSaveIntervalMinutes}
          aria-label={t.settings.autosaveIntervalMinutes}
          onChange={(event) => handleAutoSaveIntervalChange(Number(event.target.value))}
          className={compact ? "w-full" : "w-[140px] max-w-full"}
        >
          {[1, 2, 3, 5, 10, 15, 30, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {t.settings.minute(minutes)}
            </option>
          ))}
        </SettingsSelect>
      </label>
    );

  const renderSettingsRows = (compact = false) => (
    <div className="divide-y divide-[var(--separator)] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--separator)] bg-[var(--bg)]">
      {renderSyntaxSettings(compact)}
      {renderThemeSettings(compact)}
      {renderSyntaxColorSettings()}
      {renderSaveSettings(compact)}
    </div>
  );

  const renderAccountControl = (compact = false) => {
    if (!cloudSavingRequired) {
      return null;
    }

    if (authUnavailable) {
      return (
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-[var(--text3)]"
          aria-label={t.auth.unavailable}
          disabled
        >
          <LogIn size={18} />
          <span className={compact ? "sr-only" : "max-w-[8rem] truncate text-xs font-medium"}>
            {t.auth.unavailable}
          </span>
        </button>
      );
    }

    // Still a placeholder until Clerk loads, even when the workspace did not wait for it.
    if (!authLoaded) {
      return (
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-[var(--text3)]"
          aria-label={t.auth.checkingStatus}
          disabled
        >
          <LogIn size={18} />
          <span className={compact ? "sr-only" : "max-w-[8rem] truncate text-xs font-medium"}>
            {t.auth.checking}
          </span>
        </button>
      );
    }

    if (!isCloudAuthConfigured()) {
      return (
        <button
          type="button"
          className={`ui-btn ui-btn-primary gap-1 ${
            compact ? "h-8 w-8 px-0" : "h-8 px-3 text-xs"
          }`}
          onClick={() => {
            window.location.assign(localePath(locale, "/login"));
          }}
        >
          <LogIn size={compact ? 16 : 14} />
          <span className={compact ? "sr-only" : "max-w-[5rem] truncate"}>
            {t.auth.logIn}
          </span>
        </button>
      );
    }

    return (
      <div className="flex items-center">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className={`ui-btn ui-btn-primary gap-1 ${
                compact ? "h-8 w-8 px-0" : "h-8 px-3 text-xs"
              }`}
            >
              <LogIn size={compact ? 16 : 14} />
              <span className={compact ? "sr-only" : "max-w-[5rem] truncate"}>
                {t.auth.logIn}
              </span>
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div className="flex h-7 items-center">
            <UserButton>
              <UserButton.UserProfilePage
                label={t.auth.appearance}
                url="appearance"
                labelIcon={<Palette size={16} />}
              >
                <div className="divide-y divide-[var(--separator)] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--separator)] bg-[var(--bg)]">
                  {renderSyntaxSettings()}
                  {renderThemeSettings()}
                  {renderSyntaxColorSettings()}
                </div>
              </UserButton.UserProfilePage>
              <UserButton.UserProfilePage
                label={t.auth.general}
                url="general"
                labelIcon={<Settings size={16} />}
              >
                <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--separator)] bg-[var(--bg)]">
                  {renderSaveSettings()}
                </div>
              </UserButton.UserProfilePage>
              <UserButton.MenuItems>
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </Show>
      </div>
    );
  };

  const renderSaveControl = (touch = false) => {
    const blocked = (cloudSavingRequired && authLoading) || isSaving;
    const isCloudSave = workspacePersistenceMode === "cloud";
    const showSaving = isSaving || manualSaveStatus === "saving";
    const showSaved = !showSaving && !hasPendingSave && manualSaveStatus === "saved";
    const showError = !showSaving && manualSaveStatus === "error";
    const saveStatusLabel = showSaving ? t.save.saving : showSaved ? t.save.saved : showError ? t.save.failed : null;
    const saveStatusClass = showSaved
      ? "text-[var(--green)]"
      : showError
        ? "text-[var(--red)]"
        : "";
    const saveTitle = showError
      ? t.save.failedTitle
      : canSaveWorkspace
        ? isCloudSave
          ? t.save.cloudTitle
          : t.save.localTitle
        : t.save.signInTitle;

    return (
      <button
        type="button"
        className={`ui-icon-btn ${touch ? "h-10 w-10 text-[var(--text2)]" : ""} ${
          canSaveWorkspace ? saveStatusClass : "cursor-not-allowed opacity-60"
        } ${blocked ? "opacity-60" : ""}`}
        aria-label={t.save.saveWorkspace}
        aria-disabled={!canSaveWorkspace || blocked}
        disabled={blocked}
        title={withShortcut(saveTitle, SHORTCUTS.save[0], apple)}
        onClick={handleSaveWorkspace}
      >
        {showSaving ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : showSaved ? (
          <Check size={16} />
        ) : showError ? (
          <CircleAlert size={16} />
        ) : (
          <Save size={16} />
        )}
        {/* A fixed-size icon so the toolbar never shifts; the status bar carries the words. */}
        {saveStatusLabel ? <span className="sr-only" aria-live="polite">{saveStatusLabel}</span> : null}
      </button>
    );
  };

  const openDocsPanel = () => {
    setShowDocsPanel(true);
  };

  const closeFlowchartPrompt = () => {
    setShowFlowchartPrompt(false);
    setFlowchartFileName("");
  };

  const renderDocsDialog = () =>
    showDocsPanel ? (
      <Dialog
        labelledBy="workspace-docs-title"
        onClose={() => setShowDocsPanel(false)}
        className="h-full max-h-none w-full max-w-6xl overflow-hidden border-0 bg-[var(--bg)] p-0 shadow-[var(--shadow-modal)] md:h-[calc(100%-2.5rem)] md:w-[calc(100%-2.5rem)] md:rounded-[24px] md:border md:border-[var(--separator)]"
      >
        <DocsPanel
          titleId="workspace-docs-title"
          slug={docsSlug}
          onSlugChange={setDocsSlug}
          onClose={() => setShowDocsPanel(false)}
        />
      </Dialog>
    ) : null;

  const renderFlowchartPromptDialog = () =>
    showFlowchartPrompt ? (
      <Dialog labelledBy="flowchart-prompt-title" onClose={closeFlowchartPrompt} className="ui-dialog max-w-sm">
        <h2 id="flowchart-prompt-title" className="ui-dialog-title">
          {t.flowchart.createFirst}
        </h2>
        <p className="ui-dialog-body">{t.flowchart.createFirstDescription}</p>
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const name = flowchartFileName.trim();
            if (!name) return;
            createDocumentInWorkspace(undefined, { name });
            closeFlowchartPrompt();
            setFlowchartMounted(true);
            setShowFlowchart(true);
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text2)]">{t.files.fileName}</span>
            <input
              data-autofocus
              aria-label={t.files.fileName}
              value={flowchartFileName}
              onChange={(event) => setFlowchartFileName(event.target.value)}
              placeholder="main.pseudo"
              className="ui-input"
            />
          </label>
          <div className="ui-dialog-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={closeFlowchartPrompt}>
              {t.common.cancel}
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={!flowchartFileName.trim()}>
              {t.files.createAndOpen}
            </button>
          </div>
        </form>
      </Dialog>
    ) : null;

  const renderCreateFileDialog = () =>
    showCreateFileDialog ? (
      <Dialog labelledBy="create-file-dialog-title" onClose={closeCreateFileDialog} className="ui-dialog max-w-sm">
        <h2 id="create-file-dialog-title" className="ui-dialog-title">
          {t.files.createNewFile}
        </h2>
        <form className="mt-4" onSubmit={submitCreateFile}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text2)]">{t.files.fileName}</span>
            <span className="ui-input-group">
              <input
                ref={createFileInputRef}
                data-autofocus
                aria-label={t.files.fileName}
                value={createFileName}
                onChange={(event) => setCreateFileName(normalizeDocumentEditableName(event.target.value))}
                placeholder="main"
                className="min-w-0 flex-1 border-0 bg-transparent px-2.5 text-[13px] text-[var(--text)] outline-none"
              />
              <span className="flex shrink-0 items-center border-l border-[var(--separator)] bg-[var(--surface2)] px-2.5 font-mono text-xs text-[var(--text3)]">
                {PSEUDO_EXTENSION}
              </span>
            </span>
          </label>
          <div className="ui-dialog-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={closeCreateFileDialog}>
              {t.common.cancel}
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={!createFileName.trim()}>
              {t.files.create}
            </button>
          </div>
        </form>
      </Dialog>
    ) : null;

  const renderSignInPromptDialog = () =>
    // A prompt opened before Clerk gave up would offer a Log In button that can no longer work.
    showSignInPrompt && !authUnavailable ? (
      <Dialog labelledBy="sign-in-save-dialog-title" onClose={() => setShowSignInPrompt(false)} className="ui-dialog max-w-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <CloudOff size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="sign-in-save-dialog-title" className="ui-dialog-title">
              {t.auth.signInToSave}
            </h2>
            <p className="ui-dialog-body">{t.auth.signInDescription}</p>
          </div>
        </div>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setShowSignInPrompt(false)}>
            {t.auth.notNow}
          </button>
          <SignInButton mode="modal">
            {/* Close this modal first: Clerk's sign-in modal would otherwise sit under the inert page. */}
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setShowSignInPrompt(false)}>
              <LogIn size={14} aria-hidden />
              {t.auth.logIn}
            </button>
          </SignInButton>
        </div>
      </Dialog>
    ) : null;

  const renderRenameDialog = () =>
    renameDialog ? (
      <Dialog
        labelledBy="rename-dialog-title"
        returnFocusTo={() => findExplorerItem(renameDialog.nodeId)}
        onClose={() => setRenameDialog(null)}
        className="ui-dialog max-w-sm"
      >
        <h2 id="rename-dialog-title" className="ui-dialog-title">
          {t.files.renameItem}
        </h2>
        <p className="ui-dialog-body">
          {t.files.currentName} <span className="font-medium text-[var(--text)]">{renameDialog.currentName}</span>
        </p>
        <form className="mt-4" onSubmit={submitRename}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text2)]">{t.files.itemName}</span>
            <span className="ui-input-group">
              <input
                ref={renameInputRef}
                data-autofocus
                aria-label={t.files.itemName}
                value={renameValue}
                onChange={(event) =>
                  setRenameValue(
                    renameDialog.isDocument
                      ? normalizeDocumentEditableName(event.target.value)
                      : event.target.value,
                  )
                }
                className="min-w-0 flex-1 border-0 bg-transparent px-2.5 text-[13px] text-[var(--text)] outline-none"
              />
              {renameDialog.isDocument ? (
                <span className="flex shrink-0 items-center border-l border-[var(--separator)] bg-[var(--surface2)] px-2.5 font-mono text-xs text-[var(--text3)]">
                  {PSEUDO_EXTENSION}
                </span>
              ) : null}
            </span>
          </label>
          <div className="ui-dialog-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setRenameDialog(null)}>
              {t.common.cancel}
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={!renameValue.trim()}>
              {t.files.saveName}
            </button>
          </div>
        </form>
      </Dialog>
    ) : null;

  const renderDeleteDialog = () =>
    deleteDialog ? (
      <Dialog
        labelledBy="delete-dialog-title"
        onClose={() => setDeleteDialog(null)}
        returnFocusTo={() => findExplorerItem(deleteDialog.nodeIds[0])}
        className="ui-dialog max-w-sm"
      >
        <h2 id="delete-dialog-title" className="ui-dialog-title">
          {deleteDialog.message}
        </h2>
        <p className="ui-dialog-body">{t.files.cannotUndo}</p>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setDeleteDialog(null)}>
            {t.common.cancel}
          </button>
          <button type="button" className="ui-btn ui-btn-danger" onClick={confirmDelete}>
            {t.common.delete}
          </button>
        </div>
      </Dialog>
    ) : null;

  const renderSettingsDialog = () =>
    showSettingsPanel ? (
      <Dialog
        labelledBy="settings-dialog-title"
        onClose={() => setShowSettingsPanel(false)}
        className="ui-dialog max-w-xl overflow-y-auto p-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--separator)] bg-[var(--surface)] px-5 py-3.5">
          <h2 id="settings-dialog-title" className="ui-dialog-title">
            {t.toolbar.settings}
          </h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label={t.common.close}
            title={t.common.close}
            onClick={() => setShowSettingsPanel(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{renderSettingsRows()}</div>
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--separator)] px-5 py-3 text-xs text-[var(--text3)]">
          <span>{t.legal.notice(new Date().getFullYear())}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {appLegalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text2)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
              >
                {link.label}
              </a>
            ))}
            <LocaleSwitcher />
          </span>
        </footer>
      </Dialog>
    ) : null;

  // The empty editor works like an IDE start page: the actions that begin work, and the shortcuts worth learning.
  const renderStarterPanel = (compact = false) => {
    const startActions = [
      { icon: FilePlus, label: t.files.createNewFile, onClick: () => openCreateFileDialog() },
      { icon: Folder, label: t.files.createFolder, onClick: () => createFolderInWorkspace() },
      { icon: BookOpen, label: t.empty.openDocs, onClick: openDocsPanel },
    ];
    const shortcutRows: Array<{ label: string; id: keyof typeof SHORTCUTS }> = [
      { label: t.toolbar.run, id: "run" },
      { label: t.save.saveWorkspace, id: "save" },
      { label: t.workbench.commandPalette, id: "commandPalette" },
      { label: t.workbench.toggleExplorer, id: "toggleExplorer" },
    ];
    return (
      <div className={`flex h-full min-h-0 overflow-y-auto px-6 ${compact ? "py-8" : "py-12"}`}>
        <section className="m-auto w-full max-w-lg">
          <BrandMark size={36} />
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">{t.empty.welcome}</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text2)]">{t.empty.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {startActions.map(({ icon: Icon, label, onClick }, index) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`ui-btn ${index === 0 ? "ui-btn-primary" : "ui-btn-secondary"}`}
              >
                <Icon size={15} aria-hidden />
                {label}
              </button>
            ))}
          </div>
          {!compact ? (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-[var(--text3)]">{t.empty.shortcuts}</h3>
              <dl className="mt-2 divide-y divide-[var(--separator)] border-y border-[var(--separator)]">
                {shortcutRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between py-2 text-[13px]">
                    <dt className="text-[var(--text2)]">{row.label}</dt>
                    <dd>
                      <kbd className="rounded-[4px] border border-[var(--separator-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-sans text-xs text-[var(--text2)]">
                        {shortcutHint(row.id)}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      </div>
    );
  };

  const renderTouchOutputSurface = (title: string, onClose?: () => void) => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--surface)]">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--separator)] px-3">
        {renderPanelTabs(touchOutputView, setTouchOutputView, true)}
        <div className="flex-1" />
        {touchOutputView === "output" ? (
          <button
            type="button"
            className="ui-icon-btn h-10 w-10"
            aria-label={t.terminal.clearOutput}
            onClick={handleClearTerminal}
          >
            <Trash2 size={18} />
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            className="ui-icon-btn h-10 w-10"
            aria-label={t.terminal.close(title)}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {touchOutputView === "problems" ? (
        <div role="tabpanel" aria-label={t.workbench.problems} className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <ProblemsList diagnostics={compileDiagnostics} onSelect={revealDiagnostic} touch />
        </div>
      ) : (
      <>
      <div
        ref={touchOutputScrollRef}
        data-testid="touch-output-scroll-region"
        role="log"
        aria-live="polite"
        aria-label={title}
        tabIndex={0}
        onScroll={handleOutputScroll}
        className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 py-2 touch-pan-y"
      >
        <pre className="min-w-full whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.5]">
          {terminalOutput ? (
            <span className="text-[var(--text2)]">{terminalOutput}</span>
          ) : lastRunError ? null : (
            <span className="text-[var(--text3)]">{t.terminal.ready}</span>
          )}
        </pre>
        {renderRunErrorRow(true)}
      </div>

      {pendingInput.panelId === terminalPanelId && pendingInput.prompt ? (
        <form
          className="shrink-0 border-t border-[var(--separator)] px-4 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitPendingInput();
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span id="terminal-input-prompt" className="font-mono text-xs text-[var(--green)]">
              {pendingInput.prompt}
            </span>
            <input
              value={pendingInput.text}
              onChange={(event) => setPendingInputText(event.target.value)}
              autoFocus
              aria-label={t.terminal.input}
              aria-describedby="terminal-input-prompt"
              className="ui-input h-10 min-w-[140px] flex-1 font-mono text-[14px]"
              placeholder={t.terminal.inputPlaceholder}
            />
            <button
              type="submit"
              className="ui-btn ui-btn-primary h-10"
            >
              {t.terminal.send}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-ghost h-10"
              onClick={cancelPendingInput}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {isRunning &&
        runningTerminalPanelId === terminalPanelId &&
        !(pendingInput.panelId === terminalPanelId && pendingInput.prompt) && (
          <div className="shrink-0 border-t border-[var(--separator)] px-4 py-1.5">
            <p className="text-[11px] text-[var(--green)]">{t.terminal.running}</p>
          </div>
        )}
      </>
      )}
    </div>
  );

  /* ── dialog handlers ── */

  // Sidebar callbacks are memoized so the memoized sidebar skips page renders that don't change the workspace.
  const handleRenameNode = useCallback(
    (nodeId: string) => {
      const node = workspace?.nodes[nodeId];
      if (!node) return;
      const isDocument = node.type === "document";
      setRenameDialog({ nodeId: node.id, currentName: node.name, isDocument });
      setRenameValue(isDocument ? getDocumentEditableName(node.name) : node.name);
    },
    [workspace],
  );

  const handleDeleteNodes = useCallback(
    (nodeIds: string[]) => {
      if (!workspace) return;
      const ids = Array.from(new Set(nodeIds)).filter((id) => !!workspace.nodes[id]);
      if (ids.length === 0) return;
      setDeleteDialog({
        nodeIds: ids,
        message:
          ids.length === 1
            ? t.files.deleteOne(workspace.nodes[ids[0]].name)
            : t.files.deleteMany(ids.length),
      });
    },
    [t, workspace],
  );

  function focusEditorWhenReady() {
    // Each file gets its own editor instance, so after opening a file wait for the new instance; if the open
    // file did not change (e.g. a background tab closed), fall back to the current editor after a few frames.
    const initialApi = editorApiRef.current;
    let attempts = 0;
    const tryFocus = () => {
      const api = editorApiRef.current;
      if (api && (api !== initialApi || attempts >= 20)) {
        api.focus();
        return;
      }
      if (attempts++ < 120) window.requestAnimationFrame(tryFocus);
    };
    window.requestAnimationFrame(tryFocus);
  }

  const openCreateFileDialog = (options?: { parentId?: string; initialName?: string }) => {
    setCreateFileParentId(options?.parentId);
    setCreateFileName(getDocumentEditableName(options?.initialName ?? "main.pseudo"));
    setShowCreateFileDialog(true);
  };

  const handleCreateDocumentFromSidebar = useCallback((parentId?: string) => {
    setCreateFileParentId(parentId);
    setCreateFileName(getDocumentEditableName("Untitled.pseudo"));
    setShowCreateFileDialog(true);
  }, []);

  const closeCreateFileDialog = () => {
    setShowCreateFileDialog(false);
    setCreateFileName("main");
    setCreateFileParentId(undefined);
  };

  const submitCreateFile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const baseName = normalizeDocumentEditableName(createFileName);
    if (!baseName) return;
    const name = `${baseName}${PSEUDO_EXTENSION}`;
    const parentId = createFileParentId;
    // Close the dialog in this frame; opening the new file lays out the whole editor, so it waits
    // until the tap has painted.
    closeCreateFileDialog();
    afterNextPaint(() => {
      createDocumentInWorkspace(parentId, { name });
      // Put the caret in the new file so the first keystrokes land in the code, as in an IDE. This runs after the
      // dialog's focus restoration, and waits for a freshly mounted editor if this was the first file.
      focusEditorWhenReady();
    });
  };

  const submitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameDialog) return;
    const name = getSubmittedRenameValue(renameDialog, renameValue);
    if (!name) return;
    if (renameNodeInWorkspace(renameDialog.nodeId, name)) {
      setRenameDialog(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteDialog) return;
    if (deleteNodesInWorkspace(deleteDialog.nodeIds)) {
      setDeleteDialog(null);
    }
  };

  /* ── tab drag-and-drop ── */

  const handleTabDrop = (event: DragEvent<HTMLElement>, targetIndex: number) => {
    if (!editorPanelId) return;
    const payload = event.dataTransfer.getData("application/x-editor-tab");
    if (!payload) return;
    event.preventDefault();
    try {
      const parsed = JSON.parse(payload) as { panelId: string; documentId: string };
      if (typeof parsed.panelId === "string" && typeof parsed.documentId === "string") {
        moveEditorDocumentTab(parsed.panelId, editorPanelId, parsed.documentId, targetIndex);
      }
    } catch {
      /* ignore malformed drag data */
    }
  };

  const renderPanelTabs = (view: PanelView, onChange: (view: PanelView) => void, touch = false) => {
    const tabs: Array<{ id: PanelView; label: string; count?: number }> = [
      { id: "output", label: t.terminal.output },
      { id: "problems", label: t.workbench.problems, count: problemTotal },
    ];
    return (
      <div
        role="tablist"
        aria-label={t.workbench.panelTabs}
        className={`flex items-stretch gap-4 self-stretch ${touch ? "gap-5" : ""}`}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const next = view === "output" ? "problems" : "output";
          const tabList = event.currentTarget;
          onChange(next);
          window.requestAnimationFrame(() => {
            tabList.querySelector<HTMLElement>(`[data-panel-view="${next}"]`)?.focus();
          });
        }}
      >
        {tabs.map((tab) => {
          const selected = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-panel-view={tab.id}
              data-active={selected}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={`ui-tab font-medium ${touch ? "text-[14px]" : "text-[12px]"}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {tab.count ? (
                <span
                  className={`min-w-[18px] rounded-full px-1.5 text-center text-[10px] font-semibold leading-4 ${
                    problemCounts.errors > 0
                      ? "bg-[var(--red)] text-[var(--on-red)]"
                      : "bg-[var(--orange)] text-[var(--on-accent)]"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  /** Explains account-sync situations in the notice bar, with the action that resolves them. */
  const renderSyncNotice = () => {
    if (showAuthUnavailableNotice) {
      // iOS Safari never shows the leave warning, so ask here before a reload discards work in this tab.
      const retry = () => {
        if (shouldWarnBeforeUnload && !window.confirm(t.sync.authRetryDiscards)) return;
        leaveConfirmedRef.current = true;
        window.location.reload();
      };
      return (
        <div className="flex items-center gap-3" role="status">
          <span className="text-[var(--red)]">{t.sync.authUnavailable}</span>
          <button type="button" className="ui-btn ui-btn-secondary h-6 px-2 text-xs" onClick={retry}>
            {t.sync.retry}
          </button>
        </div>
      );
    }
    if (!syncNotice) return null;
    const unreachable = syncNotice === "account-unreachable";
    return (
      <div className="flex items-center gap-3" role="status">
        <span className={unreachable ? "text-[var(--red)]" : "text-[var(--text2)]"}>
          {unreachable ? t.sync.accountUnreachable : t.sync.recoveredCopies}
        </span>
        <button
          type="button"
          className="ui-btn ui-btn-secondary h-6 px-2 text-xs"
          onClick={unreachable ? () => window.location.reload() : dismissSyncNotice}
        >
          {unreachable ? t.sync.retry : t.common.dismiss}
        </button>
      </div>
    );
  };

  /** The error that stopped the last run, as a row that jumps to the line (like a linked stack frame). */
  const renderRunErrorRow = (touch = false) => {
    if (!lastRunError) return null;
    const message = lastRunError.code === "RUN408" ? t.workbench.runawayLoop : lastRunError.message;
    const errorDocument = workspace?.nodes[lastRunError.documentId];
    if (!errorDocument) return null;
    const inOtherFile = lastRunError.documentId !== currentDocument?.id;
    return (
      <button
        type="button"
        onClick={() => {
          if (inOtherFile) selectDocument(lastRunError.documentId);
          revealDiagnostic(lastRunError, lastRunError.documentId);
        }}
        className={`mt-1 flex w-full items-start gap-2 rounded-md border border-[color-mix(in_srgb,var(--red)_35%,transparent)] bg-[color-mix(in_srgb,var(--red)_10%,transparent)] px-2.5 text-left transition enabled:hover:bg-[color-mix(in_srgb,var(--red)_16%,transparent)] ${
          touch ? "min-h-11 py-2.5 text-[13px]" : "py-1.5 text-xs"
        }`}
      >
        <CircleAlert size={touch ? 16 : 14} className="mt-px shrink-0 text-[var(--red)]" aria-hidden />
        <span className="min-w-0 flex-1 text-[var(--text)]">
          <span className="font-semibold text-[var(--red)]">
            {inOtherFile
              ? t.workbench.runtimeErrorInFile(errorDocument.name, lastRunError.line)
              : t.workbench.runtimeErrorOnLine(lastRunError.line)}
          </span>{" "}
          {message}
          {lastRunError.hint ? <span className="block text-[var(--text2)]">{t.diagnostics.hint} {lastRunError.hint}</span> : null}
        </span>
      </button>
    );
  };

  /** Closes a tab and, like IDE tab strips, activates its right-hand neighbour (else the left one). */
  const closeTabSelectingNeighbour = (documentId: string): string | undefined => {
    if (!editorPanel) return undefined;
    const ids = editorPanel.openDocumentIds;
    const index = ids.indexOf(documentId);
    const neighbourId = ids[index + 1] ?? ids[index - 1];
    const wasActive = editorPanel.activeDocumentId === documentId;
    closeEditorDocumentTab(editorPanel.id, documentId);
    if (wasActive && neighbourId) setEditorActiveDocument(editorPanel.id, neighbourId);
    return wasActive ? neighbourId : editorPanel.activeDocumentId ?? neighbourId;
  };

  /** Arrow keys move between editor tabs, as in IDE tab strips; Home/End jump to the ends. */
  const handleTabListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!editorPanel) return;
    const ids = editorPanel.openDocumentIds;
    const currentIndex = ids.indexOf(editorPanel.activeDocumentId ?? "");
    let nextIndex = -1;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % ids.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + ids.length) % ids.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = ids.length - 1;
    else if ((event.key === "Delete" || event.key === "Backspace") && currentIndex >= 0 && ids.length > 1) {
      // Close the focused tab from the keyboard, then keep focus in the strip on its neighbour.
      event.preventDefault();
      const neighbourId = closeTabSelectingNeighbour(ids[currentIndex]);
      const tabList = event.currentTarget;
      window.requestAnimationFrame(() => {
        const next = neighbourId
          ? tabList.querySelector<HTMLElement>(`[data-document-id="${CSS.escape(neighbourId)}"]`)
          : null;
        (next ?? document.querySelector<HTMLElement>('[role="tree"]'))?.focus();
      });
      return;
    }
    if (nextIndex < 0 || ids.length === 0) return;
    event.preventDefault();
    const nextId = ids[nextIndex];
    setEditorActiveDocument(editorPanel.id, nextId);
    const tabList = event.currentTarget;
    window.requestAnimationFrame(() => {
      tabList.querySelector<HTMLElement>(`[data-document-id="${CSS.escape(nextId)}"]`)?.focus();
    });
  };

  /* ── workspace commands & keyboard shortcuts ── */

  // Free the editor models of deleted documents, and all of them when leaving the workspace.
  const documentIdsKey = workspace
    ? Object.values(workspace.nodes)
        .filter((node) => node.type === "document")
        .map((node) => node.id)
        .sort()
        .join("\n")
    : "";
  useEffect(() => {
    const keep = new Set(documentIdsKey ? documentIdsKey.split("\n") : []);
    // Wait a tick so an editor that is unmounting with the last document has detached its model first.
    const timer = window.setTimeout(() => disposeWorkspaceModels(keep), 0);
    return () => window.clearTimeout(timer);
  }, [documentIdsKey]);
  useEffect(() => () => void window.setTimeout(() => disposeWorkspaceModels(), 0), []);

  const revealDiagnostic = useCallback(
    (diagnostic: Diagnostic, documentId?: string) => {
      if (isTouchPhone) {
        setTouchTab("editor");
      }
      // On phones the editor remounts when its tab opens, and opening another file swaps the model a frame later,
      // so wait until the editor is showing the right document.
      let attempts = 0;
      const tryReveal = () => {
        const api = editorApiRef.current;
        if (api && (!documentId || api.showsDocument(documentId))) {
          api.revealPosition(diagnostic.line, diagnostic.column);
          return;
        }
        if (attempts++ < 120) window.requestAnimationFrame(tryReveal);
      };
      tryReveal();
    },
    [isTouchPhone],
  );

  const showProblems = useCallback(() => {
    if (touchLayout === "phone") {
      setTouchTab("output");
      setTouchOutputView("problems");
      return;
    }
    if (touchLayout === "tablet") {
      setTouchOutputVisible(true);
      setTouchOutputView("problems");
      return;
    }
    setShowTerminal(true);
    setPanelView("problems");
  }, [setShowTerminal, touchLayout]);

  const togglePanel = useCallback(() => {
    if (touchLayout === "tablet") {
      setTouchOutputVisible((current) => !current);
      return;
    }
    setShowTerminal((current) => !current);
  }, [setShowTerminal, touchLayout]);

  const toggleExplorer = useCallback(() => {
    if (touchLayout === "tablet") {
      setTouchSidebarVisible((current) => !current);
      return;
    }
    setShowExplorer((current) => !current);
  }, [setShowExplorer, touchLayout]);

  // Commands call through a ref so the list (and the editor actions built from it) stays stable across renders.
  const commandHandlersRef = useRef<Record<string, () => void>>({});
  useEffect(() => {
    commandHandlersRef.current = {
      run: () => {
        if (!isRunning && currentDocument) (touchLayout ? handleTouchRun : handleRun)();
      },
      save: handleSaveWorkspace,
      toggleExplorer,
      togglePanel,
      problems: showProblems,
      settings: () => (isTouchPhone ? setTouchTab("settings") : setShowSettingsPanel(true)),
      newFile: () => openCreateFileDialog(),
      newFolder: () => createFolderInWorkspace(),
      commandPalette: () => editorApiRef.current?.openCommandPalette(),
    };
  });

  const workspaceCommands = useMemo<WorkspaceCommand[]>(() => [
    { id: "run", label: t.workbench.commands.run, shortcuts: SHORTCUTS.run, run: () => commandHandlersRef.current.run?.() },
    { id: "save", label: t.workbench.commands.save, shortcuts: SHORTCUTS.save, run: () => commandHandlersRef.current.save?.() },
    {
      id: "toggleExplorer",
      label: t.workbench.commands.toggleExplorer,
      shortcuts: SHORTCUTS.toggleExplorer,
      run: () => commandHandlersRef.current.toggleExplorer?.(),
    },
    {
      id: "togglePanel",
      label: t.workbench.commands.togglePanel,
      shortcuts: SHORTCUTS.togglePanel,
      run: () => commandHandlersRef.current.togglePanel?.(),
    },
    {
      id: "problems",
      label: t.workbench.commands.problems,
      shortcuts: SHORTCUTS.problems,
      run: () => commandHandlersRef.current.problems?.(),
    },
    {
      id: "settings",
      label: t.workbench.commands.settings,
      shortcuts: SHORTCUTS.settings,
      run: () => commandHandlersRef.current.settings?.(),
    },
    { id: "newFile", label: t.workbench.commands.newFile, shortcuts: [], run: () => commandHandlersRef.current.newFile?.() },
    { id: "newFolder", label: t.workbench.commands.newFolder, shortcuts: [], run: () => commandHandlersRef.current.newFolder?.() },
    {
      id: "commandPalette",
      label: t.workbench.commands.commandPalette,
      shortcuts: SHORTCUTS.commandPalette,
      run: () => commandHandlersRef.current.commandPalette?.(),
    },
  ], [t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // The editor handles its own keybindings (and marks the event handled); everything else lands here.
      if (event.defaultPrevented || event.isComposing) return;
      const command = workspaceCommands.find((candidate) =>
        candidate.shortcuts.some((shortcut) => matchesShortcut(event, shortcut, apple)),
      );
      if (!command) return;
      event.preventDefault();
      // Leave the page behind an open dialog alone; still swallow Save so the browser's save-page dialog never opens.
      if (document.querySelector("dialog[open]") && command.id !== "save") return;
      command.run();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [apple, workspaceCommands]);

  const phoneSaveLabel = {
    "saved-local": t.workbench.savedLocal,
    "saved-cloud": t.workbench.savedCloud,
    "saved-device-syncing": t.workbench.savedDeviceSyncingShort,
    unsaved: t.workbench.unsaved,
    saving: t.workbench.savingNow,
    "not-saved": t.workbench.notSaved,
    failed: t.workbench.saveFailed,
  }[saveIndicatorStateFor()];
  function saveIndicatorStateFor(): SaveIndicatorState {
    return saveError
      ? "failed"
      : isSaving || manualSaveStatus === "saving"
        ? "saving"
        : !canSaveWorkspace
          ? "not-saved"
          : hasPendingSave
            ? workspacePersistenceMode === "cloud" && unsyncedEditsSafeOnDevice
              ? "saved-device-syncing"
              : "unsaved"
            : workspacePersistenceMode === "cloud"
              ? "saved-cloud"
              : "saved-local";
  }
  const shortcutHint = (id: keyof typeof SHORTCUTS) => formatShortcut(SHORTCUTS[id][0], apple);
  const tip = (label: string, id: keyof typeof SHORTCUTS) => withShortcut(label, SHORTCUTS[id][0], apple);
  const problemCounts = countProblems(compileDiagnostics);
  const problemTotal = problemCounts.errors + problemCounts.warnings;
  const saveIndicatorState = saveIndicatorStateFor();

  /* ── loading state ── */

  if (!workspace) {
    // This is also the prerendered HTML, so it paints the title bar before any script runs. It must
    // not depend on browser-only state (platform, viewport), or hydration would mismatch.
    return (
      <main className="flex h-dvh flex-col overflow-hidden bg-[var(--bg)]">
        <header className="flex h-[52px] shrink-0 items-center bg-[var(--titlebar)] px-4">
          <Link
            href="/"
            className="flex items-center gap-2 transition hover:opacity-80"
            aria-label={t.toolbar.home}
          >
            <BrandMark size={20} />
            <span className="text-[13px] font-semibold text-[var(--text)]">PseudoEditor</span>
          </Link>
        </header>
        <div className="h-px shrink-0 bg-[var(--separator)]" />
        <div className="min-h-0 flex-1">
          <EditorLoader label={t.loading.workspace} />
        </div>
      </main>
    );
  }

  /* ── render ── */

  if (touchLayout) {
    const phoneTabItems = [
      { key: "editor" as const, label: t.touchTabs.editor, icon: Code },
      { key: "files" as const, label: t.touchTabs.files, icon: Folder },
      { key: "output" as const, label: t.touchTabs.output, icon: Terminal },
      { key: "settings" as const, label: t.touchTabs.settings, icon: Settings },
    ];

    return (
      <main
        className="w-screen overflow-hidden bg-[var(--bg)]"
        style={{ height: "100dvh", minHeight: "100svh" }}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden" style={touchSafeAreaStyle}>
          {(saveError || appNotice || syncNotice || showAuthUnavailableNotice) && (
            <div className="shrink-0 border-b border-[var(--separator)] bg-[var(--surface)] px-4 py-1.5">
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                {renderSyncNotice()}
                {saveError && syncNotice !== "account-unreachable" && <span className="text-[var(--red)]">{localizedSaveError}</span>}
                {appNotice && (
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        appNotice.tone === "error" ? "text-[var(--red)]" : "text-[var(--text2)]"
                      }
                    >
                      {appNotice.message}
                    </span>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary h-6 px-2 text-xs"
                      onClick={dismissNotice}
                    >
                {t.common.dismiss}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isTouchTablet ? (
            <>
              <header className="flex h-[52px] shrink-0 items-center bg-[var(--titlebar)] px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    type="button"
                    className="ui-icon-btn h-10 w-10 text-[var(--text2)]"
                    aria-label={touchSidebarVisible ? t.toolbar.hideSidebar : t.toolbar.showSidebar}
                    onClick={() => setTouchSidebarVisible((current) => !current)}
                  >
                    <PanelLeft size={22} />
                  </button>
                  <div className="h-6 w-px bg-[var(--separator)]" />
                  <FileCode size={18} aria-hidden className={currentDocument ? "text-[var(--accent)]" : "text-[var(--text3)]"} />
                  <span className="truncate text-[17px] font-semibold text-[var(--text)]">
                    {currentDocument?.name ?? t.files.noFileSelected}
                  </span>
                </div>

                <div className="flex flex-1 items-center justify-end gap-3">
                  {renderSaveControl(true)}
                  <button
                    type="button"
                    className="ui-icon-btn h-10 w-10 text-[var(--text2)]"
                    aria-label={t.toolbar.openSettings}
                    onClick={() => setShowSettingsPanel(true)}
                  >
                    <Settings size={22} />
                  </button>
                  <button
                    type="button"
                    className="group flex h-11 w-11 items-center justify-center disabled:opacity-50"
                    aria-label={isRunning ? t.toolbar.running : t.toolbar.run}
                    onPointerEnter={preloadRunRuntime}
                    onFocus={preloadRunRuntime}
                    onClick={handleTouchRun}
                    disabled={isRunning || !currentDocument}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--green)] text-[var(--on-green)] transition group-hover:brightness-110">
                      <Play size={16} fill="currentColor" aria-hidden />
                    </span>
                  </button>
                  {renderAccountControl(true)}
                </div>
              </header>

              <div className="h-px shrink-0 bg-[var(--separator)]" />

              <div className="flex min-h-0 flex-1">
                {touchSidebarVisible ? (
                  <>
                    <div
                      className="min-h-0 shrink-0 overflow-hidden bg-[var(--sidebar)]"
                      style={{ width: sidebarWidth }}
                    >
                      <WorkspaceSidebar
                        workspace={workspace}
                        onSelectDocument={handleTouchDocumentSelect}
                        onToggleFolder={toggleFolder}
                        onExpandFolder={expandFolder}
                        onCreateFolder={createFolderInWorkspace}
                        onCreateDocument={handleCreateDocumentFromSidebar}
                        onRenameNode={handleRenameNode}
                        onDeleteNodes={handleDeleteNodes}
                        onMoveNodes={moveNodesInWorkspace}
                      />
                    </div>
                    <div
                      role="separator"
                      aria-label={t.terminal.resizeSidebar}
                      aria-orientation="vertical"
                      tabIndex={0}
                      className="relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-[var(--separator)] before:absolute before:inset-y-0 before:-left-3 before:-right-3 before:content-[''] focus-visible:bg-[var(--accent)] focus-visible:outline-none"
                      onPointerDown={handleSidebarResize}
                      onKeyDown={handleSidebarResizeKeyDown}
                    />
                  </>
                ) : null}

                <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg)]">
                  {breadcrumbs.filter((node) => node.parentId !== null).length > 1 ? (
                    <>
                      <div className="flex h-8 shrink-0 items-center px-4">
                        <Breadcrumbs path={breadcrumbs} />
                      </div>
                      <div className="h-px shrink-0 bg-[var(--separator)]" />
                    </>
                  ) : null}
                  {practiceBanner}

                  <div className="min-h-0 flex-1">
                    {currentDocument ? (
                      <MonacoPseudocodeEditor
                        documentKey={currentDocument.id}
                        value={currentDocument.source}
                        onChange={handleCurrentSourceChange}
                        diagnostics={
                          activeDocument?.id === currentDocument.id ? compileDiagnostics : EMPTY_DIAGNOSTICS
                        }
                        theme={resolvedTheme}
                        syntaxId={syntaxId}
                        colorScheme={syntaxColorScheme}
                        commands={workspaceCommands}
                        apiRef={editorApiRef}
                      />
                    ) : (
                      renderStarterPanel(true)
                    )}
                  </div>

                  {touchOutputVisible ? (
                    <>
                      {/* A finger-sized drag handle with a visible grip, on a single divider. */}
                      <div
                        role="separator"
                        aria-label={t.terminal.resizeOutput}
                        aria-orientation="horizontal"
                        tabIndex={0}
                        className="relative flex h-6 shrink-0 cursor-row-resize touch-none items-center justify-center border-t border-[var(--separator)] bg-[var(--surface)]"
                        onPointerDown={handleTerminalResize}
                        onKeyDown={handleTerminalResizeKeyDown}
                      >
                        <div className="h-1 w-10 rounded-full bg-[var(--surface3)]" />
                      </div>
                      <div
                        className="min-h-0 shrink-0 overflow-hidden"
                        style={{
                          height: clampNumber(
                            terminalHeight,
                            MIN_TERMINAL_HEIGHT,
                            maxTerminalHeight,
                          ),
                        }}
                      >
                        {renderTouchOutputSurface(t.terminal.output, () => setTouchOutputVisible(false))}
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="flex h-11 shrink-0 items-center gap-2 border-t border-[var(--separator)] px-4 text-left text-[var(--text2)] transition hover:bg-[var(--surface)]"
                      aria-label={t.workbench.showPanel}
                      onClick={() => setTouchOutputVisible(true)}
                    >
                      <span className="text-[13px] font-semibold">{t.terminal.output}</span>
                      <div className="flex-1" />
                      <ChevronUp size={16} className="text-[var(--text3)]" />
                    </button>
                  )}
                </section>
              </div>
              <StatusBar
                errors={problemCounts.errors}
                warnings={problemCounts.warnings}
                onShowProblems={showProblems}
                syntaxLabel={currentSyntax.label}
                onChangeSyntax={() => setShowSettingsPanel(true)}
                saveState={saveIndicatorState}
                onSave={handleSaveWorkspace}
                showCursor={Boolean(currentDocument)}
                onGoToLine={() => editorApiRef.current?.goToLine()}
              />
            </>
          ) : (
            <>
              <header className="flex h-12 shrink-0 items-center gap-3 bg-[var(--titlebar)] px-4">
                <button
                  type="button"
                  className="ui-icon-btn h-10 w-10 text-[var(--text2)]"
                  aria-label={touchTab === "editor" ? t.toolbar.openFiles : t.toolbar.backToEditor}
                  onClick={handlePhoneBack}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[17px] font-semibold leading-6 text-[var(--text)]">
                    {currentDocument?.name ?? t.files.createAFile}
                  </span>
                  <span
                    className={`truncate text-[11px] leading-4 ${
                      saveIndicatorState === "failed"
                        ? "text-[var(--red)]"
                        : saveIndicatorState === "not-saved" || saveIndicatorState === "unsaved"
                          ? "text-[var(--text2)]"
                          : "text-[var(--text3)]"
                    }`}
                    aria-live="polite"
                  >
                    {phoneSaveLabel}
                  </span>
                </div>
                {renderSaveControl(true)}
                <button
                  type="button"
            className="ui-icon-btn h-10 w-10 text-[var(--text2)]"
            aria-label={t.toolbar.openDocs}
            onClick={openDocsPanel}
          >
            <BookOpen size={22} />
          </button>
                <button
                  type="button"
                  className="group flex h-11 w-11 items-center justify-center disabled:opacity-50"
                  aria-label={isRunning ? t.toolbar.running : t.toolbar.run}
                  onPointerEnter={preloadRunRuntime}
                  onFocus={preloadRunRuntime}
                  onClick={handleTouchRun}
                  disabled={isRunning || !currentDocument}
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--green)] text-[var(--on-green)] transition group-hover:brightness-110">
                      <Play size={16} fill="currentColor" aria-hidden />
                    </span>
                  </button>
                {renderAccountControl(true)}
              </header>

              <div className="h-px shrink-0 bg-[var(--separator)]" />

              <section className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
                {practiceBanner}
                <div className="min-h-0 flex-1">
                  {touchTab === "editor" ? (
                    currentDocument ? (
                      <MonacoPseudocodeEditor
                        documentKey={currentDocument.id}
                        value={currentDocument.source}
                        onChange={handleCurrentSourceChange}
                        diagnostics={
                          activeDocument?.id === currentDocument.id ? compileDiagnostics : EMPTY_DIAGNOSTICS
                        }
                        theme={resolvedTheme}
                        syntaxId={syntaxId}
                        colorScheme={syntaxColorScheme}
                        commands={workspaceCommands}
                        apiRef={editorApiRef}
                      />
                    ) : (
                      renderStarterPanel(true)
                    )
                  ) : null}

                  {touchTab === "files" ? (
                    <WorkspaceSidebar
                      workspace={workspace}
                      onSelectDocument={handleTouchDocumentSelect}
                      onToggleFolder={toggleFolder}
                      onExpandFolder={expandFolder}
                      onCreateFolder={createFolderInWorkspace}
                      onCreateDocument={handleCreateDocumentFromSidebar}
                      onRenameNode={handleRenameNode}
                      onDeleteNodes={handleDeleteNodes}
                      onMoveNodes={moveNodesInWorkspace}
                    />
                  ) : null}

                  {touchTab === "output" ? renderTouchOutputSurface(t.terminal.output) : null}

                  {touchTab === "settings" ? (
                    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--bg)] px-5 pb-8 pt-6">
                      <h2 className="text-[28px] font-semibold text-[var(--text)]">{t.toolbar.settings}</h2>
                      <div className="mt-5">{renderSettingsRows(true)}</div>
                      <button
                        type="button"
                        className="ui-btn ui-btn-secondary mt-6 h-11 w-full text-sm"
                        onClick={openDocsPanel}
                      >
                        <BookOpen size={16} />
                        {t.toolbar.openDocs}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div
                  className="shrink-0 bg-[var(--bg)] px-4 pt-3"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 21px)" }}
                >
                  <nav
                    aria-label={t.workbench.sections}
                    className="flex h-[52px] items-center rounded-[18px] border border-[var(--separator)] bg-[var(--surface)] p-1 shadow-[var(--shadow-sm)]"
                  >
                    {phoneTabItems.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = touchTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          className={`flex h-full flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] transition-colors ${
                            isActive
                              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "text-[var(--text3)] active:bg-[var(--hover)]"
                          }`}
                          aria-label={tab.label}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setTouchTab(tab.key)}
                        >
                          <span className="relative flex">
                            <Icon size={18} />
                            {tab.key === "output" && problemTotal > 0 ? (
                              <span
                                className={`absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-4 ${
                                  problemCounts.errors > 0
                                    ? "bg-[var(--red)] text-[var(--on-red)]"
                                    : "bg-[var(--orange)] text-[var(--on-accent)]"
                                }`}
                                aria-hidden
                              >
                                {problemTotal}
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[11px] font-medium">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </section>
            </>
          )}

          {renderRenameDialog()}
          {renderDeleteDialog()}
          {renderSettingsDialog()}
          {renderSignInPromptDialog()}
          {renderCreateFileDialog()}
          {renderFlowchartPromptDialog()}
          {renderDocsDialog()}
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      {/* ════════════ Title Bar ════════════ */}
      {/* Three columns so the file name sits in the true centre of the window, never over the brand or toolbar. */}
      <header
        className={`grid h-11 shrink-0 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 border-b border-[var(--separator)] bg-[var(--titlebar)] pl-4 pr-2 ${
          isDesktopShell ? "app-drag-region" : ""
        }`}
      >
        {/* Spacer for native traffic lights (desktop) / brand label (web) */}
        <div className={`flex shrink-0 items-center gap-2 justify-self-start ${isDesktopShell ? "w-[80px]" : "w-auto"}`}>
          {isDesktopShell ? null : (
            <Link
              href="/"
              className="flex items-center gap-2 transition hover:opacity-80"
              aria-label={t.toolbar.home}
            >
              <BrandMark size={20} />
              <span className="hidden text-[13px] font-semibold text-[var(--text)] min-[800px]:inline">
                PseudoEditor
              </span>
            </Link>
          )}
        </div>

        <p className="min-w-0 truncate text-center text-[13px] font-medium text-[var(--text2)]" title={titlePath.join(" / ")}>
          {titlePath.length > 1 ? (
            <span className="text-[var(--text3)]">{titlePath.slice(0, -1).join(" / ")} / </span>
          ) : null}
          {titlePath.at(-1) ?? ""}
        </p>

        {/* Toolbar: layout toggles | file and learning tools | Run (the primary action) */}
        <div className="app-no-drag flex items-center gap-0.5 justify-self-end">
          <button
            type="button"
            className="ui-icon-btn"
            aria-label={showExplorer ? t.workbench.hideExplorer : t.workbench.showExplorer}
            aria-pressed={showExplorer}
            title={tip(t.workbench.toggleExplorer, "toggleExplorer")}
            onClick={toggleExplorer}
          >
            <PanelLeft size={16} />
          </button>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label={showTerminal ? t.workbench.hidePanel : t.workbench.showPanel}
            aria-pressed={showTerminal}
            title={tip(t.workbench.togglePanel, "togglePanel")}
            onClick={togglePanel}
          >
            <PanelBottom size={16} />
          </button>
          <div className="mx-1.5 h-4 w-px bg-[var(--separator-strong)]" aria-hidden />
          {renderSaveControl()}
          <Link
            href={localePath(locale, "/practice")}
            className="ui-icon-btn"
            aria-label={t.toolbar.openPractice}
            title={t.toolbar.openPractice}
          >
            <Shuffle size={16} />
          </Link>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label={t.toolbar.docs}
            title={t.toolbar.openDocs}
            onClick={openDocsPanel}
          >
            <BookOpen size={16} />
          </button>
          <button
            type="button"
            className="ui-icon-btn"
            data-accent-when-on
            aria-label={flowchartVisible ? t.toolbar.switchToCode : t.toolbar.switchToFlowchart}
            aria-pressed={flowchartVisible}
            title={flowchartVisible ? t.toolbar.switchToCode : t.toolbar.switchToFlowchart}
            onPointerEnter={preloadFlowchartEditor}
            onFocus={preloadFlowchartEditor}
            onClick={handleToggleFlowchart}
          >
            <Workflow size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label={t.toolbar.openSettings}
            title={tip(t.toolbar.settings, "settings")}
            onClick={() => setShowSettingsPanel(true)}
          >
            <Settings size={16} />
          </button>
          <div className="mx-1.5 h-4 w-px bg-[var(--separator-strong)]" aria-hidden />
          <button
            type="button"
            className="ui-btn ui-btn-run h-7 gap-1.5 px-2.5 text-[13px]"
            aria-label={isRunning ? t.toolbar.running : t.toolbar.run}
            title={tip(isRunning ? t.toolbar.running : t.toolbar.run, "run")}
            onPointerEnter={preloadRunRuntime}
            onFocus={preloadRunRuntime}
            onClick={handleRun}
            disabled={isRunning || !currentDocument}
          >
            {isRunning ? (
              <LoaderCircle size={13} className="animate-spin" aria-hidden />
            ) : (
              <Play size={12} fill="currentColor" aria-hidden />
            )}
            <span className="max-[700px]:hidden">{isRunning ? t.toolbar.running : t.toolbar.run}</span>
          </button>
          {renderAccountControl()}
        </div>
      </header>

      {/* ════════════ Notice Bar ════════════ */}
      {(saveError || appNotice || syncNotice || showAuthUnavailableNotice) && (
        <div className="shrink-0 border-b border-[var(--separator)] bg-[var(--surface)] px-4 py-1.5">
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {renderSyncNotice()}
            {saveError && syncNotice !== "account-unreachable" && <span className="text-[var(--red)]">{localizedSaveError}</span>}
            {appNotice && (
              <div className="flex items-center gap-3">
                <span
                  className={
                    appNotice.tone === "error" ? "text-[var(--red)]" : "text-[var(--text2)]"
                  }
                >
                  {appNotice.message}
                </span>
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary h-6 px-2 text-xs"
                  onClick={dismissNotice}
                >
                {t.common.dismiss}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ Body ════════════ */}
      <div className="flex min-h-0 flex-1">
        {/* ──── Sidebar ──── */}
        {showExplorer ? (
        <>
        <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
          <WorkspaceSidebar
            workspace={workspace}
            onSelectDocument={selectDocument}
            onToggleFolder={toggleFolder}
            onExpandFolder={expandFolder}
            onCreateFolder={createFolderInWorkspace}
            onCreateDocument={handleCreateDocumentFromSidebar}
            onRenameNode={handleRenameNode}
            onDeleteNodes={handleDeleteNodes}
            onMoveNodes={moveNodesInWorkspace}
          />
        </div>

        {/* ──── Sidebar Resize Handle ──── */}
        <div
          role="separator"
          aria-label={t.terminal.resizeSidebar}
          aria-orientation="vertical"
          tabIndex={0}
          // A 1px divider with an invisible 7px grab area, so no gutter shows between the panes.
          className="relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-[var(--separator)] transition-colors delay-100 before:absolute before:inset-y-0 before:-left-[3px] before:-right-[3px] before:content-[''] hover:bg-[var(--accent)] active:bg-[var(--accent)] focus-visible:bg-[var(--accent)] focus-visible:outline-none"
          onPointerDown={handleSidebarResize}
          onKeyDown={handleSidebarResizeKeyDown}
        />
        </>
        ) : null}

        {/* ──── Editor Area ──── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {flowchartMounted ? (
              <div
                inert={!flowchartVisible}
                className={`absolute inset-0 z-20 min-h-0 min-w-0 transition-transform duration-200 ease-out ${
                  flowchartVisible ? "translate-x-0" : "translate-x-full pointer-events-none"
                }`}
              >
                <FlowchartEditor
                  source={flowchartSource}
                  isVisible={flowchartVisible}
                  syntaxId={syntaxId}
                  runTrace={lastRunTrace?.documentId === currentDocument?.id ? lastRunTrace : null}
                  onCodeChange={handleFlowchartCodeChange}
                  onGenerateCode={handleGenerateCode}
                />
              </div>
            ) : null}

            {/* Code View */}
            <div
              inert={flowchartVisible}
              className={`absolute inset-0 flex min-h-0 min-w-0 flex-col transition-transform duration-200 ease-out ${
                flowchartVisible ? "-translate-x-full pointer-events-none" : "translate-x-0"
              }`}
            >
              {/* Tab Bar */}
              {editorPanel && editorPanel.openDocumentIds.length > 0 && (
                <div
                  role="tablist"
                  aria-label={t.toolbar.editor}
                  className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-[var(--separator)] bg-[var(--sidebar)] [scrollbar-width:none]"
                  onKeyDown={handleTabListKeyDown}
                >
                  {editorPanel.openDocumentIds.map((documentId, index) => {
                    const doc = workspace.nodes[documentId];
                    if (!doc || doc.type !== "document") return null;
                    const isActive = documentId === editorPanel.activeDocumentId;
                    return (
                      <div
                        key={documentId}
                        draggable
                        role="presentation"
                        // Flat IDE tabs: the active one takes the editor's background, covers the strip's bottom
                        // border so it joins the code below, and carries the accent line on top.
                        className={`group relative -mb-px flex shrink-0 items-center gap-1 border-r border-[var(--separator)] pr-1.5 text-[13px] transition-colors ${
                          isActive
                            ? "bg-[var(--bg)] text-[var(--text)] shadow-[inset_0_2px_0_var(--accent)]"
                            : "text-[var(--text3)] hover:bg-[var(--hover)] hover:text-[var(--text2)]"
                        }`}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData(
                            "application/x-editor-tab",
                            JSON.stringify({ panelId: editorPanel.id, documentId }),
                          );
                          event.dataTransfer.setData("text/plain", doc.name);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleTabDrop(event, index)}
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          tabIndex={isActive ? 0 : -1}
                          data-document-id={documentId}
                          title={getNodePath(workspace, documentId).filter((node) => node.parentId !== null).map((node) => node.name).join(" / ")}
                          className="flex h-full min-w-0 max-w-[220px] items-center gap-1.5 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
                          onClick={() => setEditorActiveDocument(editorPanel.id, documentId)}
                          onAuxClick={(event) => {
                            if (event.button === 1 && editorPanel.openDocumentIds.length > 1) {
                              closeTabSelectingNeighbour(documentId);
                              focusEditorWhenReady();
                            }
                          }}
                        >
                          <FileCode size={14} aria-hidden className={isActive ? "text-[var(--accent)]" : "text-[var(--text3)]"} />
                          <span className="truncate">{doc.name}</span>
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          hidden={editorPanel.openDocumentIds.length === 1}
                          className={`flex h-5 w-5 items-center justify-center rounded-[4px] text-[var(--text3)] hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                          aria-label={t.files.closeDocument(doc.name)}
                          onClick={(event) => {
                            event.stopPropagation();
                            closeTabSelectingNeighbour(documentId);
                            focusEditorWhenReady();
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {/* Drop target at end of tab bar */}
                  <div
                    className="min-w-[32px] flex-1"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleTabDrop(event, editorPanel.openDocumentIds.length)}
                  />
                </div>
              )}

              {/* Breadcrumb: only when the file sits in a folder; a top-level path would just repeat the tab. */}
              {breadcrumbs.filter((node) => node.parentId !== null).length > 1 ? (
                <div className="flex h-6 shrink-0 items-center px-4">
                  <Breadcrumbs path={breadcrumbs} />
                </div>
              ) : null}
              {practiceBanner}

              {/* Editor Content */}
              <div className="min-h-0 flex-1">
                {editorActiveDoc ? (
                  <MonacoPseudocodeEditor
                    documentKey={editorActiveDoc.id}
                    value={editorActiveDoc.source}
                    onChange={handleEditorSourceChange}
                    diagnostics={
                      activeDocument?.id === editorActiveDoc.id ? compileDiagnostics : EMPTY_DIAGNOSTICS
                    }
                    theme={resolvedTheme}
                    syntaxId={syntaxId}
                    colorScheme={syntaxColorScheme}
                    commands={workspaceCommands}
                    apiRef={editorApiRef}
                  />
                ) : (
                  renderStarterPanel()
                )}
              </div>
            </div>
          </div>

          {/* Terminal Resize Handle */}
          {showTerminal && (
            <div
              role="separator"
              aria-label={t.terminal.resizeTerminal}
              aria-orientation="horizontal"
              tabIndex={0}
              className="relative z-10 h-px shrink-0 cursor-row-resize touch-none bg-[var(--separator)] transition-colors delay-100 before:absolute before:inset-x-0 before:-top-[3px] before:-bottom-[3px] before:content-[''] hover:bg-[var(--accent)] active:bg-[var(--accent)] focus-visible:bg-[var(--accent)] focus-visible:outline-none"
              onPointerDown={handleTerminalResize}
              onKeyDown={handleTerminalResizeKeyDown}
            />
          )}

          {/* Terminal Panel */}
          {showTerminal && (
            <div
              className="flex shrink-0 flex-col overflow-hidden bg-[var(--sidebar)]"
              style={{
                height: clampNumber(
                  terminalHeight,
                  MIN_TERMINAL_HEIGHT,
                  maxTerminalHeight,
                ),
              }}
            >
              {/* Panel Header: Output | Problems */}
              <div className="flex h-9 shrink-0 items-center gap-1 pl-3 pr-1.5">
                {renderPanelTabs(panelView, setPanelView)}
                <div className="flex-1" />
                {panelView === "output" ? (
                  <button
                    type="button"
                    className="ui-icon-btn h-6 w-6"
                    aria-label={t.terminal.clearOutput}
                    title={t.terminal.clearOutput}
                    onClick={handleClearTerminal}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ui-icon-btn h-6 w-6"
                  aria-label={t.workbench.hidePanel}
                  title={tip(t.workbench.hidePanel, "togglePanel")}
                  onClick={() => setShowTerminal(false)}
                >
                  <X size={14} />
                </button>
              </div>

              {panelView === "problems" ? (
                <div
                  id="panel-view-problems"
                  role="tabpanel"
                  aria-label={t.workbench.problems}
                  className="min-h-0 flex-1 overflow-auto overscroll-contain"
                >
                  <ProblemsList diagnostics={compileDiagnostics} onSelect={revealDiagnostic} />
                </div>
              ) : (
              <>
              {/* Output Content */}
              <div
                ref={desktopTerminalScrollRef}
                data-testid="terminal-scroll-region"
                role="log"
                aria-live="polite"
                aria-label={t.terminal.terminal}
                tabIndex={0}
                onScroll={handleOutputScroll}
                className="min-h-0 flex-1 overflow-auto overscroll-contain px-3 py-2 touch-pan-y"
              >
                <pre className="min-w-full whitespace-pre-wrap break-words font-mono text-xs leading-5">
                  {terminalOutput ? (
                    <span className="text-[var(--text2)]">{terminalOutput}</span>
                  ) : lastRunError ? null : (
                    <span className="text-[var(--text3)]">{t.terminal.ready}</span>
                  )}
                </pre>
                {renderRunErrorRow()}
              </div>

              {/* Pending Input */}
              {pendingInput.panelId === terminalPanelId && pendingInput.prompt && (
                <form
                  className="shrink-0 border-t border-[var(--separator)] px-3 py-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitPendingInput();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span id="terminal-input-prompt" className="font-mono text-xs text-[var(--green)]">
                      {pendingInput.prompt}
                    </span>
                    <input
                      value={pendingInput.text}
                      onChange={(event) => setPendingInputText(event.target.value)}
                      autoFocus
                      aria-label={t.terminal.input}
                      aria-describedby="terminal-input-prompt"
                      className="ui-input h-8 flex-1 font-mono text-[12.5px]"
                      placeholder={t.terminal.inputPlaceholder}
                    />
                    <button
                      type="submit"
                      className="ui-btn ui-btn-primary h-8"
                    >
                      {t.terminal.send}
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost h-8"
                      onClick={cancelPendingInput}
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </form>
              )}

              {/* Running indicator */}
              {isRunning &&
                runningTerminalPanelId === terminalPanelId &&
                !(pendingInput.panelId === terminalPanelId && pendingInput.prompt) && (
                  <div className="shrink-0 border-t border-[var(--separator)] px-3 py-1.5">
                    <p className="text-[11px] text-[var(--green)]">{t.terminal.running}</p>
                  </div>
                )}
              </>
              )}
            </div>
          )}
        </div>
      </div>

      <StatusBar
        errors={problemCounts.errors}
        warnings={problemCounts.warnings}
        onShowProblems={showProblems}
        problemsShortcut={shortcutHint("problems")}
        syntaxLabel={currentSyntax.label}
        onChangeSyntax={() => setShowSettingsPanel(true)}
        saveState={saveIndicatorState}
        onSave={handleSaveWorkspace}
        saveShortcut={shortcutHint("save")}
        showCursor={Boolean(editorActiveDoc) && !flowchartVisible}
        onGoToLine={() => editorApiRef.current?.goToLine()}
      />

      {renderSettingsDialog()}
      {renderRenameDialog()}
      {renderDeleteDialog()}
      {renderSignInPromptDialog()}
      {renderCreateFileDialog()}
      {renderFlowchartPromptDialog()}
      {renderDocsDialog()}
    </main>
  );
}
