import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { PublicListLink, publicListClassName } from "@/app/components/PublicUi";
import { unitIcons } from "@/app/components/docs/unitIcons";
import { localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getDocs, getUnitDocs, getUnits } from "@/lib/docs";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/docs", t.docsTitle, t.docsDescription, t.ogImageAlt);
}

export default async function DocsIndexPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).docs;
  const docs = getDocs(locale);
  const units = getUnits(locale);
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
      <section className="site-wrap grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <p className="site-eyebrow">{t.eyebrow}</p>
          <h1 className="site-h1 mt-4 max-w-3xl">{t.title}</h1>
          <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
        </div>
        <div className="site-card p-5">
          <p className="text-sm font-semibold">{t.startHere}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text2)]">{t.startHereBody}</p>
          <Link href={href(`/docs/${docs[0].slug}`)} className="site-btn site-btn-accent mt-4">
            {t.startHereCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {([1, 2] as const).map((paper) => (
        <section key={paper} className="site-wrap pb-16">
          <div className="border-t border-[var(--separator)] pt-8">
            <p className="site-eyebrow">
              {t.paper} {paper}
            </p>
            <h2 className="site-h2 mt-2">{t.paperTitles[paper]}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text2)]">{t.paperSummaries[paper]}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {units
              .filter((unit) => unit.paper === paper)
              .map((unit) => {
                const Icon = unitIcons[unit.id];
                const lessons = getUnitDocs(locale, unit.id);
                return (
                  <article key={unit.id} id={unit.id} className="site-card flex flex-col p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text3)]">
                          {t.unit} {unit.number} · {lessons.length === 1 ? t.lessonCountOne : fill(t.lessonCount, { n: lessons.length })}
                        </p>
                        <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{unit.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{unit.summary}</p>
                      </div>
                    </div>
                    <ol className="mt-4 border-t border-[var(--separator)] pt-3">
                      {lessons.map((doc, index) => (
                        <li key={doc.slug}>
                          <Link
                            href={href(`/docs/${doc.slug}`)}
                            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-[var(--hover)]"
                          >
                            <span className="w-5 shrink-0 text-right font-mono text-xs text-[var(--text3)]">
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 text-[var(--text2)] transition group-hover:text-[var(--text)]">
                              {doc.title}
                            </span>
                            <ArrowRight size={14} className="shrink-0 text-[var(--text3)] opacity-0 transition group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
          </div>
        </section>
      ))}

      <section className="site-wrap pb-20">
        <div className="border-t border-[var(--separator)] pt-8">
          <h2 className="site-h2">{t.toolsTitle}</h2>
        </div>
        <div className={`mt-6 ${publicListClassName}`}>
          {getUnitDocs(locale, "pseudoeditor").map((doc) => (
            <PublicListLink key={doc.slug} href={href(`/docs/${doc.slug}`)} title={doc.title} description={doc.description} />
          ))}
        </div>
      </section>
    </main>
  );
}
