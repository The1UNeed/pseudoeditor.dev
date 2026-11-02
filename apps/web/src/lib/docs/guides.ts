import type { Locale } from "@/i18n/config";
import { pseudocodeReferenceEn } from "./en/pseudocode-reference";
import { pseudoeditorEn } from "./en/pseudoeditor";
import type { Doc } from "./types";
import { pseudocodeReferenceZh } from "./zh/pseudocode-reference";
import { pseudoeditorZh } from "./zh/pseudoeditor";

/** The /docs guides on their own, so the editor's docs panel doesn't bundle every lesson. */
export const guidesByLocale: Record<Locale, Doc[]> = {
  en: [...pseudoeditorEn, ...pseudocodeReferenceEn],
  zh: [...pseudoeditorZh, ...pseudocodeReferenceZh],
};
