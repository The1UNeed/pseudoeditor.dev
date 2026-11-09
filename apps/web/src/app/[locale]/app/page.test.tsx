import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createContext, useState } from "react";
import { createDefaultWorkspace, createDocument, createEmptyWorkspace, createFolder, getChildNodes, setActiveDocument, type WorkspaceState } from "@pseudoeditor/workspace";
import type { WorkspacePersistenceMode } from "@/lib/platform";

const { loadWorkspaceMock, saveWorkspaceMock, compilePseudocodeMock, runMock, editorRenderMock, authState } = vi.hoisted(() => ({
  loadWorkspaceMock: vi.fn<(_sampleSource: string, options?: { mode?: WorkspacePersistenceMode }) => Promise<WorkspaceState>>(),
  saveWorkspaceMock: vi.fn<(state: WorkspaceState, options?: { mode?: WorkspacePersistenceMode }) => Promise<void>>(),
  compilePseudocodeMock: vi.fn(),
  runMock: vi.fn(),
  editorRenderMock: vi.fn(),
  authState: {
    user: null as null | {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
    },
    loading: false,
    // Whether the browser holds a Clerk session cookie (see mayHaveClerkSession).
    sessionHint: true,
    // Clerk's script failed to load (see useAuthUnavailable).
    unavailable: false,
  },
}));
const localStore = new Map<string, string>();
const UserButtonContext = createContext({ openSettings: () => {} });
const UserButtonProfilePageContext = createContext(false);

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-components", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  Show: ({ children, when }: { children: React.ReactNode; when: "signed-in" | "signed-out" }) => {
    const signedIn = Boolean(authState.user);
    return (when === "signed-in" && signedIn) || (when === "signed-out" && !signedIn)
      ? children
      : null;
  },
  isCloudAuthConfigured: () => true,
  mayHaveClerkSession: () => authState.sessionHint,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: Object.assign(
    ({ children }: { children?: React.ReactNode }) => {
      const [settingsOpen, setSettingsOpen] = useState(false);

      return (
        <UserButtonContext.Provider value={{ openSettings: () => setSettingsOpen(true) }}>
          <UserButtonProfilePageContext.Provider value={false}>
            <button type="button" aria-label="User profile" />
            {children}
          </UserButtonProfilePageContext.Provider>
          {settingsOpen ? (
            <div role="dialog" aria-label="Settings">
              <UserButtonProfilePageContext.Provider value={true}>
                {children}
              </UserButtonProfilePageContext.Provider>
            </div>
          ) : null}
        </UserButtonContext.Provider>
      );
    },
    {
      Action: ({
        label,
        labelIcon,
        onClick,
      }: {
        label: string;
        labelIcon?: React.ReactNode;
        onClick?: () => void;
      }) =>
        label === "manageAccount" ? (
          <UserButtonContext.Consumer>
            {({ openSettings }) => (
              <button type="button" onClick={openSettings}>
                Settings
              </button>
            )}
          </UserButtonContext.Consumer>
        ) : onClick ? (
          <button type="button" onClick={onClick}>
            {labelIcon}
            {label}
          </button>
        ) : null,
      MenuItems: ({ children }: { children: React.ReactNode }) => (
        <UserButtonProfilePageContext.Consumer>
          {(renderProfilePage) => (renderProfilePage ? null : <>{children}</>)}
        </UserButtonProfilePageContext.Consumer>
      ),
      UserProfilePage: ({ children }: { children: React.ReactNode }) => (
        <UserButtonProfilePageContext.Consumer>
          {(renderProfilePage) => (renderProfilePage ? <>{children}</> : null)}
        </UserButtonProfilePageContext.Consumer>
      ),
    },
  ),
  useAuth: () => ({
    getToken: async () => "session-token",
    isLoaded: !authState.loading,
    isSignedIn: Boolean(authState.user),
    userId: authState.user?.id ?? null,
  }),
  useAuthUnavailable: () => authState.unavailable,
}));

vi.mock("@/lib/storage", () => ({
  loadWorkspace: loadWorkspaceMock,
  saveWorkspace: saveWorkspaceMock,
  saveDeviceCheckpoint: vi.fn(async () => {}),
  takeAccountSyncPending: vi.fn(() => false),
  takeRecoveredCopies: vi.fn(() => false),
  isAccountUnreachable: vi.fn(() => false),
}));

