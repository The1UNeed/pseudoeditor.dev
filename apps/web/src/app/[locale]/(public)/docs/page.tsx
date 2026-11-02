import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { PublicListLink, publicListClassName } from "@/app/components/PublicUi";
import { localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { docPath, getGuides, getUnit, guideUnitIds } from "@/lib/docs";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/docs", t.docsTitle, t.docsDescription, t.ogImageAlt);
}

export default async function DocsIndexPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).docs;
  const guides = getGuides(locale);
  const href = (path: string) => localePath(locale, path);
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
      itemListElement: guides.map((doc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: doc.title,
        url: localeUrl(locale, docPath(doc)),
      })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="docs" />
      <section className="site-wrap grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <p className="site-eyebrow">{t.eyebrow}</p>
          <h1 className="site-h1 mt-4 max-w-3xl">{t.title}</h1>
          <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
        </div>
        <div className="site-card p-5">
          <h2 className="text-sm font-semibold">{t.startHere}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text2)]">{t.startHereBody}</p>
          <Link href={href("/docs/getting-started")} className="site-btn site-btn-accent mt-4">
            {t.startHereCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {guideUnitIds.map((id) => {
        const unit = getUnit(locale, id);
        return (
          <section key={id} id={id} className="site-wrap scroll-mt-20 pb-16">
            <h2 className="site-h2">{unit.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text2)]">{unit.summary}</p>
            <div className={`mt-6 ${publicListClassName}`}>
              {guides.filter((doc) => doc.unit === id).map((doc) => (
                <PublicListLink key={doc.slug} href={href(docPath(doc))} title={doc.title} description={doc.description} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="site-wrap pb-20">
        <div className="border-t border-[var(--separator)] pt-8">
          <h2 className="site-h2">{t.lessonsTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text2)]">{t.lessonsBody}</p>
          <Link href={href("/lessons")} className="site-btn mt-5">
            {t.lessonsCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
