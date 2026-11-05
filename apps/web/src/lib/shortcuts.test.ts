import { describe, expect, it } from "vitest";
import type * as Monaco from "monaco-editor";
import { SHORTCUTS, formatShortcut, matchesShortcut, toMonacoKeybinding } from "./shortcuts";

function key(init: KeyboardEventInit) {
  return new KeyboardEvent("keydown", init);
}

describe("shortcuts", () => {
  it("maps mod to Cmd on Apple platforms and Ctrl elsewhere", () => {
    const save = SHORTCUTS.save[0];
    expect(matchesShortcut(key({ key: "s", code: "KeyS", metaKey: true }), save, true)).toBe(true);
    expect(matchesShortcut(key({ key: "s", code: "KeyS", ctrlKey: true }), save, true)).toBe(false);
    expect(matchesShortcut(key({ key: "s", code: "KeyS", ctrlKey: true }), save, false)).toBe(true);
    expect(matchesShortcut(key({ key: "s", code: "KeyS", metaKey: true }), save, false)).toBe(false);
  });

  it("requires exact modifiers so Cmd+Shift+S is not Save", () => {
    expect(matchesShortcut(key({ key: "S", code: "KeyS", metaKey: true, shiftKey: true }), SHORTCUTS.save[0], true)).toBe(false);
  });

  it("follows the typed letter on remapped layouts and the physical key on non-Latin ones", () => {
    const toggle = SHORTCUTS.toggleExplorer[0];
    // Dvorak: the physical N key types "b".
    expect(matchesShortcut(key({ key: "b", code: "KeyN", ctrlKey: true }), toggle, false)).toBe(true);
    // Russian layout: the physical B key types "и".
    expect(matchesShortcut(key({ key: "и", code: "KeyB", ctrlKey: true }), toggle, false)).toBe(true);
  });

  it("treats Ctrl+` as the literal Control key on every platform", () => {
    const panel = SHORTCUTS.togglePanel[1];
    expect(matchesShortcut(key({ key: "`", code: "Backquote", ctrlKey: true }), panel, true)).toBe(true);
    expect(matchesShortcut(key({ key: "`", code: "Backquote", metaKey: true }), panel, true)).toBe(false);
  });

  it("formats labels per platform", () => {
    expect(formatShortcut(SHORTCUTS.run[0], true)).toBe("⌘↩");
    expect(formatShortcut(SHORTCUTS.run[0], false)).toBe("Ctrl+Enter");
    expect(formatShortcut(SHORTCUTS.commandPalette[0], true)).toBe("⇧⌘P");
    expect(formatShortcut(SHORTCUTS.commandPalette[0], false)).toBe("Ctrl+Shift+P");
    expect(formatShortcut(SHORTCUTS.togglePanel[1], true)).toBe("⌃`");
  });

  it("binds literal Ctrl to Monaco's WinCtrl only on Apple platforms", () => {
    const monaco = {
      KeyCode: { Backquote: 1 },
      KeyMod: { CtrlCmd: 1 << 11, WinCtrl: 1 << 8, Shift: 1 << 10, Alt: 1 << 9 },
    } as unknown as typeof Monaco;
    const panel = SHORTCUTS.togglePanel[1];
    expect(toMonacoKeybinding(monaco, panel, true)).toBe((1 << 8) | 1);
    expect(toMonacoKeybinding(monaco, panel, false)).toBe((1 << 11) | 1);
  });
});
