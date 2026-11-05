import type * as Monaco from "monaco-editor";

/**
 * Editor models outlive the editor component (phones unmount it when switching tabs), so the workspace owns their
 * lifetime. This module stays free of runtime Monaco imports so the page can use it without loading the editor.
 */
const MODEL_PATH_PREFIX = "/workspace/";
let loadedMonaco: typeof Monaco | null = null;

/** One Monaco model per document, so undo history, cursor and scroll survive switching files. */
export function modelPathForDocument(documentKey: string | undefined): string | undefined {
  return documentKey ? `file://${MODEL_PATH_PREFIX}${encodeURIComponent(documentKey)}.pseudo` : undefined;
}

export function registerLoadedMonaco(monaco: typeof Monaco): void {
  loadedMonaco = monaco;
}

/** Disposes the models of documents that no longer exist (or every workspace model when `keep` is empty). */
export function disposeWorkspaceModels(keepDocumentKeys: ReadonlySet<string> = new Set()): void {
  if (!loadedMonaco) return;
  const keepPaths = new Set([...keepDocumentKeys].map((key) => `${MODEL_PATH_PREFIX}${encodeURIComponent(key)}.pseudo`));
  for (const model of loadedMonaco.editor.getModels()) {
    if (model.uri.path.startsWith(MODEL_PATH_PREFIX) && !keepPaths.has(model.uri.path) && !model.isAttachedToEditor()) {
      model.dispose();
    }
  }
}
