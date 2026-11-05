import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultWorkspace,
  createDocument,
  createFolder,
  type WorkspaceState,
} from "@pseudoeditor/workspace";
import { WorkspaceSidebar } from "@/app/components/WorkspaceSidebar";

function createWorkspaceFixture() {
  let workspace: WorkspaceState = createDefaultWorkspace({
    sampleSource: 'OUTPUT "Main"',
    now: "2026-03-15T00:00:00.000Z",
  });

  workspace = createDocument(workspace, {
    name: "second.pseudo",
    id: "doc-second",
    now: "2026-03-15T00:00:30.000Z",
  });

  workspace = createFolder(workspace, {
    parentId: workspace.rootFolderId,
    name: "Archive",
    id: "folder-archive",
    now: "2026-03-15T00:01:00.000Z",
  });

  return workspace;
}

function getExplorerRow(label: string): HTMLElement {
  const textNode = screen.getByText(label);
  const row = textNode.closest('[data-workspace-row="true"]');
  if (!row) {
    throw new Error(`Explorer row "${label}" not found.`);
  }
  return row as HTMLElement;
}

function renderSidebar(workspace = createWorkspaceFixture()) {
  const props = buildSidebarProps(workspace);

  render(<WorkspaceSidebar {...props} />);
  return props;
}

function buildSidebarProps(workspace = createWorkspaceFixture()) {
  return {
    workspace,
    onSelectDocument: vi.fn(),
    onToggleFolder: vi.fn(),
    onExpandFolder: vi.fn(),
    onCreateFolder: vi.fn(),
    onCreateDocument: vi.fn(),
    onRenameNode: vi.fn(),
    onDeleteNodes: vi.fn(),
    onMoveNodes: vi.fn(),
  };
}

function restoreProperty<T extends object>(
  target: T,
  key: keyof T,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }

  delete (target as Record<PropertyKey, unknown>)[key];
}

