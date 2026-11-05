"use client";

import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Editor, { BeforeMount, OnMount } from "@monaco-editor/react";
import { initializeMonaco } from "@/lib/monacoLocalLoader";
import type * as Monaco from "monaco-editor";
import { EditorLoader } from "@/app/components/EditorLoader";
import { Diagnostic } from "@/compiler/types";
import { autoCorrectPseudocodeLine } from "@/app/components/pseudocodeAutocorrect";
import { afterNextPaint } from "@/lib/afterNextPaint";
import { isAppleTouchDevice } from "@/lib/appleTouch";
import { ensureMonacoNullCaretHitTestGuard } from "@/lib/monacoNullCaretHitTestGuard";
import { getPseudocodeEditorOptions } from "@/lib/pseudocodeEditorOptions";
import {
  SYNTAX_OPTIONS,
  keywordLookupForSyntax,
  languageIdForSyntax,
  resolveSyntax,
  syntaxKeywords,
  type SyntaxId,
} from "@/lib/pseudocodeLanguages";
import {
  DEFAULT_SYNTAX_COLOR_SCHEME,
  SYNTAX_COLOR_SCHEMES,
  monacoThemeName,
  type SyntaxColorSchemeId,
} from "@/lib/syntaxColorSchemes";
import type { ResolvedTheme } from "@/lib/theme";
import { useDictionary } from "@/i18n/context";
import { setEditorCursor } from "@/lib/editorCursorStore";
import { toMonacoKeybinding, type WorkspaceCommand } from "@/lib/shortcuts";
import { modelPathForDocument, registerLoadedMonaco } from "@/lib/editorModels";
import { editorEn } from "@/i18n/messages/editor.en";

/** What the workspace can ask of the mounted editor (focus, reveal a problem, open the command palette). */
export interface PseudocodeEditorApi {
  focus: () => void;
  revealPosition: (line: number, column: number) => void;
  /** The document whose model the editor is showing right now. */
  showsDocument: (documentKey: string) => boolean;
  openCommandPalette: () => void;
  goToLine: () => void;
}

interface MonacoPseudocodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  diagnostics: Diagnostic[];
  theme: ResolvedTheme;
  documentKey?: string;
  syntaxId?: SyntaxId | string;
  colorScheme?: SyntaxColorSchemeId;
  /** Workspace actions to list in the editor's command palette with their keybindings. */
  commands?: WorkspaceCommand[];
  apiRef?: MutableRefObject<PseudocodeEditorApi | null>;
}

const DATA_TYPE_NAMES = new Set(["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN", "DATE"]);

const TYPE_KEYWORDS = [
  "INTEGER",
  "REAL",
  "CHAR",
  "STRING",
  "BOOLEAN",
];

const ROUTINE_KEYWORDS = [
  "DIV",
  "MOD",
  "LENGTH",
  "LCASE",
  "UCASE",
  "SUBSTRING",
  "ROUND",
  "RANDOM",
];

const FLOW_KEYWORDS = [
  "DECLARE",
  "CONSTANT",
  "ARRAY",
  "OF",
  "INPUT",
  "OUTPUT",
  "IF",
  "THEN",
  "ELSE",
  "ENDIF",
  "CASE",
  "OTHERWISE",
  "ENDCASE",
  "FOR",
  "TO",
  "STEP",
  "NEXT",
  "REPEAT",
  "UNTIL",
  "WHILE",
  "DO",
  "ENDWHILE",
  "PROCEDURE",
  "ENDPROCEDURE",
  "FUNCTION",
  "RETURNS",
  "ENDFUNCTION",
  "CALL",
  "RETURN",
  "OPENFILE",
  "READFILE",
  "WRITEFILE",
  "CLOSEFILE",
  "READ",
  "WRITE",
  "AND",
  "OR",
  "NOT",
  "TRUE",
  "FALSE",
];

type AutocompleteText = typeof editorEn.autocomplete;
type AutocompleteKey = keyof AutocompleteText;

// The completion provider is registered once per page, so it reads the active locale's text from here.
let autocompleteText: AutocompleteText = editorEn.autocomplete;

