import { describe, expect, it } from "vitest";
import { getPosts } from "./seo-content";

describe("blog posts", () => {
  it("keeps the same slugs and dates in English and Chinese", () => {
    const shape = (locale: "en" | "zh") => getPosts(locale).map((post) => [post.slug, post.date]);
    expect(shape("zh")).toEqual(shape("en"));
    const slugs = getPosts("en").map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("lists the newest post first", () => {
    const dates = getPosts("en").map((post) => post.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(getPosts("en")[0].slug).toBe("flowchart-mode-out-of-beta");
  });
});