describe("WorkspaceSidebar", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes direct create buttons for files and folders", () => {
    const workspace = createWorkspaceFixture();
    const props = renderSidebar(workspace);

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    expect(props.onCreateDocument).toHaveBeenCalledWith(workspace.rootFolderId);

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    expect(props.onCreateFolder).toHaveBeenCalledWith(workspace.rootFolderId);
  });

  it("opens the explorer context menu on a touch long press", async () => {
    renderSidebar();

    const mainRow = getExplorerRow("main.pseudo");

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(mainRow, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 96,
        clientY: 148,
      });

      await act(async () => {
        vi.advanceTimersByTime(430);
      });

      fireEvent.pointerUp(mainRow, {
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

  it("keeps the multi-selection when opening the context menu on a selected row", () => {
    const props = renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "main.pseudo" }));
    fireEvent.click(screen.getByRole("button", { name: "second.pseudo" }), { shiftKey: true });
    fireEvent.contextMenu(getExplorerRow("second.pseudo"), {
      clientX: 120,
      clientY: 120,
    });

    expect(screen.getByText("2 items selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete 2 items" }));

    expect(props.onDeleteNodes).toHaveBeenCalledWith(["doc-main", "doc-second"]);
  });

  it("supports row-level shift-click selection and touch batch actions", async () => {
    const props = renderSidebar();
    const mainRow = getExplorerRow("main.pseudo");
    const secondRow = getExplorerRow("second.pseudo");

    fireEvent.click(mainRow);
    fireEvent.click(secondRow, { shiftKey: true });

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(secondRow, {
        pointerType: "touch",
        pointerId: 3,
        clientX: 120,
        clientY: 120,
      });

      await act(async () => {
        vi.advanceTimersByTime(430);
      });

      fireEvent.pointerUp(secondRow, {
        pointerType: "touch",
        pointerId: 3,
        clientX: 120,
        clientY: 120,
      });

      expect(screen.getByText("2 items selected")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("menuitem", { name: "Delete 2 items" }));

      expect(props.onDeleteNodes).toHaveBeenCalledWith(["doc-main", "doc-second"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps folder disclosure mouse pointer events out of ancestor row handlers", () => {
    const parentPointerDown = vi.fn();
    const props = buildSidebarProps();

    render(
      <div onPointerDown={parentPointerDown}>
        <WorkspaceSidebar {...props} />
      </div>,
    );

    const disclosureButton = screen.getByRole("button", { name: "Expand Archive" });

    fireEvent.pointerDown(disclosureButton, {
      pointerType: "mouse",
      pointerId: 7,
      button: 0,
      clientX: 20,
      clientY: 20,
    });

    expect(parentPointerDown).not.toHaveBeenCalled();

    fireEvent.click(disclosureButton);

    expect(props.onToggleFolder).toHaveBeenCalledWith("folder-archive");
  });

  it("reorders files into folders through the touch drag fallback", async () => {
    const props = renderSidebar();
    const mainRow = getExplorerRow("main.pseudo");
    const archiveRow = getExplorerRow("Archive");

    const elementFromPoint = vi.fn(() => archiveRow);
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: elementFromPoint,
    });
    vi.spyOn(archiveRow, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 40,
      top: 40,
      left: 0,
      bottom: 80,
      right: 320,
      width: 320,
      height: 40,
      toJSON: () => "",
    });

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(mainRow, {
        pointerType: "touch",
        pointerId: 2,
        clientX: 24,
        clientY: 24,
      });

      await act(async () => {
        vi.advanceTimersByTime(430);
      });

      fireEvent.pointerMove(mainRow, {
        pointerType: "touch",
        pointerId: 2,
        clientX: 24,
        clientY: 60,
      });

      fireEvent.pointerUp(mainRow, {
        pointerType: "touch",
        pointerId: 2,
        clientX: 24,
        clientY: 60,
      });

      expect(props.onMoveNodes).toHaveBeenCalledWith(["doc-main"], "folder-archive", 0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the pointer drag fallback for the macOS desktop shell when dragging from the filename control", () => {
    const desktopWindow = window as Window & { electron?: { isDesktop?: boolean } };
    const originalElectronDescriptor = Object.getOwnPropertyDescriptor(desktopWindow, "electron");
    const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "platform");
    const originalUserAgentDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "userAgent");
    const originalMaxTouchPointsDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "maxTouchPoints");
    const originalMatchMedia = window.matchMedia;

    Object.defineProperty(desktopWindow, "electron", {
      configurable: true,
      value: { isDesktop: true },
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)",
    });
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;

    try {
      const props = renderSidebar();
      const mainButton = screen.getByRole("button", { name: "main.pseudo" });
      const archiveRow = getExplorerRow("Archive");

      const elementFromPoint = vi.fn(() => archiveRow);
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        value: elementFromPoint,
      });
      vi.spyOn(archiveRow, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 40,
        top: 40,
        left: 0,
        bottom: 80,
        right: 320,
        width: 320,
        height: 40,
        toJSON: () => "",
      });

      expect(getExplorerRow("main.pseudo")).not.toHaveAttribute("draggable", "true");

      fireEvent.pointerDown(mainButton, {
        pointerType: "mouse",
        pointerId: 5,
        button: 0,
        clientX: 24,
        clientY: 24,
      });

      fireEvent.pointerMove(mainButton, {
        pointerType: "mouse",
        pointerId: 5,
        clientX: 24,
        clientY: 60,
      });

      fireEvent.pointerUp(mainButton, {
        pointerType: "mouse",
        pointerId: 5,
        clientX: 24,
        clientY: 60,
      });

      expect(props.onMoveNodes).toHaveBeenCalledWith(["doc-main"], "folder-archive", 0);
    } finally {
      restoreProperty(desktopWindow, "electron", originalElectronDescriptor);
      restoreProperty(window.navigator, "platform", originalPlatformDescriptor);
      restoreProperty(window.navigator, "userAgent", originalUserAgentDescriptor);
      restoreProperty(window.navigator, "maxTouchPoints", originalMaxTouchPointsDescriptor);
      window.matchMedia = originalMatchMedia;
    }
  });

  it("keeps explorer rows draggable on non-touch desktops", async () => {
    renderSidebar();

    await waitFor(() => {
      expect(getExplorerRow("main.pseudo")).toHaveAttribute("draggable", "true");
      expect(getExplorerRow("Archive")).toHaveAttribute("draggable", "true");
    });
  });

  it("moves the selection with the arrow keys so F2 renames the row the keyboard is on", () => {
    const props = renderSidebar();
    const tree = screen.getByRole("tree", { name: "Explorer" });
    fireEvent.click(getExplorerRow("second.pseudo"));
    expect(tree).toHaveFocus();

    fireEvent.keyDown(tree, { key: "ArrowUp" });
    expect(screen.getByRole("treeitem", { name: "main.pseudo" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tree, { key: "F2" });
    const mainId = Object.values(props.workspace.nodes).find((node) => node.name === "main.pseudo")?.id;
    expect(props.onRenameNode).toHaveBeenLastCalledWith(mainId);

    fireEvent.keyDown(tree, { key: "End" });
    const archive = screen.getByRole("treeitem", { name: "Archive" });
    expect(archive).toHaveAttribute("aria-selected", "true");
    expect(tree).toHaveAttribute("aria-activedescendant", archive.id);
    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(props.onExpandFolder).toHaveBeenCalledWith("folder-archive");
  });

  it("extends the selection with Shift+Arrow from a fixed anchor", () => {
    renderSidebar();
    const tree = screen.getByRole("tree", { name: "Explorer" });
    fireEvent.click(getExplorerRow("main.pseudo"));
    fireEvent.keyDown(tree, { key: "ArrowDown", shiftKey: true });
    fireEvent.keyDown(tree, { key: "ArrowDown", shiftKey: true });
    const selected = screen.getAllByRole("treeitem").filter((row) => row.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(3);
  });

  it("opens the context menu from the keyboard and focuses its first item", async () => {
    renderSidebar();
    const tree = screen.getByRole("tree", { name: "Explorer" });
    fireEvent.click(getExplorerRow("second.pseudo"));
    fireEvent.keyDown(tree, { key: "F10", shiftKey: true });
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(tree).toHaveFocus();
  });

  it("lets Cmd/Ctrl chords such as Run (Cmd+Enter) through to the workspace keymap", () => {
    const props = renderSidebar();
    const tree = screen.getByRole("tree", { name: "Explorer" });
    fireEvent.click(getExplorerRow("Archive"));
    const event = new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true, cancelable: true });
    tree.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(props.onToggleFolder).not.toHaveBeenCalled();
  });
});