const ROUTINE_SUGGESTIONS: Array<{ label: string; detail: AutocompleteKey; insertText: string }> = [
  {
    label: "DIV(Number, Divisor)",
    detail: "integerQuotient",
    insertText: "DIV(${1:Number}, ${2:Divisor})",
  },
  {
    label: "MOD(Number, Divisor)",
    detail: "integerRemainder",
    insertText: "MOD(${1:Number}, ${2:Divisor})",
  },
  {
    label: "LENGTH(Text)",
    detail: "stringLength",
    insertText: "LENGTH(${1:Text})",
  },
  {
    label: "LCASE(TextOrChar)",
    detail: "lowerCase",
    insertText: "LCASE(${1:TextOrChar})",
  },
  {
    label: "UCASE(TextOrChar)",
    detail: "upperCase",
    insertText: "UCASE(${1:TextOrChar})",
  },
  {
    label: "SUBSTRING(Text, Start, Length)",
    detail: "substring",
    insertText: "SUBSTRING(${1:Text}, ${2:Start}, ${3:Length})",
  },
  {
    label: "ROUND(Value, Places)",
    detail: "round",
    insertText: "ROUND(${1:Value}, ${2:Places})",
  },
  {
    label: "RANDOM()",
    detail: "random",
    insertText: "RANDOM()",
  },
] as const;

let pseudocodeLanguageRegistered = false;
let pseudocodeCompletionProviderRegistered = false;

if (typeof window !== "undefined") {
  // Switching models cancels Monaco's in-flight work (hover, occurrences) with a `Canceled` rejection by design.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { name?: unknown; message?: unknown } | null;
    if (reason?.name === "Canceled" && reason.message === "Canceled") event.preventDefault();
  });
}

