import { describe, expect, it } from "vitest";
import { practiceQuestions } from "@/lib/practice-questions";
import { docs } from "@/lib/docs";
import { posts } from "@/lib/seo-content";
import sitemap from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("lists every page once per locale", () => {
    expect(entries).toHaveLength((10 + docs.length + posts.length + practiceQuestions.length) * 2);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("https://www.pseudoeditor.dev");
    expect(urls).toContain("https://www.pseudoeditor.dev/zh");
    expect(urls).toContain("https://www.pseudoeditor.dev/practice");
    expect(urls).toContain(`https://www.pseudoeditor.dev/practice/${practiceQuestions[0].id}`);
    expect(urls).toContain(`https://www.pseudoeditor.dev/docs/${docs[0].slug}`);
    expect(urls).toContain(`https://www.pseudoeditor.dev/zh/blog/${posts[0].slug}`);
    expect(urls.some((url) => url.includes("/en/") || url.endsWith("/en"))).toBe(false);
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
});
