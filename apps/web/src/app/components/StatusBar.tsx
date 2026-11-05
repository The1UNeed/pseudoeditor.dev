"use client";

import { useSyncExternalStore } from "react";
import { CircleAlert, CircleX, LoaderCircle } from "lucide-react";
import { useDictionary } from "@/i18n/context";
import { getEditorCursor, getServerEditorCursor, subscribeEditorCursor } from "@/lib/editorCursorStore";
import { formatShortcut } from "@/lib/shortcuts";

export type SaveIndicatorState =
  | "saved-local"
  | "saved-cloud"
  | "saved-device-syncing"
  | "unsaved"
  | "saving"
  | "not-saved"
  | "failed";

interface StatusBarProps {
  errors: number;
  warnings: number;
  onShowProblems: () => void;
  problemsShortcut?: string;
  syntaxLabel: string;
  onChangeSyntax: () => void;
  saveState: SaveIndicatorState;
  onSave: () => void;
  saveShortcut?: string;
  showCursor: boolean;
  onGoToLine?: () => void;
}

function goToLineShortcut() {
  return formatShortcut({ key: "g", ctrl: true });
}

const itemClassName =
  "flex h-full items-center gap-1 rounded px-1.5 text-[var(--text2)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--accent)]";

function CursorPosition({ onGoToLine }: { onGoToLine?: () => void }) {
  const t = useDictionary().editor;
  const cursor = useSyncExternalStore(subscribeEditorCursor, getEditorCursor, getServerEditorCursor);
  if (!cursor) return null;
  const label = `${t.workbench.lineColumn(cursor.line, cursor.column)}${
    cursor.selectedCharacters > 0 ? ` ${t.workbench.selectedCharacters(cursor.selectedCharacters)}` : ""
  }`;
  return onGoToLine ? (
    <button type="button" className={`${itemClassName} tabular-nums`} onClick={onGoToLine} title={`${t.workbench.goToLine} (${goToLineShortcut()})`}>
      {label}
    </button>
  ) : (
    <span className="px-1.5 tabular-nums text-[var(--text2)]">{label}</span>
  );
}

/** A compact strip with the things a student needs at a glance: problems, caret position, exam syntax, save state. */
export function StatusBar({
  errors,
  warnings,
  onShowProblems,
  problemsShortcut,
  syntaxLabel,
  onChangeSyntax,
  saveState,
  onSave,
  saveShortcut,
  showCursor,
  onGoToLine,
}: StatusBarProps) {
  const t = useDictionary().editor;
  const problemsLabel = t.workbench.problemsLabel(errors, warnings);
  const saveLabel = {
    "saved-local": t.workbench.savedLocal,
    "saved-cloud": t.workbench.savedCloud,
    "saved-device-syncing": t.workbench.savedDeviceSyncing,
    unsaved: t.workbench.unsaved,
    saving: t.workbench.savingNow,
    "not-saved": t.workbench.notSaved,
    failed: t.workbench.saveFailed,
  }[saveState];
  const saveTone =
    saveState === "failed"
      ? "text-[var(--red)]"
      : saveState === "unsaved" || saveState === "not-saved"
        ? "text-[var(--text2)]"
        : "text-[var(--text3)]";

  return (
    <footer
      aria-label={t.workbench.statusBar}
      className="flex h-6 shrink-0 select-none items-center gap-1 border-t border-[var(--separator)] bg-[var(--titlebar)] px-2 text-[11px] pointer-coarse:h-11 pointer-coarse:text-[13px]"
    >
      <button
        type="button"
        className={itemClassName}
        onClick={onShowProblems}
        aria-label={`${t.workbench.showProblems}: ${problemsLabel}`}
        title={problemsShortcut ? `${t.workbench.showProblems} (${problemsShortcut})` : t.workbench.showProblems}
      >
        <CircleX size={12} className={errors > 0 ? "text-[var(--red)]" : ""} aria-hidden />
        <span className="tabular-nums">{errors}</span>
        <CircleAlert size={12} className={`ml-1 ${warnings > 0 ? "text-[var(--orange)]" : ""}`} aria-hidden />
        <span className="tabular-nums">{warnings}</span>
      </button>
      <button
        type="button"
        className={`${itemClassName} ${saveTone}`}
        onClick={onSave}
        title={saveShortcut ? `${saveLabel} (${saveShortcut})` : saveLabel}
      >
        {/* A fixed slot so the label never shifts as the state changes. */}
        <span className="flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden>
          {saveState === "saving" ? <LoaderCircle size={11} className="animate-spin" /> : null}
          {saveState === "unsaved" ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--text2)]" /> : null}
          {saveState === "failed" ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" /> : null}
        </span>
        <span className="truncate">{saveLabel}</span>
      </button>
      <div className="flex-1" />
      {showCursor ? <CursorPosition onGoToLine={onGoToLine} /> : null}
      <button type="button" className={itemClassName} onClick={onChangeSyntax} title={t.workbench.changeSyntax}>
        {syntaxLabel}
      </button>
    </footer>
  );
}
