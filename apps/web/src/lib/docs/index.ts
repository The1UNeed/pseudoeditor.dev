import type { Locale } from "@/i18n/config";
import { docsEn } from "./en";
import { docsZh } from "./zh";
import type { Doc, UnitId } from "./types";
import { guidesByLocale } from "./guides";
import { isGuideUnit, unitIds } from "./units";

export type { Doc, DocSection, DocVisual, Unit, UnitId } from "./types";
export { getUnit, getUnits, guideUnitIds, isGuideUnit } from "./units";

function inCourseOrder(list: Doc[]): Doc[] {
  return unitIds.flatMap((unit) => list.filter((doc) => doc.unit === unit));
}

const docsByLocale: Record<Locale, Doc[]> = { en: inCourseOrder(docsEn), zh: inCourseOrder(docsZh) };

/** English lessons and guides. Slugs are shared by every locale. */
export const docs = docsByLocale.en;

export function getDocs(locale: Locale): Doc[] {
  return docsByLocale[locale];
}

export function isGuide(doc: Doc): boolean {
  return isGuideUnit(doc.unit);
}

export function getLessons(locale: Locale): Doc[] {
  return getDocs(locale).filter((doc) => !isGuide(doc));
}

/** Studio guides, then the pseudocode reference. */
export function getGuides(locale: Locale): Doc[] {
  return guidesByLocale[locale];
}

export function docPath(doc: Doc): string {
  return `${isGuide(doc) ? "/docs" : "/lessons"}/${doc.slug}`;
}

export function getDoc(locale: Locale, slug: string): Doc | undefined {
  return getDocs(locale).find((doc) => doc.slug === slug);
}

export function getUnitDocs(locale: Locale, unit: UnitId): Doc[] {
  return getDocs(locale).filter((doc) => doc.unit === unit);
}

/** Neighbors within the course or the guides, without crossing between /lessons and /docs. */
export function getDocNeighbors(locale: Locale, slug: string): { previous?: Doc; next?: Doc } {
  const doc = getDoc(locale, slug);
  if (!doc) return {};
  const list = isGuide(doc) ? getGuides(locale) : getLessons(locale);
  const index = list.findIndex((doc) => doc.slug === slug);
  if (index === -1) return {};
  return { previous: list[index - 1], next: list[index + 1] };
}
