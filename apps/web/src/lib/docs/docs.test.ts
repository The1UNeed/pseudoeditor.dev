import { describe, expect, it } from "vitest";
import { compilePseudocode } from "@pseudoeditor/compiler";
import { locales } from "@/i18n/config";
import { getDocNeighbors, getDocs, getUnitDocs, getUnits } from "./index";

describe("docs course", () => {
  it("has the same lessons, units, and visuals in every locale", () => {
    const shape = (locale: (typeof locales)[number]) =>
      getDocs(locale).map((doc) => ({
        slug: doc.slug,
        unit: doc.unit,
        visuals: doc.sections.map((section) => section.visual?.kind ?? null),
        examples: doc.sections.map((section) => section.example ?? null),
      }));
    for (const locale of locales) {
      expect(shape(locale)).toEqual(shape("en"));
    }
    const slugs = getDocs("en").map((doc) => doc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every unit at least one lesson", () => {
    for (const unit of getUnits("en")) {
      expect(getUnitDocs("en", unit.id).length, unit.id).toBeGreaterThan(0);
    }
  });

  it("compiles every pseudocode example with the Cambridge IGCSE syntax", () => {
    const failures: string[] = [];
    for (const doc of getDocs("en")) {
      for (const section of doc.sections) {
        if (!section.example || (section.exampleLanguage && section.exampleLanguage !== "pseudocode")) continue;
        const result = compilePseudocode({ source: section.example, filename: `${doc.slug}.pseudo`, strict: true, syntaxId: "cambridge-igcse" });
        if (!result.success) {
          const errors = result.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.line}: ${d.message}`);
          failures.push(`${doc.slug} / ${section.heading}: ${errors.join("; ")}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("links lessons in course order", () => {
    const docs = getDocs("en");
    expect(getDocNeighbors("en", docs[0].slug).previous).toBeUndefined();
    expect(getDocNeighbors("en", docs[1].slug).previous?.slug).toBe(docs[0].slug);
    expect(getDocNeighbors("en", docs[docs.length - 1].slug).next).toBeUndefined();
  });

  it("keeps every SQL result row inside its table", () => {
    for (const doc of getDocs("en")) {
      for (const section of doc.sections) {
        if (section.visual?.kind !== "sql") continue;
        const { rows, columns, matches, selected } = section.visual;
        expect(matches.every((index) => index >= 0 && index < rows.length)).toBe(true);
        expect(selected.every((name) => columns.includes(name))).toBe(true);
      }
    }
  });
});
