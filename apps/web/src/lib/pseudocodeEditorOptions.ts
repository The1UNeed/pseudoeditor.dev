import type * as Monaco from "monaco-editor";

/**
 * `touchScreen` (any coarse pointer, Android included) sizes text and scrollbars for fingers; `appleTouchDevice`
 * only switches off the input path that iOS/iPadOS Safari handles badly.
 */
export function getPseudocodeEditorOptions(
  appleTouchDevice: boolean,
  touchScreen: boolean = appleTouchDevice,
): Monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    minimap: { enabled: false },
    hideCursorInOverviewRuler: touchScreen,
    fontFamily: "'Fira Code', monospace",
    fontSize: touchScreen ? 16 : 14,
    lineHeight: touchScreen ? 24 : 22,
    lineNumbers: "on",
    lineNumbersMinChars: 3,
    roundedSelection: false,
    automaticLayout: true,
    renderLineHighlight: "all",
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    mouseWheelScrollSensitivity: touchScreen ? 0.7 : 0.85,
    fastScrollSensitivity: 3,
    // One colour for brackets keeps pseudocode calm; matching brackets are still highlighted on the caret.
    bracketPairColorization: { enabled: false },
    stickyScroll: {
      enabled: false,
    },
    padding: {
      top: 8,
      bottom: 18,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    scrollbar: {
      verticalScrollbarSize: touchScreen ? 14 : 10,
      horizontalScrollbarSize: touchScreen ? 14 : 10,
      // Touch screens scroll sideways with a swipe; a floating bar would sit over the phone's tab bar.
      horizontal: touchScreen ? "hidden" : "auto",
      alwaysConsumeMouseWheel: false,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "off",
    acceptSuggestionOnCommitCharacter: false,
    autoClosingQuotes: "always",
    autoClosingBrackets: "always",
    autoSurround: "quotes",
    wordBasedSuggestions: "off",
    snippetSuggestions: "top",
    tabCompletion: "on",
    // Safari on iPhone/iPad exposes EditContext, but Monaco input handling is unreliable there.
    editContext: !appleTouchDevice,
    hover: {
      enabled: !touchScreen,
    },
    occurrencesHighlight: appleTouchDevice ? "off" : "singleFile",
  };
}
