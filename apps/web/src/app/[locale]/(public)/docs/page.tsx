import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { publicListClassName } from "@/app/components/PublicUi";
import { localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getDocs } from "@/lib/seo-content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/docs", t.docsTitle, t.docsDescription, t.ogImageAlt);
}

export default async function DocsIndexPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).docs;
  const docs = getDocs(locale);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: localeUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t.back, item: localeUrl(locale, "/docs") },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: localeTags[locale],
      itemListElement: docs.map((doc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: doc.title,
        url: localeUrl(locale, `/docs/${doc.slug}`),
      })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="docs" />
      <section className="site-wrap py-14 md:py-20">
        <p className="site-eyebrow">{t.eyebrow}</p>
        <h1 className="site-h1 mt-4">{t.title}</h1>
        <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
      </section>
      <section className="site-wrap pb-20">
        <div className={publicListClassName}>
          {docs.map((doc, index) => (
            <Link
              key={doc.slug}
              href={localePath(locale, `/docs/${doc.slug}`)}
              className="group flex items-start justify-between gap-6 py-5"
            >
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-[var(--text3)]">
                  {t.guide} {index + 1}
                </p>
                <h2 className="text-base font-semibold transition group-hover:text-[var(--accent)]">{doc.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{doc.description}</p>
              </div>
              <span className="mt-1 hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--text3)] transition group-hover:text-[var(--accent)] sm:inline-flex">
                {t.readGuide} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