/** Makes loadWorkspace resolve to `workspace`. */
function mockLoadedWorkspace(workspace: WorkspaceState) {
  loadWorkspaceMock.mockResolvedValue(workspace);
}

/** The workspace most recently written to this device's storage. */
function lastLocallySavedWorkspace(): WorkspaceState {
  const workspace = saveWorkspaceMock.mock.lastCall?.[0];
  if (!workspace) {
    throw new Error("Nothing was written locally yet.");
  }
  return workspace;
}

vi.mock("@/compiler", () => ({
  compilePseudocode: compilePseudocodeMock,
}));

vi.mock("@/runtime/executeRuntime", () => ({
  pseudocodeRuntimeRunner: {
    run: runMock,
  },
}));

vi.mock("@/app/components/MonacoPseudocodeEditor", async () => {
  const { memo } = await import("react");
  return {
    MonacoPseudocodeEditor: memo(function MockEditor({
      value,
      onChange,
      colorScheme,
    }: {
      value: string;
      onChange: (value: string) => void;
      colorScheme?: string;
    }) {
      editorRenderMock();
      return (
        <textarea
          aria-label="Mock editor"
          data-color-scheme={colorScheme}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }),
  };
});

vi.mock("@/app/components/flowchart/FlowchartEditor", () => ({
  default: ({
    source,
    onCodeChange,
    onGenerateCode,
  }: {
    source?: string;
    onCodeChange?: (code: string) => void;
    onGenerateCode?: (code: string) => void;
  }) => (
    <div>
      <output aria-label="Mock flowchart source">{source ?? ""}</output>
      <button type="button" onClick={() => onCodeChange?.('OUTPUT "Live from blocks"')}>
        Mock Live Flowchart
      </button>
      <button type="button" onClick={() => onGenerateCode?.('OUTPUT "Generated from blocks"')}>
        Mock Generate Flowchart
      </button>
    </div>
  ),
}));

import HomePage from "@/app/[locale]/app/page";

// jsdom has HTMLDialogElement but no showModal().
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}

function createWorkspaceFixture(activeDocumentId = "doc-main") {
  let workspace = createDefaultWorkspace({
    sampleSource: 'OUTPUT "Main"',
    now: "2026-03-15T00:00:00.000Z",
  });
  workspace = createDocument(workspace, {
    parentId: workspace.rootFolderId,
    name: "Helper",
    source: 'OUTPUT "Helper"',
    id: "doc-helper",
    now: "2026-03-15T00:01:00.000Z",
  });
  return setActiveDocument(workspace, activeDocumentId);
}

function setDesktopRuntime() {
  Object.defineProperty(window as Window & { electron?: { isDesktop?: boolean } }, "electron", {
    configurable: true,
    value: { isDesktop: true },
  });
}

function setDeployedBrowserRuntime() {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://pseudocode-compiler-preview.vercel.app/"),
  });
}

function setLocalBrowserRuntime() {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("http://localhost:3000/"),
  });
}

function createDataTransferMock() {
  const store = new Map<string, string>();

  return {
    effectAllowed: "all",
    dropEffect: "move",
    setData: (type: string, value: string) => {
      store.set(type, value);
    },
    getData: (type: string) => store.get(type) ?? "",
  };
}

function mockRowRect(element: Element, top = 0, height = 40) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: top,
      top,
      left: 0,
      bottom: top + height,
      right: 320,
      width: 320,
      height,
      toJSON: () => "",
    }),
  });
}

function getExplorerButton(name: string): HTMLElement {
  const match = screen
    .getAllByRole("button", { name })
    .find((button) => button.closest('[data-workspace-row="true"]'));
  if (!match) {
    throw new Error(`Explorer button "${name}" not found.`);
  }
  return match;
}

function getExplorerRow(name: string): HTMLElement {
  const row = getExplorerButton(name).closest('[data-workspace-row="true"]');
  if (!row) {
    throw new Error(`Explorer row "${name}" not found.`);
  }
  return row as HTMLElement;
}

