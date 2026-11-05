import type { editor } from "monaco-editor";
import { FontMeasurements } from "monaco-editor/esm/vs/editor/browser/config/fontMeasurements.js";
import { createBareFontInfoFromRawSettings } from "monaco-editor/esm/vs/editor/common/config/fontInfoFromSettings.js";

export function prepareMonacoFont(options: editor.IStandaloneEditorConstructionOptions): void {
  // Monaco caches these DOM measurements. Do this in its own task so the first
  // editor.create does not combine font layout with widget/model construction.
  FontMeasurements.readFontInfo(
    window,
    createBareFontInfoFromRawSettings(options, window.devicePixelRatio),
  );
}
