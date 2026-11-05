/**
 * The caret position of the focused editor, kept outside React state so the status bar can follow it
 * without re-rendering the whole workspace on every keystroke.
 */
export interface EditorCursorSnapshot {
  line: number;
  column: number;
  selectedCharacters: number;
}

let snapshot: EditorCursorSnapshot | null = null;
const listeners = new Set<() => void>();

export function setEditorCursor(next: EditorCursorSnapshot | null): void {
  if (
    snapshot?.line === next?.line &&
    snapshot?.column === next?.column &&
    snapshot?.selectedCharacters === next?.selectedCharacters
  ) {
    return;
  }
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribeEditorCursor(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEditorCursor(): EditorCursorSnapshot | null {
  return snapshot;
}

export function getServerEditorCursor(): EditorCursorSnapshot | null {
  return null;
}
