import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { generateMetadata } from "./page";

describe("sign-in metadata", () => {
  it.each(locales)("excludes %s sign-in pages from search results", async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale }) });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
