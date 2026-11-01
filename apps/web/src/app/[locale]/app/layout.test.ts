import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/messages";
import { locales, localeUrl } from "@/i18n/config";
import { generateMetadata } from "./layout";

describe("editor metadata", () => {
  it.each(locales)("keeps %s editor canonical and social metadata consistent", async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale }) });
    const { editorTitle, editorDescription } = getDictionary(locale).meta;
    const title = `${editorTitle} | PseudoEditor`;

    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.alternates?.canonical).toBe(localeUrl(locale, "/app"));
    expect(metadata.openGraph).toMatchObject({
      url: localeUrl(locale, "/app"),
      title,
      description: editorDescription,
    });
    expect(metadata.twitter).toMatchObject({ title, description: editorDescription });
  });
});