// Editor surface, gutter, selection and widget colours follow the app theme (see globals.css), so every syntax
// scheme sits on the same workbench. Selected text keeps full contrast whatever its token colour.
const EDITOR_SURFACE_COLORS = {
  dark: {
    "editor.background": "#16171B",
    "editor.foreground": "#E3E5EC",
    "editorLineNumber.foreground": "#7D8293",
    "editorLineNumber.activeForeground": "#ECEDF2",
    "editor.lineHighlightBackground": "#1D1E24",
    "editor.lineHighlightBorder": "#00000000",
    "editorCursor.foreground": "#7FD6B0",
    "editor.selectionBackground": "#5BC49A3D",
    // Selected text keeps full contrast whatever its token colour (comments would otherwise drop below 4.5:1).
    "editor.selectionForeground": "#E3E5EC",
    "editor.inactiveSelectionBackground": "#5BC49A22",
    "editor.selectionHighlightBackground": "#5BC49A1F",
    "editor.wordHighlightBackground": "#5BC49A1A",
    "editor.findMatchBackground": "#F2B45A55",
    "editor.findMatchHighlightBackground": "#F2B45A2A",
    "editorBracketMatch.background": "#5BC49A2A",
    "editorBracketMatch.border": "#5BC49A80",
    "editorIndentGuide.background1": "#2B2D35",
    "editorIndentGuide.activeBackground1": "#3A3D48",
    "editorWhitespace.foreground": "#3A3D48",
    "editorError.foreground": "#FF6B63",
    "editorWarning.foreground": "#F2B45A",
    "editorInfo.foreground": "#5BC49A",
    "editorOverviewRuler.border": "#00000000",
    "scrollbarSlider.background": "#3537424D",
    "scrollbarSlider.hoverBackground": "#353742AA",
    "scrollbarSlider.activeBackground": "#3A3D48",
    "editorWidget.background": "#202128",
    "editorWidget.border": "#3A3D48",
    "editorHoverWidget.background": "#202128",
    "editorHoverWidget.border": "#3A3D48",
    "editorSuggestWidget.background": "#202128",
    "editorSuggestWidget.border": "#3A3D48",
    "editorSuggestWidget.selectedBackground": "#5BC49A2E",
    "editorSuggestWidget.highlightForeground": "#7FD6B0",
    "list.hoverBackground": "#292B33",
    "quickInput.background": "#202128",
    "quickInputList.focusBackground": "#5BC49A2E",
    "quickInputList.focusForeground": "#ECEDF2",
    "editorSuggestWidget.selectedForeground": "#ECEDF2",
    "list.highlightForeground": "#7FD6B0",
    "list.focusHighlightForeground": "#7FD6B0",
    "editorBracketHighlight.foreground1": "#9DA2B3",
    "editorBracketHighlight.foreground2": "#9DA2B3",
    "editorBracketHighlight.foreground3": "#9DA2B3",
    "editorBracketHighlight.foreground4": "#9DA2B3",
    "editorBracketHighlight.foreground5": "#9DA2B3",
    "editorBracketHighlight.foreground6": "#9DA2B3",
    "input.background": "#16171B",
    "input.border": "#3A3D48",
    "focusBorder": "#5BC49A",
    "widget.shadow": "#00000066",
    "foreground": "#ECEDF2",
    "descriptionForeground": "#8A8FA0",
    "editor.rangeHighlightBackground": "#5BC49A12",
    "textLink.foreground": "#5BC49A",
    "textLink.activeForeground": "#7FD6B0",
    "editorHoverWidget.statusBarBackground": "#1B1C21",
    "keybindingLabel.background": "#292B33",
    "keybindingLabel.border": "#3A3D48",
    "keybindingLabel.bottomBorder": "#3A3D48",
    "keybindingLabel.foreground": "#A9ADBB",
    "pickerGroup.foreground": "#5BC49A",
    "pickerGroup.border": "#2B2D35",
  },
  light: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#1C1F26",
    "editorLineNumber.foreground": "#6E7383",
    "editorLineNumber.activeForeground": "#15171C",
    "editor.lineHighlightBackground": "#F5F6F9",
    "editor.lineHighlightBorder": "#00000000",
    "editorCursor.foreground": "#085A40",
    "editor.selectionBackground": "#0B6E4F2E",
    "editor.selectionForeground": "#1C1F26",
    "editor.inactiveSelectionBackground": "#0B6E4F1A",
    "editor.selectionHighlightBackground": "#0B6E4F1A",
    "editor.wordHighlightBackground": "#0B6E4F14",
    "editor.findMatchBackground": "#E0A73A66",
    "editor.findMatchHighlightBackground": "#E0A73A33",
    "editorBracketMatch.background": "#0B6E4F1F",
    "editorBracketMatch.border": "#0B6E4F66",
    "editorIndentGuide.background1": "#E3E6EC",
    "editorIndentGuide.activeBackground1": "#C9CED8",
    "editorWhitespace.foreground": "#D2D6DF",
    "editorError.foreground": "#C2362F",
    "editorWarning.foreground": "#9A5800",
    "editorInfo.foreground": "#0B6E4F",
    "editorOverviewRuler.border": "#00000000",
    "scrollbarSlider.background": "#9AA1B040",
    "scrollbarSlider.hoverBackground": "#9AA1B080",
    "scrollbarSlider.activeBackground": "#9AA1B0AA",
    "editorWidget.background": "#FFFFFF",
    "editorWidget.border": "#D2D6DF",
    "editorHoverWidget.background": "#FFFFFF",
    "editorHoverWidget.border": "#D2D6DF",
    "editorSuggestWidget.background": "#FFFFFF",
    "editorSuggestWidget.border": "#D2D6DF",
    "editorSuggestWidget.selectedBackground": "#0B6E4F1C",
    "editorSuggestWidget.highlightForeground": "#085A40",
    "list.hoverBackground": "#EEF0F4",
    "quickInput.background": "#FFFFFF",
    "quickInputList.focusBackground": "#0B6E4F1C",
    "quickInputList.focusForeground": "#15171C",
    "editorSuggestWidget.selectedForeground": "#15171C",
    "list.highlightForeground": "#085A40",
    "list.focusHighlightForeground": "#085A40",
    "editorBracketHighlight.foreground1": "#5A6070",
    "editorBracketHighlight.foreground2": "#5A6070",
    "editorBracketHighlight.foreground3": "#5A6070",
    "editorBracketHighlight.foreground4": "#5A6070",
    "editorBracketHighlight.foreground5": "#5A6070",
    "editorBracketHighlight.foreground6": "#5A6070",
    "input.background": "#FFFFFF",
    "input.border": "#D2D6DF",
    "focusBorder": "#0B6E4F",
    "widget.shadow": "#15171C26",
    "foreground": "#15171C",
    "descriptionForeground": "#626979",
    "editor.rangeHighlightBackground": "#0B6E4F0D",
    "textLink.foreground": "#0B6E4F",
    "textLink.activeForeground": "#085A40",
    "editorHoverWidget.statusBarBackground": "#F7F8FA",
    "keybindingLabel.background": "#EEF0F4",
    "keybindingLabel.border": "#D2D6DF",
    "keybindingLabel.bottomBorder": "#D2D6DF",
    "keybindingLabel.foreground": "#4A5060",
    "pickerGroup.foreground": "#0B6E4F",
    "pickerGroup.border": "#E3E6EC",
  },
} as const;

