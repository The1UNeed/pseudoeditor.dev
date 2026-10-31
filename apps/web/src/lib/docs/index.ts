import type { Locale } from "@/i18n/config";
import { docsEn } from "./en";
import { docsZh } from "./zh";
import type { Doc, UnitId } from "./types";
import { unitIds } from "./units";

export type { Doc, DocSection, DocVisual, Unit, UnitId } from "./types";
export { getUnit, getUnits } from "./units";

function inCourseOrder(list: Doc[]): Doc[] {
  return unitIds.flatMap((unit) => list.filter((doc) => doc.unit === unit));
}

const docsByLocale: Record<Locale, Doc[]> = { en: inCourseOrder(docsEn), zh: inCourseOrder(docsZh) };

/** English lessons in course order. Slugs are shared by every locale. */
export const docs = docsByLocale.en;

export function getDocs(locale: Locale): Doc[] {
  return docsByLocale[locale];
}

export function getDoc(locale: Locale, slug: string): Doc | undefined {
  return getDocs(locale).find((doc) => doc.slug === slug);
}

export function getUnitDocs(locale: Locale, unit: UnitId): Doc[] {
  return getDocs(locale).filter((doc) => doc.unit === unit);
}

/** The lessons before and after `slug` across the whole course. */
export function getDocNeighbors(locale: Locale, slug: string): { previous?: Doc; next?: Doc } {
  const list = getDocs(locale);
  const index = list.findIndex((doc) => doc.slug === slug);
  if (index === -1) return {};
  return { previous: list[index - 1], next: list[index + 1] };
}
