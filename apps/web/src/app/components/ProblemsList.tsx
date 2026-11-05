"use client";

import { CircleAlert, CircleX, Info } from "lucide-react";
import type { Diagnostic } from "@/compiler/types";
import { useDictionary } from "@/i18n/context";

interface ProblemsListProps {
  diagnostics: Diagnostic[];
  onSelect: (diagnostic: Diagnostic) => void;
  /** Larger rows for touch layouts. */
  touch?: boolean;
}

export function countProblems(diagnostics: Diagnostic[]) {
  let errors = 0;
  let warnings = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") errors += 1;
    else if (diagnostic.severity === "warning") warnings += 1;
  }
  return { errors, warnings };
}

function SeverityIcon({ severity }: { severity: Diagnostic["severity"] }) {
  if (severity === "error") return <CircleX size={14} className="shrink-0 text-[var(--red)]" aria-hidden />;
  if (severity === "warning") return <CircleAlert size={14} className="shrink-0 text-[var(--orange)]" aria-hidden />;
  return <Info size={14} className="shrink-0 text-[var(--accent)]" aria-hidden />;
}

/** The Problems view: one row per diagnostic; choosing a row moves the caret to it in the editor. */
export function ProblemsList({ diagnostics, onSelect, touch = false }: ProblemsListProps) {
  const t = useDictionary().editor;

  if (diagnostics.length === 0) {
    return <p className="px-3 py-2 text-xs text-[var(--text3)]">{t.workbench.noProblems}</p>;
  }

  const sorted = [...diagnostics].sort((a, b) => a.line - b.line || a.column - b.column);

  return (
    <ul className="py-1" aria-label={t.workbench.problems}>
      {sorted.map((diagnostic, index) => (
        <li key={`${diagnostic.code}-${diagnostic.line}-${diagnostic.column}-${index}`}>
          <button
            type="button"
            className={`group flex w-full items-start gap-2 px-3 text-left transition hover:bg-[var(--hover)] focus-visible:bg-[var(--selected)] focus-visible:outline-none ${
              touch ? "min-h-11 py-2.5" : "py-1"
            }`}
            aria-label={`${t.workbench.severity[diagnostic.severity]}: ${diagnostic.message}. ${t.workbench.goToProblem(diagnostic.line, diagnostic.column)}`}
            aria-describedby={diagnostic.hint ? `problem-hint-${index}` : undefined}
            onClick={() => onSelect(diagnostic)}
          >
            <span className="mt-[3px] flex">
              <SeverityIcon severity={diagnostic.severity} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] leading-5 text-[var(--text)]">
                {diagnostic.message}
                <span className="ml-2 whitespace-nowrap text-[11px] text-[var(--text3)]">
                  <span className="font-mono">{diagnostic.code}</span> · {t.workbench.lineColumn(diagnostic.line, diagnostic.column)}
                </span>
              </span>
              {diagnostic.hint ? (
                <span id={`problem-hint-${index}`} className="block text-xs leading-5 text-[var(--text2)]">
                  {t.diagnostics.hint} {diagnostic.hint}
                </span>
              ) : null}
            </span>

          </button>
        </li>
      ))}
    </ul>
  );
}
