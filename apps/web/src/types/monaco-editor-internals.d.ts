declare module "monaco-editor/esm/vs/editor/browser/controller/mouseTarget.js" {
  export const MouseTargetFactory: {
    _doHitTestWithCaretPositionFromPoint?: (...args: unknown[]) => unknown;
  };
}

declare module "monaco-editor/esm/vs/editor/browser/config/fontMeasurements.js" {
  export const FontMeasurements: {
    readFontInfo(targetWindow: Window, fontInfo: unknown): unknown;
  };
}

declare module "monaco-editor/esm/vs/editor/common/config/fontInfoFromSettings.js" {
  export function createBareFontInfoFromRawSettings(
    options: import("monaco-editor").editor.IStandaloneEditorConstructionOptions,
    pixelRatio: number,
  ): unknown;
}
