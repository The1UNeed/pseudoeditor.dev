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

/** English lessons and studio guides. Slugs are shared by every locale. */
export const docs = docsByLocale.en;

export function getDocs(locale: Locale): Doc[] {
  return docsByLocale[locale];
}

export function getLessons(locale: Locale): Doc[] {
  return getDocs(locale).filter((doc) => doc.unit !== "pseudoeditor");
}

export function getGuides(locale: Locale): Doc[] {
  return getUnitDocs(locale, "pseudoeditor");
}

export function docPath(doc: Doc): string {
  return `${doc.unit === "pseudoeditor" ? "/docs" : "/lessons"}/${doc.slug}`;
}

export function getDoc(locale: Locale, slug: string): Doc | undefined {
  return getDocs(locale).find((doc) => doc.slug === slug);
}

export function getUnitDocs(locale: Locale, unit: UnitId): Doc[] {
  return getDocs(locale).filter((doc) => doc.unit === unit);
}

/** Neighbors within the course or the studio guides, without crossing sections. */
export function getDocNeighbors(locale: Locale, slug: string): { previous?: Doc; next?: Doc } {
  const doc = getDoc(locale, slug);
  if (!doc) return {};
  const list = doc.unit === "pseudoeditor" ? getGuides(locale) : getLessons(locale);
  const index = list.findIndex((doc) => doc.slug === slug);
  if (index === -1) return {};
  return { previous: list[index - 1], next: list[index + 1] };
}