// Defines a light and a dark Monaco theme for every syntax colour scheme.
function defineSyntaxThemes(monaco: typeof import("monaco-editor")) {
  const hex = (color: string) => color.replace("#", "");
  for (const scheme of SYNTAX_COLOR_SCHEMES) {
    for (const mode of ["dark", "light"] as const) {
      const colors = scheme[mode];
      monaco.editor.defineTheme(monacoThemeName(scheme.id, mode), {
        base: mode === "dark" ? "vs-dark" : "vs",
        inherit: true,
        rules: [
          { token: "", foreground: hex(colors.identifier) },
          { token: "keyword", foreground: hex(colors.keyword), fontStyle: scheme.boldKeywords ? "bold" : "" },
          { token: "type", foreground: hex(colors.type) },
          { token: "predefined", foreground: hex(colors.routine) },
          { token: "string", foreground: hex(colors.string) },
          { token: "comment", foreground: hex(colors.comment), fontStyle: "italic" },
          { token: "number", foreground: hex(colors.number) },
          { token: "number.float", foreground: hex(colors.number) },
          { token: "operator", foreground: hex(colors.operator) },
          { token: "identifier", foreground: hex(colors.identifier) },
          { token: "delimiter", foreground: hex(colors.operator) },
        ],
        colors: EDITOR_SURFACE_COLORS[mode],
      });
    }
  }
}