function getExplorerHeaderButton(name: string): HTMLElement {
  const match = screen
    .getAllByRole("button", { name })
    .find((button) => !button.closest('[data-workspace-row="true"]'));
  if (!match) {
    throw new Error(`Explorer header button "${name}" not found.`);
  }
  return match;
}

describe("HomePage workspace flow", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    setDeployedBrowserRuntime();
    loadWorkspaceMock.mockReset();
    saveWorkspaceMock.mockReset();
    saveWorkspaceMock.mockResolvedValue();
    compilePseudocodeMock.mockReset();
    runMock.mockReset();
    editorRenderMock.mockClear();
    authState.user = {
      id: "user_123",
      email: "alex@example.com",
      firstName: "Alex",
      lastName: null,
    };
    authState.loading = false;
    authState.sessionHint = true;
    authState.unavailable = false;
    Object.defineProperty(window as Window & { electron?: { isDesktop?: boolean } }, "electron", {
      configurable: true,
      value: undefined,
    });
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
  });

  it("opens a practice starter file from the query string", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://pseudocode-compiler-preview.vercel.app/app?practice=pass-or-fail"),
    });
    mockLoadedWorkspace(createEmptyWorkspace("2026-03-15T00:00:00.000Z"));
    render(<HomePage />);

    await waitFor(() => expect(getExplorerButton("practice.q.pass-or-fail.pseudo")).toBeInTheDocument());
    // The editor mounts after the explorer updates, so wait for it instead of reading it synchronously.
    const editor = (await screen.findByRole("textbox", { name: "Mock editor" })) as HTMLTextAreaElement;
    await waitFor(() => expect(editor.value).toContain("DECLARE Mark : INTEGER"));
    expect(screen.getByText("Pass or fail from a mark")).toBeInTheDocument();
  });

  it("opens documents and updates the editor content", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    expect(await screen.findByRole("textbox", { name: "Mock editor" })).toHaveValue('OUTPUT "Main"');

    fireEvent.click(getExplorerButton("Helper.pseudo"));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Mock editor" })).toHaveValue('OUTPUT "Helper"');
    });
  });

  it("opens the docs inside the workspace and remembers the last guide", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    const editor = await screen.findByRole("textbox", { name: "Mock editor" });
    fireEvent.click(screen.getByRole("button", { name: "Docs" }));

    let docsDialog = await screen.findByRole("dialog", { name: "Docs" });
    expect(await within(docsDialog).findByRole("heading", { level: 1, name: "Pseudocode syntax reference" })).toBeInTheDocument();

    fireEvent.click(within(docsDialog).getByRole("button", { name: "Choosing a loop" }));
    expect(within(docsDialog).getByRole("heading", { level: 1, name: "Choosing a loop" })).toBeInTheDocument();
    expect(within(docsDialog).getByRole("link", { name: "Open in a new tab" })).toHaveAttribute("href", "/docs/choosing-a-loop");

    fireEvent.click(within(docsDialog).getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Docs" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Docs" }));
    docsDialog = await screen.findByRole("dialog", { name: "Docs" });
    expect(await within(docsDialog).findByRole("heading", { level: 1, name: "Choosing a loop" })).toBeInTheDocument();
    expect(editor).toHaveValue('OUTPUT "Main"');
  });

  it("uses the shared create file dialog from the sidebar while keeping the pseudo extension fixed", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.click(getExplorerHeaderButton("New file"));
    const createDialog = await screen.findByRole("dialog", { name: "New file" });

    const nameInput = within(createDialog).getByLabelText("File name");
    expect(nameInput).toHaveValue("Untitled");
    expect(within(createDialog).getByText(".pseudo")).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Renamed Doc.pseudo" } });
    expect(nameInput).toHaveValue("Renamed Doc");
    fireEvent.click(within(createDialog).getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(getExplorerButton("Renamed Doc.pseudo")).toBeInTheDocument();
    });
    await waitFor(() => {
      const names = Object.values(lastLocallySavedWorkspace().nodes).map((node) => node.name);
      expect(names).toContain("Renamed Doc.pseudo");
    });
  });

  it("creates the first desktop file from the starter dialog and opens the editor", async () => {
    setDesktopRuntime();
    mockLoadedWorkspace(createEmptyWorkspace("2026-03-15T00:00:00.000Z"));
    render(<HomePage />);

    expect(await screen.findByText("Start writing pseudocode")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByText("Start writing pseudocode").closest("section") as HTMLElement).getByRole("button", {
        name: "New file",
      }),
    );
    const dialog = await screen.findByRole("dialog", { name: "New file" });
    fireEvent.change(within(dialog).getByLabelText("File name"), {
      target: { value: "main.pseudo" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Mock editor" })).toHaveValue("");
    });
  });

  it("live updates the editor when flowchart code changes", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    expect(await screen.findByRole("textbox", { name: "Mock editor" })).toHaveValue('OUTPUT "Main"');

    fireEvent.click(screen.getByRole("button", { name: "Switch to flowchart view" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mock Live Flowchart" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Mock editor", hidden: true })).toHaveValue(
        'OUTPUT "Live from blocks"',
      );
    });
  });

  it("keeps the flowchart connected to the current pseudocode source", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    const editor = await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.click(screen.getByRole("button", { name: "Switch to flowchart view" }));
    expect(await screen.findByLabelText("Mock flowchart source")).toHaveTextContent('OUTPUT "Main"');

    fireEvent.change(editor, { target: { value: 'OUTPUT "Updated from editor"' } });

    await waitFor(() => {
      expect(screen.getByLabelText("Mock flowchart source")).toHaveTextContent(
        'OUTPUT "Updated from editor"',
      );
    });
  });

  it("keeps the flowchart visible while terminal output appears underneath", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    compilePseudocodeMock.mockReturnValue({
      success: true,
      diagnostics: [],
      astJson: "{}",
    });
    runMock.mockResolvedValue({
      success: true,
      stdout: "Hello from flowchart",
      stderr: "",
      diagnostics: [],
      virtualFiles: {},
    });

    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.click(screen.getByRole("button", { name: "Switch to flowchart view" }));
    expect(await screen.findByLabelText("Mock flowchart source")).toHaveTextContent('OUTPUT "Main"');

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Mock flowchart source")).toBeInTheDocument();
      expect(screen.getByText(/Hello from flowchart/)).toBeInTheDocument();
    });
  });

  it("runs the source typed just before Run is tapped", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    compilePseudocodeMock.mockReturnValue({ success: true, diagnostics: [], astJson: "{}" });
    runMock.mockResolvedValue({ success: true, stdout: "done", stderr: "", diagnostics: [], virtualFiles: {} });
    render(<HomePage />);
    const editor = await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.change(editor, { target: { value: 'OUTPUT "Typed just now"' } });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    // Run starts after the next paint, with the latest source.
    await waitFor(() => {
      expect(compilePseudocodeMock).toHaveBeenCalledWith(expect.objectContaining({ source: 'OUTPUT "Typed just now"' }));
    });
  });

  it("waits for Clerk before loading the workspace when a session cookie is present", async () => {
    authState.user = null;
    authState.loading = true;
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    expect(screen.getByRole("status", { name: "Loading workspace…" })).toBeInTheDocument();
    expect(screen.getByText("PseudoEditor")).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(loadWorkspaceMock).not.toHaveBeenCalled();
  });

  it("opens the in-memory workspace without waiting for Clerk when nobody is signed in", async () => {
    authState.user = null;
    authState.loading = true;
    authState.sessionHint = false;
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(loadWorkspaceMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ mode: "memory" }));
    // The account control stays a placeholder until Clerk has loaded.
    expect(screen.getByRole("button", { name: "Checking sign-in status" })).toBeDisabled();
  });

  it("stops waiting for Clerk and opens the in-memory workspace when Clerk fails to load", async () => {
    authState.user = null;
    authState.loading = true;
    authState.unavailable = true;
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(loadWorkspaceMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ mode: "memory" }));
    expect(screen.getAllByText(/Couldn't load sign-in/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Sign-in unavailable" })[0]).toBeDisabled();
    // Save can't ask for a sign-in that can't load; the notice already explains why nothing is saved.
    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole("dialog", { name: "Sign in to save" })).not.toBeInTheDocument();
    expect(saveWorkspaceMock).not.toHaveBeenCalled();
  });

  it("asks before Retry reloads away edits made while Clerk is unavailable", async () => {
    authState.user = null;
    authState.loading = true;
    authState.unavailable = true;
    mockLoadedWorkspace(createWorkspaceFixture());
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: Object.assign(new URL("https://pseudocode-compiler-preview.vercel.app/"), { reload }),
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    try {
      render(<HomePage />);
      const editor = await screen.findByRole("textbox", { name: "Mock editor" });
      const [retry] = screen.getAllByRole("button", { name: "Retry" });

      fireEvent.click(retry);
      expect(confirm).not.toHaveBeenCalled();
      expect(reload).toHaveBeenCalledTimes(1);

      fireEvent.change(editor, { target: { value: 'OUTPUT "Changed"' } });
      fireEvent.click(retry);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(reload).toHaveBeenCalledTimes(1);

      // Once the user agrees, the browser's own leave warning does not ask again.
      confirm.mockReturnValue(true);
      fireEvent.click(retry);
      expect(reload).toHaveBeenCalledTimes(2);
      const unload = new Event("beforeunload", { cancelable: true });
      expect(window.dispatchEvent(unload)).toBe(true);
    } finally {
      confirm.mockRestore();
    }
  });

  it("does not show the sign-in notice to guests when Clerk is unavailable", async () => {
    authState.user = null;
    authState.loading = true;
    authState.sessionHint = false;
    authState.unavailable = true;
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(screen.queryByText(/Couldn't load sign-in/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign-in unavailable" })[0]).toBeDisabled();
  });

  it("offers the flowchart from the toolbar without a beta setting, loading it on first open", async () => {
    authState.user = null;
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });

    expect(screen.getByRole("button", { name: "Switch to flowchart view" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Mock flowchart source")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(within(dialog).queryByText("Beta features")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("switch")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Switch to flowchart view" }));
    expect(await screen.findByLabelText("Mock flowchart source")).toHaveTextContent('OUTPUT "Main"');
  });

  it("lets the user pick an exam syntax from settings", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    const syntaxSelect = within(dialog).getByLabelText("Exam syntax");
    expect(syntaxSelect).toHaveValue("cambridge-igcse");

    fireEvent.change(syntaxSelect, { target: { value: "ib-dp" } });

    await waitFor(() => {
      expect(lastLocallySavedWorkspace().syntaxId).toBe("ib-dp");
    });
  });

  it("lets the user pick syntax colours from settings and remembers them", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    const { unmount } = render(<HomePage />);
    const editor = await screen.findByRole("textbox", { name: "Mock editor" });
    expect(editor).toHaveAttribute("data-color-scheme", "pseudoeditor");

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    const picker = within(dialog).getByRole("radiogroup", { name: "Syntax colours" });
    expect(within(picker).getAllByRole("radio")).toHaveLength(7);
    expect(within(picker).getByRole("radio", { name: "PseudoEditor" })).toBeChecked();

    fireEvent.click(within(picker).getByRole("radio", { name: "Ocean" }));

    expect(within(picker).getByRole("radio", { name: "Ocean" })).toBeChecked();
    expect(editor).toHaveAttribute("data-color-scheme", "ocean");
    expect(localStore.get("pseudoeditor-syntax-color-scheme")).toBe("ocean");

    unmount();
    render(<HomePage />);
    expect(await screen.findByRole("textbox", { name: "Mock editor" })).toHaveAttribute(
      "data-color-scheme",
      "ocean",
    );
  });

  it("reorders documents through workspace controls", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.contextMenu(getExplorerButton("Helper.pseudo"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Move up" }));

    await waitFor(() => {
      const savedState = lastLocallySavedWorkspace();
      const order = getChildNodes(savedState, savedState.rootFolderId).map((node) => node.name);
      expect(order.slice(0, 2)).toEqual(["Helper.pseudo", "main.pseudo"]);
    });
  });

  it("opens explorer actions from a touch long press", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const helperRow = getExplorerRow("Helper.pseudo");

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(helperRow, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 96,
        clientY: 148,
      });

      await act(async () => {
        vi.advanceTimersByTime(430);
      });

      fireEvent.pointerUp(helperRow, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 96,
        clientY: 148,
      });

      expect(screen.getByRole("menu", { name: "Explorer actions" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("deletes the selected item from the explorer context menu", async () => {
    let workspace = createWorkspaceFixture();
    workspace = createDocument(workspace, {
      parentId: workspace.rootFolderId,
      name: "Third",
      source: 'OUTPUT "Third"',
      id: "doc-third",
      now: "2026-03-15T00:02:00.000Z",
    });
    mockLoadedWorkspace(workspace);
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    fireEvent.contextMenu(getExplorerButton("Helper.pseudo"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: 'Delete "Helper.pseudo"?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      const savedState = lastLocallySavedWorkspace();
      expect(Object.values(savedState.nodes).filter((node) => node.type === "document")).toHaveLength(2);
      expect(savedState.nodes["doc-helper"]).toBeUndefined();
      expect(savedState.nodes["doc-third"]).toBeDefined();
    });
  });

  it("closes the delete dialog with Escape and returns focus to the explorer row", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const helperRow = getExplorerButton("Helper.pseudo");
    act(() => helperRow.focus());
    fireEvent.click(helperRow);
    fireEvent.keyDown(helperRow, { key: "Delete" });

    const dialog = await screen.findByRole("dialog", { name: 'Delete "Helper.pseudo"?' });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("tree", { name: "Explorer" })).toHaveFocus();
    expect(getExplorerRow("Helper.pseudo")).toBeInTheDocument();
  });

  it("closes the rename dialog with Escape after opening it from the context menu", async () => {
    mockLoadedWorkspace(createWorkspaceFixture());
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const helperRow = getExplorerButton("Helper.pseudo");
    fireEvent.contextMenu(helperRow);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));

    const dialog = await screen.findByRole("dialog", { name: "Rename" });
    const nameInput = within(dialog).getByRole("textbox", { name: "Name" });
    expect(nameInput).toHaveFocus();

    fireEvent.keyDown(nameInput, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("tree", { name: "Explorer" })).toHaveFocus();
  });

  it("uses the phone layout on narrow windows regardless of user agent and hides the flowchart switch", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    mockLoadedWorkspace(createWorkspaceFixture());

    try {
      render(<HomePage />);
      await screen.findByRole("textbox", { name: "Mock editor" });

      fireEvent.click(within(screen.getByRole("navigation", { name: "Workspace sections" })).getByRole("button", { name: "Settings" }));
      expect(screen.getByText("Theme")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Switch to flowchart view" })).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("drags a file into a folder", async () => {
    let workspace = createWorkspaceFixture();
    workspace = createFolder(workspace, {
      parentId: workspace.rootFolderId,
      name: "Archive",
      id: "folder-archive",
      now: "2026-03-15T00:02:00.000Z",
    });
    mockLoadedWorkspace(workspace);
    const { container } = render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const fileRow = getExplorerRow("main.pseudo");
    const folderRow = getExplorerRow("Archive");

    mockRowRect(folderRow, 0, 40);
    const dataTransfer = createDataTransferMock();

    fireEvent.dragStart(fileRow, { dataTransfer });
    fireEvent.dragOver(folderRow, { dataTransfer, clientY: 20 });
    fireEvent.drop(folderRow, { dataTransfer, clientY: 20 });

    await waitFor(() => {
      const savedState = lastLocallySavedWorkspace();
      expect(savedState.nodes["doc-main"].parentId).toBe("folder-archive");
    });

    container.remove();
  });

  it("drags a folder into another folder", async () => {
    let workspace = createWorkspaceFixture();
    workspace = createFolder(workspace, {
      parentId: workspace.rootFolderId,
      name: "Source",
      id: "folder-source",
      now: "2026-03-15T00:02:00.000Z",
    });
    workspace = createFolder(workspace, {
      parentId: workspace.rootFolderId,
      name: "Target",
      id: "folder-target",
      now: "2026-03-15T00:03:00.000Z",
    });
    mockLoadedWorkspace(workspace);
    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const sourceRow = getExplorerRow("Source");
    const targetRow = getExplorerRow("Target");

    mockRowRect(targetRow, 0, 40);
    const dataTransfer = createDataTransferMock();

    fireEvent.dragStart(sourceRow, { dataTransfer });
    fireEvent.dragOver(targetRow, { dataTransfer, clientY: 20 });
    fireEvent.drop(targetRow, { dataTransfer, clientY: 20 });

    await waitFor(() => {
      const savedState = lastLocallySavedWorkspace();
      expect(savedState.nodes["folder-source"].parentId).toBe("folder-target");
    });
  });

  it("compiles and runs the active document and clears pending input on switch", async () => {
    const workspace = createWorkspaceFixture("doc-helper");
    mockLoadedWorkspace(workspace);
    compilePseudocodeMock.mockReturnValue({
      success: true,
      diagnostics: [],
      astJson: "{}",
    });
    runMock.mockResolvedValue({
      success: false,
      stdout: "",
      stderr: "INPUT requested but no stdin lines remain",
      diagnostics: [],
      virtualFiles: {},
    });

    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Mock editor" })).toHaveValue('OUTPUT "Helper"');
    });

    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    await waitFor(() => expect(compilePseudocodeMock).toHaveBeenLastCalledWith({
      source: 'OUTPUT "Helper"',
      filename: "Helper.pseudo",
      strict: true,
      syntaxId: "cambridge-igcse",
    }));

    expect(await screen.findByLabelText("Terminal input")).toBeInTheDocument();
    editorRenderMock.mockClear();
    for (let index = 0; index < 100; index += 1) {
      fireEvent.change(screen.getByLabelText("Terminal input"), {
        target: { value: `answer ${index}` },
      });
    }
    expect(editorRenderMock.mock.calls.length).toBe(0);

    fireEvent.click(getExplorerButton("main.pseudo"));
    await waitFor(() => {
      expect(screen.queryByLabelText("Terminal input")).not.toBeInTheDocument();
    });
  });

  it("lets the terminal scroll region keep its position when the user scrolls away from the bottom", async () => {
    mockLoadedWorkspace(createWorkspaceFixture("doc-helper"));
    compilePseudocodeMock.mockReturnValue({
      success: true,
      diagnostics: [],
      astJson: "{}",
    });
    runMock
      .mockResolvedValueOnce({
        success: false,
        stdout: "Line 1\nLine 2\nLine 3",
        stderr: "INPUT requested but no stdin lines remain",
        diagnostics: [],
        virtualFiles: {},
      })
      .mockResolvedValueOnce({
        success: true,
        stdout: "Line 1\nLine 2\nLine 3\nLine 4",
        stderr: "",
        diagnostics: [],
        virtualFiles: {},
      });

    render(<HomePage />);
    await screen.findByRole("textbox", { name: "Mock editor" });

    const scrollRegion = screen.getByTestId("terminal-scroll-region");
    let scrollTop = 0;

    Object.defineProperty(scrollRegion, "scrollHeight", {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(scrollRegion, "clientHeight", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(scrollRegion, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(await screen.findByLabelText("Terminal input")).toBeInTheDocument();
    await waitFor(() => {
      expect(scrollTop).toBe(400);
    });

    act(() => {
      scrollTop = 40;
      fireEvent.scroll(scrollRegion);
    });

    fireEvent.change(screen.getByLabelText("Terminal input"), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(runMock).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/\bLine 4\b/)).toBeInTheDocument();
    });

    expect(scrollTop).toBe(40);
  });

  it("warns before refresh only while workspace changes are pending save", async () => {
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    const editor = await screen.findByRole("textbox", { name: "Mock editor" });

    vi.useFakeTimers();
    try {
      fireEvent.change(editor, { target: { value: 'OUTPUT "Changed"' } });

      const pendingEvent = new Event("beforeunload", { cancelable: true });
      Object.defineProperty(pendingEvent, "returnValue", {
        configurable: true,
        writable: true,
        value: "",
      });

      expect(window.dispatchEvent(pendingEvent)).toBe(false);
      expect(pendingEvent.defaultPrevented).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
      });

      expect(saveWorkspaceMock).toHaveBeenCalled();

      const savedEvent = new Event("beforeunload", { cancelable: true });
      Object.defineProperty(savedEvent, "returnValue", {
        configurable: true,
        writable: true,
        value: "",
      });

      expect(window.dispatchEvent(savedEvent)).toBe(true);
      expect(savedEvent.defaultPrevented).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lets the user set the autosave interval from settings", async () => {
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    const editor = await screen.findByRole("textbox", { name: "Mock editor" });
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const intervalInput = await screen.findByRole("combobox", {
      name: "Autosave interval minutes",
    });
    expect(intervalInput).toHaveValue("5");

    fireEvent.change(intervalInput, { target: { value: "1" } });
    expect(localStore.get("pseudocode-compiler-autosave-minutes")).toBe("1");

    vi.useFakeTimers();
    try {
      fireEvent.change(editor, { target: { value: 'OUTPUT "One minute"' } });

      await act(async () => {
        vi.advanceTimersByTime(59_999);
        await Promise.resolve();
      });
      expect(saveWorkspaceMock).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
        await Promise.resolve();
      });
      expect(saveWorkspaceMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mode: "cloud" }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not warn before refresh when the workspace is still empty", async () => {
    loadWorkspaceMock.mockResolvedValue(createEmptyWorkspace("2026-03-15T00:00:00.000Z"));
    render(<HomePage />);

    expect(await screen.findByText("Start writing pseudocode")).toBeInTheDocument();

    const event = new Event("beforeunload", { cancelable: true });
    Object.defineProperty(event, "returnValue", {
      configurable: true,
      writable: true,
      value: "",
    });

    expect(window.dispatchEvent(event)).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it("shows Clerk sign-in controls and asks for sign-in before cloud saving", async () => {
    authState.user = null;
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(loadWorkspaceMock).toHaveBeenCalledWith(expect.any(String), { mode: "memory" });
    const signInButton = screen.getByRole("button", { name: "Log In" });
    expect(signInButton).toHaveClass("ui-btn", "ui-btn-primary");
    expect(screen.queryByText(/Need an account/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    const dialog = await screen.findByRole("dialog", { name: "Sign in to save" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(saveWorkspaceMock).not.toHaveBeenCalled();
  });

  it("saves locally in the desktop shell without showing browser sign-in controls", async () => {
    authState.user = null;
    setDesktopRuntime();
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(loadWorkspaceMock).toHaveBeenCalledWith(expect.any(String), { mode: "local" });
    expect(screen.queryByRole("button", { name: "Log In" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    await waitFor(() => {
      expect(saveWorkspaceMock).toHaveBeenCalledWith(expect.anything(), { mode: "local" });
    });
  });

  it("saves locally on localhost without showing browser sign-in controls", async () => {
    authState.user = null;
    setLocalBrowserRuntime();
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    expect(loadWorkspaceMock).toHaveBeenCalledWith(expect.any(String), { mode: "local" });
    expect(screen.queryByRole("button", { name: "Log In" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    await waitFor(() => {
      expect(saveWorkspaceMock).toHaveBeenCalledWith(expect.anything(), { mode: "local" });
    });
  });

  it("saves the workspace to cloud when signed in", async () => {
    authState.user = {
      id: "user_123",
      email: "alex@example.com",
      firstName: "Alex",
      lastName: null,
    };
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    await waitFor(() => {
      expect(saveWorkspaceMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mode: "cloud" }),
      );
    });

    expect(screen.getByRole("button", { name: "User profile" })).toBeInTheDocument();
  });

  it("shows a loading save control while autosave is in progress", async () => {
    let resolveSave: (() => void) | null = null;
    saveWorkspaceMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    render(<HomePage />);

    const editor = await screen.findByRole("textbox", { name: "Mock editor" });

    vi.useFakeTimers();
    try {
      fireEvent.change(editor, { target: { value: 'OUTPUT "Autosaving"' } });

      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
      });

      expect(screen.getAllByText("Saving").length).toBeGreaterThan(0);

      await act(async () => {
        resolveSave?.();
        await Promise.resolve();
      });

      expect(screen.queryAllByText("Saving")).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows saved after a successful manual save", async () => {
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    saveWorkspaceMock.mockResolvedValue();
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    await waitFor(() => {
      expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);
    });
  });

  it("shows an error after a failed manual save", async () => {
    loadWorkspaceMock.mockResolvedValue(createWorkspaceFixture());
    saveWorkspaceMock.mockRejectedValue(new Error("Convex unavailable"));
    render(<HomePage />);

    await screen.findByRole("textbox", { name: "Mock editor" });
    fireEvent.click(screen.getByRole("button", { name: "Save workspace" }));

    await waitFor(() => {
      expect(screen.getAllByText("Save failed").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Save failed. Changes remain on this device.")).toBeInTheDocument();
  });
});
