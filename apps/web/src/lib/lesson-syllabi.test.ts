import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compilePseudocode } from "@pseudoeditor/compiler";
import { locales } from "@/i18n/config";
import { getLessons } from "./docs";
import { courseLessonPath, getCourseLessons, getLessonCatalog, syllabusReferences } from "./lesson-syllabi";

const expectedCourses = ["igcse", "o-level", "as-a-level", "ap-csp", "ap-cybersecurity", "ap-csa", "ib-hl", "ib-sl"];

describe("course lessons and source references", () => {
  it("offers every requested course with readable lessons in both languages", () => {
    for (const locale of locales) {
      const catalog = getLessonCatalog(locale);
      expect(catalog.map((course) => course.id)).toEqual(expectedCourses);
      for (const course of catalog) {
        const lessons = getCourseLessons(locale, course.id);
        expect(lessons.length, course.id).toBeGreaterThanOrEqual(5);
        expect(new Set(lessons.map((item) => item.slug)).size).toBe(lessons.length);
        expect(course.units.flatMap((unit) => unit.lessons)).toHaveLength(lessons.length);
        for (const item of lessons) {
          expect(item.sections.length).toBeGreaterThanOrEqual(2);
          expect(item.quiz?.length).toBeGreaterThan(0);
        }
      }
      expect(getCourseLessons(locale, "igcse")).toHaveLength(getLessons(locale).length);
    }
  });

  it("gives AP and IB actual course content rather than links into the IGCSE course", () => {
    const catalog = getLessonCatalog("en");
    for (const course of catalog.filter((course) => course.id.startsWith("ap-") || course.id.startsWith("ib-"))) {
      expect(course.units.flatMap((unit) => unit.lessons).every((item) => item.href.startsWith(`/lessons/${course.id}/`))).toBe(true);
    }
    expect(getCourseLessons("en", "ap-csa").some((item) => item.sections.some((part) => part.exampleLanguage === "java"))).toBe(true);
    expect(getCourseLessons("en", "ap-csp").some((item) => item.sections.some((part) => part.exampleLanguage === "ap-pseudocode"))).toBe(true);
    expect(getCourseLessons("en", "ib-sl").some((item) => item.sections.some((part) => part.exampleLanguage === "python"))).toBe(true);
  });

  it("keeps HL-only content out of SL and distinguishes AS from A Level", () => {
    const hl = getCourseLessons("en", "ib-hl");
    const sl = getCourseLessons("en", "ib-sl");
    expect(hl.length).toBeGreaterThan(sl.length);
    expect(hl.some((item) => item.slug === "abstract-data-types")).toBe(true);
    expect(sl.some((item) => item.slug === "abstract-data-types")).toBe(false);
    const aLevel = getCourseLessons("en", "as-a-level");
    expect(aLevel.some((item) => item.group.startsWith("AS Level"))).toBe(true);
    expect(aLevel.some((item) => item.group.startsWith("A Level"))).toBe(true);
  });

  it("preserves lesson identities and examples across translations", () => {
    for (const course of getLessonCatalog("en")) {
      const shape = (locale: typeof locales[number]) => getCourseLessons(locale, course.id).map((item) => ({
        path: courseLessonPath(course.id, item.slug), examples: item.sections.map((part) => [part.exampleLanguage, part.example]),
      }));
      expect(shape("zh")).toEqual(shape("en"));
    }
  });

  it("keeps local PDFs intact and external references on their official publisher domains", () => {
    for (const reference of syllabusReferences) {
      if (reference.file.startsWith("/")) {
        const pdf = readFileSync(resolve(process.cwd(), "public", reference.file.slice(1)));
        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        expect(pdf.subarray(-1024).toString()).toContain("%%EOF");
      } else {
        expect(new URL(reference.file).hostname).toBe("www.cambridgeinternational.org");
      }
      expect(new URL(reference.source).protocol).toBe("https:");
    }
  });

  it("compiles the new Cambridge pseudocode examples as A Level", () => {
    for (const item of getCourseLessons("en", "as-a-level")) {
      for (const part of item.sections.filter((part) => part.exampleLanguage === "pseudocode")) {
        const result = compilePseudocode({ source: part.example!, filename: "lesson.pseudo", strict: true, syntaxId: "cambridge-alevel" });
        expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error"), item.slug).toEqual([]);
      }
    }
  });
});
