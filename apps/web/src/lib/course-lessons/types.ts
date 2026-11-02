import type { Locale } from "@/i18n/config";
import type { Doc, DocSection } from "../docs/types";

export type Text = readonly [en: string, zh: string];
export type CourseLesson = Pick<Doc, "slug" | "title" | "description" | "sections" | "quiz" | "updated"> & { group: string };
type Section = Omit<DocSection, "heading" | "body" | "bullets" | "callout" | "caption" | "visualTitle"> & { heading: Text; body: Text[] };
export type Lesson = { slug: string; title: Text; description: Text; group: Text; sections: Section[]; question: Text; answer: Text };

export const section = (heading: Text, body: Text[], example?: string, exampleLanguage?: DocSection["exampleLanguage"], visual?: DocSection["visual"]): Section =>
  ({ heading, body, example, exampleLanguage, visual });

export const lesson = (slug: string, title: Text, description: Text, group: Text, sections: Section[], question: Text, answer: Text): Lesson =>
  ({ slug, title, description, group, sections, question, answer });

export function localizeLessons(lessons: Lesson[], locale: Locale): CourseLesson[] {
  const text = (value: Text) => value[locale === "en" ? 0 : 1];
  return lessons.map((item) => ({
    slug: item.slug, title: text(item.title), description: text(item.description), group: text(item.group), updated: "2026-11-01",
    sections: item.sections.map((part) => ({ ...part, heading: text(part.heading), body: part.body.map(text) })),
    quiz: [{ question: text(item.question), answer: text(item.answer) }],
  }));
}
