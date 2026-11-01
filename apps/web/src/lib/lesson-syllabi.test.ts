import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { getLessons } from "./docs";
import { getLessonCatalog, syllabusReferences } from "./lesson-syllabi";

describe("syllabus references", () => {
  it("attaches a real PDF and maps only existing lessons in every language", () => {
    for (const reference of syllabusReferences) {
      const pdf = readFileSync(resolve(process.cwd(), "public", reference.file.slice(1)));
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.subarray(-1024).toString()).toContain("%%EOF");
      for (const slug of reference.slugs ?? []) {
        for (const locale of locales) {
          expect(getLessons(locale).some((doc) => doc.slug === slug), `${locale}: ${slug}`).toBe(true);
        }
      }
    }
    for (const locale of locales) {
      const catalog = getLessonCatalog(locale);
      expect(catalog[0].units.flatMap((unit) => unit.lessons)).toHaveLength(getLessons(locale).length);
      expect(catalog.every((course) => course.units.length > 0)).toBe(true);
    }
  });
});
