import { useId } from "react";
import {
  SYNTAX_COLOR_SCHEMES,
  type SyntaxColorScheme,
  type SyntaxColorSchemeId,
  type SyntaxTokenColors,
} from "@/lib/syntaxColorSchemes";
import type { ResolvedTheme } from "@/lib/theme";

type TokenKind = keyof SyntaxTokenColors;

// The same token kinds the editor's highlighter gives this code, so the preview matches the editor.
const PREVIEW_LINES: Array<Array<[string, TokenKind | null]>> = [
  [["// Count to 3", "comment"]],
  [
    ["FOR", "keyword"], [" ", null], ["i", "identifier"], [" ", null], ["←", "operator"], [" ", null],
    ["1", "number"], [" ", null], ["TO", "keyword"], [" ", null], ["3", "number"],
  ],
  [["  ", null], ["OUTPUT", "keyword"], [" ", null], ['"Hi "', "string"], [",", "operator"], [" ", null], ["i", "identifier"]],
];

function SchemePreview({ scheme, theme }: { scheme: SyntaxColorScheme; theme: ResolvedTheme }) {
  const colors = scheme[theme];
  return (
    <pre
      aria-hidden="true"
      className="m-0 overflow-hidden rounded-md bg-[var(--bg)] px-2.5 py-2 font-mono text-[11.5px] leading-[1.6] text-[var(--code-text)]"
    >
      {PREVIEW_LINES.map((line, lineIndex) => (
        <span key={lineIndex} className="block whitespace-pre">
          {line.map(([text, kind], tokenIndex) => (
            <span
              key={tokenIndex}
              style={
                kind
                  ? {
                      color: colors[kind],
                      fontStyle: kind === "comment" ? "italic" : undefined,
                      fontWeight: kind === "keyword" && scheme.boldKeywords ? 700 : undefined,
                    }
                  : undefined
              }
            >
              {text}
            </span>
          ))}
        </span>
      ))}
    </pre>
  );
}

type SyntaxColorSchemePickerProps = {
  value: SyntaxColorSchemeId;
  theme: ResolvedTheme;
  label: string;
  names: Record<SyntaxColorSchemeId, string>;
  onChange: (id: SyntaxColorSchemeId) => void;
};

export function SyntaxColorSchemePicker({ value, theme, label, names, onChange }: SyntaxColorSchemePickerProps) {
  // Radios group by name across the whole page, so two pickers on screen at once need different names.
  const radioName = useId();
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
      {SYNTAX_COLOR_SCHEMES.map((scheme) => {
        const selected = scheme.id === value;
        return (
          <label
            key={scheme.id}
            className={`group relative cursor-pointer rounded-xl border p-1.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color-mix(in_srgb,var(--accent)_30%,transparent)] ${
              selected
                ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface2))]"
                : "border-[var(--separator)] bg-[var(--surface2)] hover:border-[color-mix(in_srgb,var(--text3)_45%,var(--separator))]"
            }`}
          >
            <input
              type="radio"
              name={radioName}
              value={scheme.id}
              checked={selected}
              onChange={() => onChange(scheme.id)}
              className="sr-only"
            />
            <SchemePreview scheme={scheme} theme={theme} />
            <span
              className={`mt-1.5 block truncate px-1 pb-0.5 text-xs font-semibold ${
                selected ? "text-[var(--text)]" : "text-[var(--text2)] group-hover:text-[var(--text)]"
              }`}
            >
              {names[scheme.id]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
