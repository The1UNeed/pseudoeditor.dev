"use client";

import { loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ensureMonacoNullCaretHitTestGuard } from "./monacoNullCaretHitTestGuard";

let initialization: Promise<void> | undefined;

// A microtask does not yield, and a timer alone can run the next group before
// pending input gets a paint. Resume after a frame so interaction latency does
// not span successive groups, including when the chunks are cached.
const yieldToBrowser = () => new Promise<void>((resolve) => {
  if (document.hidden) {
    setTimeout(resolve, 0);
  } else {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  }
});

export function initializeMonaco(
  options: editor.IStandaloneEditorConstructionOptions,
): Promise<void> {
  return initialization ??= loadMonaco(options).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
}

async function loadMonaco(
  options: editor.IStandaloneEditorConstructionOptions,
): Promise<void> {
  // Pre-evaluate the core's largest dependency groups separately. Importing the
  // API first would synchronously evaluate all of them in a single long task.
  await import("./monaco/model");
  await yieldToBrowser();
  await import("./monaco/view");
  await yieldToBrowser();
  const { prepareMonacoFont } = await import("./monaco/font");
  prepareMonacoFont(options);
  await yieldToBrowser();
  await import("./monaco/overlays");
  await yieldToBrowser();
  await import("./monaco/quickInput");
  await yieldToBrowser();
  await import("./monaco/services");
  await yieldToBrowser();
  const monaco = await import("monaco-editor/esm/vs/editor/editor.api.js");
  await yieldToBrowser();
  await import("./monaco/editing");
  await yieldToBrowser();
  await import("./monaco/suggestions");
  await yieldToBrowser();
  await import("./monaco/navigation");
  await yieldToBrowser();
  // Initialize shared services separately from the first visible widget. Wait
  // until contributions are loaded because services also snapshot editor features.
  const warmupModel = monaco.editor.createModel("");
  await yieldToBrowser();
  await ensureMonacoNullCaretHitTestGuard();
  await yieldToBrowser();
  // Turbopack also evaluates some core dependencies on first construction.
  // Prime the widget separately from the visible editor's first paint. The
  // detached widget never paints or edits a workspace file.
  const warmupEditor = monaco.editor.create(document.createElement("div"), {
    ...options,
    model: warmupModel,
    dimension: { width: 1, height: 1 },
    automaticLayout: false,
  });
  warmupEditor.dispose();
  warmupModel.dispose();
  await yieldToBrowser();

  // Contributions must be registered before editor.create: Monaco snapshots
  // the registry at creation, so registering them after mount loses features.
  loader.config({ monaco });
}

// Serve Monaco from our own bundle instead of the default jsDelivr CDN so the
// editor works under a strict Content Security Policy and without third-party
// script dependencies at runtime.
if (typeof window !== "undefined") {
  const monacoWindow = window as Window & {
    MonacoEnvironment?: { getWorker: (workerId: string, label: string) => Worker };
  };

  monacoWindow.MonacoEnvironment = {
    getWorker: () =>
      new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), {
        type: "module",
      }),
  };
}
