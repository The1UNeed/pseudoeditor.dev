import { describe, expect, it } from "vitest";
import { practiceQuestions } from "@/lib/practice-questions";
import { docs, docPath, getGuides, getLessons } from "@/lib/docs";
import { posts } from "@/lib/seo-content";
import { courseLessonPath, getCourseLessons, getLessonCatalog } from "@/lib/lesson-syllabi";
import sitemap from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("lists every page once per locale", () => {
    const coursePages = getLessonCatalog("en").filter((course) => course.id !== "igcse").flatMap((course) => getCourseLessons("en", course.id));
    expect(entries).toHaveLength((11 + docs.length + coursePages.length + posts.length + practiceQuestions.length) * 2);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("https://www.pseudoeditor.dev");
    expect(urls).toContain("https://www.pseudoeditor.dev/zh");
    expect(urls).toContain("https://www.pseudoeditor.dev/practice");
    expect(urls).toContain(`https://www.pseudoeditor.dev/practice/${practiceQuestions[0].id}`);
    expect(urls).toContain("https://www.pseudoeditor.dev/docs");
    expect(urls).toContain("https://www.pseudoeditor.dev/lessons");
    expect(urls).toContain(`https://www.pseudoeditor.dev${docPath(docs[0])}`);
    expect(urls).toContain(`https://www.pseudoeditor.dev/zh/blog/${posts[0].slug}`);
    expect(urls.some((url) => url.includes("/en/") || url.endsWith("/en"))).toBe(false);
  });

  it("publishes only canonical URLs for lessons and studio guides", () => {
    for (const lesson of getLessons("en")) {
      expect(urls).toContain(`https://www.pseudoeditor.dev/lessons/${lesson.slug}`);
      expect(urls).toContain(`https://www.pseudoeditor.dev/zh/lessons/${lesson.slug}`);
      expect(urls).not.toContain(`https://www.pseudoeditor.dev/docs/${lesson.slug}`);
    }
    for (const guide of getGuides("en")) {
      expect(urls).toContain(`https://www.pseudoeditor.dev/docs/${guide.slug}`);
      expect(urls).not.toContain(`https://www.pseudoeditor.dev/lessons/${guide.slug}`);
    }
  });

  it("indexes course-specific lesson pages in both languages", () => {
    for (const course of getLessonCatalog("en")) {
      for (const lesson of getCourseLessons("en", course.id)) {
        const path = courseLessonPath(course.id, lesson.slug);
        expect(urls).toContain(`https://www.pseudoeditor.dev${path}`);
        expect(urls).toContain(`https://www.pseudoeditor.dev/zh${path}`);
      }
    }
  });

  it("gives both locale rows the same hreflang set", () => {
    const privacy = entries.filter((entry) => entry.url.endsWith("/privacy"));
    expect(privacy.map((entry) => entry.url)).toEqual(["https://www.pseudoeditor.dev/privacy", "https://www.pseudoeditor.dev/zh/privacy"]);
    for (const entry of privacy) {
      expect(entry.alternates?.languages).toEqual({
        en: "https://www.pseudoeditor.dev/privacy",
        "zh-CN": "https://www.pseudoeditor.dev/zh/privacy",
        "x-default": "https://www.pseudoeditor.dev/privacy",
      });
    }
  });

  it("dates the blog index by its newest post", () => {
    const blog = entries.find((entry) => entry.url === "https://www.pseudoeditor.dev/blog");
    const newest = posts.map((post) => post.date).sort().at(-1);
    expect(blog?.lastModified).toEqual(new Date(newest!));
  });
});
