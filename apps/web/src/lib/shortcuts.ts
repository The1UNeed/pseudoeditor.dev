import type * as Monaco from "monaco-editor";

/**
 * A keyboard shortcut. `mod` is Cmd on Apple platforms and Ctrl elsewhere; `ctrl` is the literal Control key
 * on every platform (VS Code's Ctrl+` works that way on macOS too).
 */
export interface ShortcutSpec {
  key: ShortcutKey;
  mod?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type ShortcutKey =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "Enter" | "F1" | "F2" | "F5" | "Backquote" | "Comma";

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  return /mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X|iPhone|iPad/.test(navigator.userAgent);
}

function eventKeyMatches(event: KeyboardEvent, key: ShortcutKey): boolean {
  if (key === "Backquote") return event.code === "Backquote";
  if (key === "Comma") return event.key === "," || event.code === "Comma";
  if (key.length > 1) return event.key === key;
  // Letters follow the typed character so AZERTY/Dvorak users get the shortcut printed on their key; fall back to
  // the physical key for non-Latin layouts, where the typed character is not a Latin letter.
  // Autofill and password managers dispatch bare `keydown` Events with no `key` (or `code`).
  const typed = typeof event.key === "string" ? event.key.toLowerCase() : "";
  if (/^[a-z]$/.test(typed)) return typed === key;
  return event.code === `Key${key.toUpperCase()}`;
}

export function matchesShortcut(event: KeyboardEvent, spec: ShortcutSpec, apple = isApplePlatform()): boolean {
  if (!eventKeyMatches(event, spec.key)) return false;
  const wantsMeta = apple && spec.mod === true;
  const wantsCtrl = spec.ctrl === true || (!apple && spec.mod === true);
  return (
    event.metaKey === wantsMeta &&
    event.ctrlKey === wantsCtrl &&
    event.shiftKey === (spec.shift === true) &&
    event.altKey === (spec.alt === true)
  );
}

const KEY_LABELS: Partial<Record<ShortcutKey, { apple: string; other: string }>> = {
  Enter: { apple: "↩", other: "Enter" },
  Backquote: { apple: "`", other: "`" },
  Comma: { apple: ",", other: "," },
};

/** "⌘S" on Apple platforms, "Ctrl+S" elsewhere. */
export function formatShortcut(spec: ShortcutSpec, apple = isApplePlatform()): string {
  const keyLabel = KEY_LABELS[spec.key]?.[apple ? "apple" : "other"] ?? spec.key.toUpperCase();
  if (apple) {
    return `${spec.ctrl ? "⌃" : ""}${spec.alt ? "⌥" : ""}${spec.shift ? "⇧" : ""}${spec.mod ? "⌘" : ""}${keyLabel}`;
  }
  const parts: string[] = [];
  if (spec.ctrl || spec.mod) parts.push("Ctrl");
  if (spec.shift) parts.push("Shift");
  if (spec.alt) parts.push("Alt");
  parts.push(keyLabel);
  return parts.join("+");
}

/** Appends the shortcut to a tooltip, e.g. "Run (⌘↩)". */
export function withShortcut(label: string, spec: ShortcutSpec | undefined, apple = isApplePlatform()): string {
  return spec ? `${label} (${formatShortcut(spec, apple)})` : label;
}

export function toMonacoKeybinding(monaco: typeof Monaco, spec: ShortcutSpec, apple = isApplePlatform()): number {
  const { KeyCode, KeyMod } = monaco;
  let keyCode: number;
  switch (spec.key) {
    case "Enter": keyCode = KeyCode.Enter; break;
    case "F1": keyCode = KeyCode.F1; break;
    case "F2": keyCode = KeyCode.F2; break;
    case "F5": keyCode = KeyCode.F5; break;
    case "Backquote": keyCode = KeyCode.Backquote; break;
    case "Comma": keyCode = KeyCode.Comma; break;
    default:
      keyCode = KeyCode[`Key${spec.key.toUpperCase()}` as keyof typeof KeyCode] as number;
  }
  let binding = keyCode;
  if (spec.mod) binding |= KeyMod.CtrlCmd;
  // Monaco's WinCtrl is the Control key on macOS but the Windows/Meta key elsewhere, where Control is CtrlCmd.
  if (spec.ctrl) binding |= apple ? KeyMod.WinCtrl : KeyMod.CtrlCmd;
  if (spec.shift) binding |= KeyMod.Shift;
  if (spec.alt) binding |= KeyMod.Alt;
  return binding;
}

/** A workspace action that is reachable from the global keymap and from the editor's command palette (F1). */
export interface WorkspaceCommand {
  id: string;
  label: string;
  shortcuts: ShortcutSpec[];
  run: () => void;
}

export const SHORTCUTS = {
  run: [{ key: "Enter", mod: true }, { key: "F5" }] as ShortcutSpec[],
  save: [{ key: "s", mod: true }] as ShortcutSpec[],
  toggleExplorer: [{ key: "b", mod: true }] as ShortcutSpec[],
  togglePanel: [{ key: "j", mod: true }, { key: "Backquote", ctrl: true }] as ShortcutSpec[],
  settings: [{ key: "Comma", mod: true }] as ShortcutSpec[],
  commandPalette: [{ key: "p", mod: true, shift: true }] as ShortcutSpec[],
  problems: [{ key: "m", mod: true, shift: true }] as ShortcutSpec[],
} satisfies Record<string, ShortcutSpec[]>;