export const MonacoPseudocodeEditor = memo(function MonacoPseudocodeEditor({
  value,
  onChange,
  diagnostics,
  theme,
  documentKey,
  syntaxId = "cambridge-igcse",
  colorScheme = DEFAULT_SYNTAX_COLOR_SCHEME,
  commands,
  apiRef,
}: MonacoPseudocodeEditorProps) {
  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);
  const autocomplete = useDictionary().editor.autocomplete;
  useEffect(() => {
    autocompleteText = autocomplete;
  }, [autocomplete]);
  const syntax = useMemo(() => resolveSyntax(syntaxId), [syntaxId]);
  const languageId = languageIdForSyntax(syntax.id);
  const keywordLookup = useMemo(() => keywordLookupForSyntax(syntax), [syntax]);
  const keywordLookupRef = useRef(keywordLookup);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const touchFocusCleanupRef = useRef<(() => void) | null>(null);
  // The editor keeps the first onMount it is given, so mount reads the current theme through a ref.
  const themeName = monacoThemeName(colorScheme, theme);
  const themeNameRef = useRef(themeName);
  const appleTouchDevice = useMemo(() => isAppleTouchDevice(typeof navigator === "undefined" ? undefined : navigator), []);
  const [touchScreen] = useState(
    () => appleTouchDevice || (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true),
  );
  const editorOptions = useMemo(
    () => getPseudocodeEditorOptions(appleTouchDevice, touchScreen),
    [appleTouchDevice, touchScreen],
  );

  // Monaco loads in small steps (monacoLocalLoader) so that taps during loading stay responsive.
  const [monacoReady, setMonacoReady] = useState(false);
  const [loadingError, setLoadingError] = useState<unknown>(null);
  useEffect(() => {
    let active = true;
    void initializeMonaco(editorOptions).then(
      () => { if (active) setMonacoReady(true); },
      (error: unknown) => { if (active) setLoadingError(error); },
    );
    return () => { active = false; };
  }, [editorOptions]);

  const handleBeforeMount: BeforeMount = () => {
    void ensureMonacoNullCaretHitTestGuard();
  };

  const markersRef = useRef<Monaco.editor.IMarkerData[]>([]);
  const markers = useMemo(() => {
    return diagnostics.map((diagnostic) => ({
      startLineNumber: diagnostic.line,
      startColumn: diagnostic.column,
      endLineNumber: diagnostic.endLine,
      endColumn: Math.max(diagnostic.endColumn + 1, diagnostic.column + 1),
      // Message first (as in Problems); the code shows as Monaco's secondary label.
      message: `${diagnostic.message}${diagnostic.hint ? `\nHint: ${diagnostic.hint}` : ""}`,
      code: diagnostic.code,
      severity:
        diagnostic.severity === "error"
          ? 8
          : diagnostic.severity === "warning"
            ? 4
            : 2,
    }));
  }, [diagnostics]);

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    registerLoadedMonaco(monaco);
    editorRef.current = editor;
    touchFocusCleanupRef.current?.();
    touchFocusCleanupRef.current = null;

    if (!pseudocodeLanguageRegistered) {
      pseudocodeLanguageRegistered = true;
      const languageConfig = {
        brackets: [
          ["(", ")"],
          ["[", "]"],
        ],
        autoClosingPairs: [
          { open: "\"", close: "\"" },
          { open: "'", close: "'" },
          { open: "(", close: ")" },
          { open: "[", close: "]" },
        ],
        surroundingPairs: [
          { open: "\"", close: "\"" },
          { open: "'", close: "'" },
          { open: "(", close: ")" },
          { open: "[", close: "]" },
        ],
      } as const;

      for (const option of SYNTAX_OPTIONS) {
        const id = languageIdForSyntax(option.id);
        const keywords = syntaxKeywords(option).map((keyword) =>
          option.keywordCase === "lower" ? keyword : keyword,
        );
        const escape = (keyword: string) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Data types get their own colour, so they are classified before the general keyword rule.
        const typeKeywords = keywords.filter((keyword) => DATA_TYPE_NAMES.has(keyword.toUpperCase()));
        const otherKeywords = keywords.filter((keyword) => !DATA_TYPE_NAMES.has(keyword.toUpperCase()));
        const pattern = otherKeywords.map(escape).join("|");
        const typePattern = typeKeywords.map(escape).join("|");
        monaco.languages.register({ id });
        monaco.languages.setMonarchTokensProvider(id, {
          ignoreCase: option.keywordCase === "any",
          tokenizer: {
            root: [
              [/#.*$/, "comment"],
              [/\/\/.*$/, "comment"],
              ...(typePattern ? [[new RegExp(`\\b(${typePattern})\\b`), "type"] as [RegExp, string]] : []),
              [new RegExp(`\\b(${pattern})\\b`), "keyword"],
              [/\b[0-9]+\.[0-9]+\b/, "number.float"],
              [/\b[0-9]+\b/, "number"],
              [/"[^"\\n]*"/, "string"],
              [/'[^'\\n]*'/, "string"],
              [/\u2190|<-|==|!=|<>|<=|>=|\u2260|\u2264|\u2265|=|<|>|\+|-|\*|\/|\^|&/, "operator"],
              [/\b[A-Za-z_][A-Za-z0-9_]*\b/, "identifier"],
              [/[:,()\[\].]/, "delimiter"],
            ],
          },
        });
        monaco.languages.setLanguageConfiguration(id, languageConfig);
      }

      monaco.languages.register({ id: "igcse-pseudocode" });
      monaco.languages.setMonarchTokensProvider("igcse-pseudocode", {
        tokenizer: {
          root: [
            [/\/\/.*$/, "comment"],
            [new RegExp(`\\b(${ROUTINE_KEYWORDS.join("|")})\\b`), "keyword"],
            [new RegExp(`\\b(${TYPE_KEYWORDS.join("|")})\\b`), "type"],
            [new RegExp(`\\b(${FLOW_KEYWORDS.join("|")})\\b`), "keyword"],
            [/\b[0-9]+\.[0-9]+\b/, "number.float"],
            [/\b[0-9]+\b/, "number"],
            [/"[^"\\n]*"/, "string"],
            [/'[^'\\n]*'/, "string"],
            [/\u2190|<-/, "operator"],
            [/<=|>=|<>|=|<|>|\+|-|\*|\/|\^/, "operator"],
            [/\b[A-Za-z][A-Za-z0-9]*\b/, "identifier"],
            [/[:,()\[\]]/, "delimiter"],
          ],
        },
      });
      monaco.languages.setLanguageConfiguration("igcse-pseudocode", languageConfig);
    }

    if (!pseudocodeCompletionProviderRegistered) {
      pseudocodeCompletionProviderRegistered = true;
      monaco.languages.registerCompletionItemProvider({ language: "*" }, {
        provideCompletionItems(model: Monaco.editor.ITextModel, position: Monaco.Position) {
          const modelLanguage = model.getLanguageId();
          if (modelLanguage !== "igcse-pseudocode" && !modelLanguage.startsWith("pseudo-")) {
            return { suggestions: [] };
          }
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const activeSyntax =
            SYNTAX_OPTIONS.find((option) => languageIdForSyntax(option.id) === modelLanguage) ??
            resolveSyntax("cambridge-igcse");
          const activeKeywords = syntaxKeywords(activeSyntax);
          const keywordSuggestions = activeKeywords.map((keyword, index) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
            sortText: `1_${String(index).padStart(3, "0")}`,
          }));

          const routineSuggestions = ROUTINE_SUGGESTIONS.map((routine, index) => ({
            label: routine.label,
            detail: autocompleteText[routine.detail],
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: routine.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: `0_${String(index).padStart(3, "0")}`,
          }));

          const shorthandSuggestions = [
            {
              label: autocompleteText.printAlias,
              detail: autocompleteText.outputAlias,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "OUTPUT ${1:\"text\"}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              filterText: "print p tab",
              range,
              sortText: "0_001",
            },
            {
              label: "p -> OUTPUT",
              detail: autocompleteText.quickStarter,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "OUTPUT ${1:\"text\"}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              filterText: "p tab",
              range,
              sortText: "0_000",
            },
            {
              label: "o -> OUTPUT",
              detail: autocompleteText.quickStarter,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "OUTPUT ${1:\"text\"}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              filterText: "o tab",
              range,
              sortText: "0_003",
            },
            {
              label: "i -> INPUT",
              detail: autocompleteText.quickStarter,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "INPUT ${1:Variable}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              filterText: "i tab",
              range,
              sortText: "0_002",
            },
          ];

          return { suggestions: [...routineSuggestions, ...shorthandSuggestions, ...keywordSuggestions] };
        },
      });
    }

    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId);
      // Diagnostics that arrived while Monaco was still loading.
      monaco.editor.setModelMarkers(model, "igcse-compiler", markersRef.current);
    }

    for (const command of commandsRef.current ?? []) {
      editor.addAction({
        id: `pseudoeditor.${command.id}`,
        label: command.label,
        keybindings: command.shortcuts.map((shortcut) => toMonacoKeybinding(monaco, shortcut)),
        run: () => {
          // Look the handler up at run time so the action always calls the current one.
          commandsRef.current?.find((candidate) => candidate.id === command.id)?.run();
        },
      });
    }

    const publishCursor = () => {
      const position = editor.getPosition();
      const selection = editor.getSelection();
      const activeModel = editor.getModel();
      if (!position) {
        return;
      }
      setEditorCursor({
        line: position.lineNumber,
        column: position.column,
        selectedCharacters: selection && activeModel ? activeModel.getValueLengthInRange(selection) : 0,
      });
    };
    editor.onDidChangeCursorSelection(publishCursor);
    editor.onDidChangeModel(publishCursor);
    publishCursor();

    if (apiRef) {
      apiRef.current = {
        focus: () => editor.focus(),
        showsDocument: (documentKey) => editor.getModel()?.uri.toString() === modelPathForDocument(documentKey),
        revealPosition: (line, column) => {
          editor.setSelection(new monaco.Selection(line, column, line, column));
          editor.revealPositionInCenterIfOutsideViewport({ lineNumber: line, column });
          editor.focus();
        },
        openCommandPalette: () => {
          editor.focus();
          void editor.getAction("editor.action.quickCommand")?.run();
        },
        goToLine: () => {
          editor.focus();
          void editor.getAction("editor.action.gotoLine")?.run();
        },
      };
    }

    const insertQuotePair = (quote: "\"" | "'") => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      if (!model || !selection) {
        return false;
      }

      const lineContent = model.getLineContent(selection.positionLineNumber);
      const charAfter = lineContent[selection.positionColumn - 1] ?? "";

      if (selection.isEmpty() && charAfter === quote) {
        editor.setPosition({
          lineNumber: selection.positionLineNumber,
          column: selection.positionColumn + 1,
        });
        return true;
      }

      const selectedText = model.getValueInRange(selection);
      editor.executeEdits("quote-pair", [
        {
          range: selection,
          text: `${quote}${selectedText}${quote}`,
          forceMoveMarkers: true,
        },
      ]);

      if (selection.isEmpty()) {
        editor.setPosition({
          lineNumber: selection.positionLineNumber,
          column: selection.positionColumn + 1,
        });
      } else {
        editor.setSelection(
          new monaco.Selection(
            selection.selectionStartLineNumber,
            selection.selectionStartColumn + 1,
            selection.positionLineNumber,
            selection.positionColumn + 1,
          ),
        );
      }
      return true;
    };

    let lastTabKeydownAt = 0;

    editor.onKeyDown((event) => {
      const browserKey = event.browserEvent.key;
      if (browserKey === "Tab") {
        lastTabKeydownAt = Date.now();
      }
      // Match the character typed, not the physical key: on UK, German and other layouts the key labelled
      // "Quote" on a US keyboard types something else entirely.
      const browserEvent = event.browserEvent;
      const isQuoteKey =
        (browserKey === "\"" || browserKey === "'") &&
        !browserEvent.isComposing &&
        !browserEvent.ctrlKey &&
        !browserEvent.metaKey &&
        !browserEvent.altKey;
      if (isQuoteKey) {
        const quote = browserKey === "\"" ? "\"" : "'";
        const paired = insertQuotePair(quote);
        if (paired) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    let isProgrammaticEdit = false;
    editor.onDidChangeModelContent((event) => {
      if (isProgrammaticEdit) {
        return;
      }

      const model = editor.getModel();
      if (!model) {
        return;
      }

      if (event.changes.length === 1) {
        const change = event.changes[0];
        if (change.text === "-") {
          const lineNumber = change.range.startLineNumber;
          const insertedAtColumn = change.range.startColumn;
          if (insertedAtColumn > 1) {
            const lineContent = model.getLineContent(lineNumber);
            const previousChar = lineContent[insertedAtColumn - 2] ?? "";
            const currentChar = lineContent[insertedAtColumn - 1] ?? "";
            if (previousChar === "<" && currentChar === "-") {
              isProgrammaticEdit = true;
              editor.executeEdits("arrow-shortcut", [
                {
                  range: new monaco.Range(lineNumber, insertedAtColumn - 1, lineNumber, insertedAtColumn + 1),
                  text: "\u2190",
                  forceMoveMarkers: true,
                },
              ]);
              editor.setPosition({ lineNumber, column: insertedAtColumn });
              isProgrammaticEdit = false;
              return;
            }
          }
        }
      }

      const shouldAutoCorrectForThisChange = Date.now() - lastTabKeydownAt <= 250;
      if (!shouldAutoCorrectForThisChange) {
        return;
      }

      const affectedLines = new Set<number>();
      for (const change of event.changes) {
        const insertedLineCount = change.text.split(/\r?\n/).length - 1;
        const endLine = Math.max(change.range.endLineNumber, change.range.startLineNumber + insertedLineCount);
        for (let line = change.range.startLineNumber; line <= endLine; line += 1) {
          if (line >= 1 && line <= model.getLineCount()) {
            affectedLines.add(line);
          }
        }
      }

      if (affectedLines.size === 0) {
        return;
      }

      const edits: Monaco.editor.IIdentifiedSingleEditOperation[] = [];
      for (const lineNumber of affectedLines) {
        const lineContent = model.getLineContent(lineNumber);
        const correctedLine = autoCorrectPseudocodeLine(lineContent, keywordLookupRef.current);
        if (correctedLine === lineContent) {
          continue;
        }
        edits.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          text: correctedLine,
          forceMoveMarkers: true,
        });
      }

      if (edits.length === 0) {
        return;
      }

      const currentPosition = editor.getPosition();
      isProgrammaticEdit = true;
      editor.executeEdits("keyword-autocorrect", edits);
      if (currentPosition) {
        editor.setPosition(currentPosition);
      }
      isProgrammaticEdit = false;
    });

    defineSyntaxThemes(monaco);
    monaco.editor.setTheme(themeNameRef.current);

    if (appleTouchDevice) {
      const editorElement = editor.getDomNode();
      const handleTouchFocus = (event: globalThis.PointerEvent) => {
        if (event.pointerType === "mouse") {
          return;
        }

        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target?.closest(".iPadShowKeyboard")) {
          return;
        }

        window.requestAnimationFrame(() => {
          editor.focus();
        });
      };

      editorElement?.addEventListener("pointerup", handleTouchFocus, { passive: true });
      touchFocusCleanupRef.current = () => {
        editorElement?.removeEventListener("pointerup", handleTouchFocus);
      };
    }
  };

  useEffect(
    () => () => {
      touchFocusCleanupRef.current?.();
      touchFocusCleanupRef.current = null;
      if (apiRef) apiRef.current = null;
      setEditorCursor(null);
    },
    [apiRef],
  );

  useEffect(() => {
    markersRef.current = markers;
    if (!monacoRef.current || !editorRef.current) {
      return;
    }
    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }
    monacoRef.current.editor.setModelMarkers(model, "igcse-compiler", markers);
  }, [markers, documentKey]);

  useEffect(() => {
    themeNameRef.current = themeName;
    monacoRef.current?.editor.setTheme(themeName);
  }, [themeName]);

  useEffect(() => {
    keywordLookupRef.current = keywordLookup;
  }, [keywordLookup]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!monaco || !model) {
      return;
    }
    monaco.editor.setModelLanguage(model, languageId);
  }, [languageId, documentKey]);

  // Creating a Monaco editor takes about 100 ms on a tablet. A tap that opens a file would wait for
  // it before painting, so the editor for a document is created after the next paint instead.
  const [readyDocumentKey, setReadyDocumentKey] = useState<string | undefined | null>(null);
  useEffect(() => afterNextPaint(() => setReadyDocumentKey(documentKey)), [documentKey]);

  if (loadingError) throw loadingError;
  if (!monacoReady || readyDocumentKey !== documentKey) {
    return <EditorLoader />;
  }

  return (
    <Editor
      // One editor per document: on switch the wrapper saves this file's view state under its own path and the next
      // editor restores its own, while keepCurrentModel keeps every file's model (and undo history) alive.
      key={documentKey}
      height="100%"
      path={modelPathForDocument(documentKey)}
      keepCurrentModel
      defaultLanguage={languageId}
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={editorOptions}
      loading={<EditorLoader />}
    />
  );
});
