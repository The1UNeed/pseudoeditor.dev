import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { DocSectionView } from "@/app/components/docs/DocSectionView";
import { RichText } from "@/app/components/docs/DiagramBlocks";
import { formatDate, localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/server";
import { docs, getDoc, getDocNeighbors, getUnit, getUnitDocs, getUnits } from "@/lib/docs";
import { authorName } from "@/lib/seo-content";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const sectionId = (index: number) => `s${index + 1}`;

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const doc = getDoc(locale, slug);
  if (!doc) return {};

  const base = pageMetadata(
    locale,
    `/docs/${doc.slug}`,
    doc.title,
    doc.description,
    getDictionary(locale).meta.ogImageAlt,
  );
  return { ...base, openGraph: { ...base.openGraph, type: "article", modifiedTime: doc.updated } };
}

export default async function DocPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const doc = getDoc(locale, slug);
  if (!doc) notFound();
  const dict = getDictionary(locale);
  const t = dict.docs;
  const href = (path: string) => localePath(locale, path);
  const unit = getUnit(locale, doc.unit);
  const unitDocs = getUnitDocs(locale, doc.unit);
  const position = unitDocs.findIndex((item) => item.slug === doc.slug) + 1;
  const { previous, next } = getDocNeighbors(locale, doc.slug);
  const unitLabel = unit.number ? `${t.unit} ${unit.number} · ${unit.title}` : unit.title;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": ["TechArticle", "LearningResource"],
      headline: doc.title,
      description: doc.description,
      dateModified: doc.updated,
      inLanguage: localeTags[locale],
      url: localeUrl(locale, `/docs/${doc.slug}`),
      learningResourceType: unit.number ? "lesson" : "reference",
      educationalLevel: "secondary",
      ...(unit.number ? { teaches: unit.title } : {}),
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      isAccessibleForFree: true,
      author: { "@type": "Person", name: authorName },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: localeUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t.back, item: localeUrl(locale, "/docs") },
        { "@type": "ListItem", position: 3, name: doc.title, item: localeUrl(locale, `/docs/${doc.slug}`) },
      ],
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="docs" />
      <div className="site-wrap grid gap-10 py-10 md:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_11rem]">
        <nav aria-label={t.course} className="max-lg:hidden">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 pr-1">
            <Link href={href("/docs")} className="inline-flex items-center gap-2 text-sm font-semibold">
              <ArrowLeft size={15} /> {t.back}
            </Link>
            <ol className="mt-5 space-y-0.5">
              {getUnits(locale).map((item) => {
                const lessons = getUnitDocs(locale, item.id);
                if (!lessons.length) return null;
                const open = item.id === doc.unit;
                return (
                  <li key={item.id}>
                    <Link
                      href={href(`/docs/${lessons[0].slug}`)}
                      className={`flex gap-2 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-[var(--hover)] ${open ? "font-semibold text-[var(--text)]" : "text-[var(--text2)]"}`}
                    >
                      <span className="w-4 shrink-0 text-right tabular-nums text-[var(--text3)]">{item.number ?? "·"}</span>
                      <span>{item.title}</span>
                    </Link>
                    {open ? (
                      <ol className="mb-2 ml-[1.375rem] mt-0.5 border-l border-[var(--separator)] pl-2">
                        {lessons.map((lesson) => (
                          <li key={lesson.slug}>
                            <Link
                              href={href(`/docs/${lesson.slug}`)}
                              className="doc-course-link"
                              aria-current={lesson.slug === doc.slug ? "page" : undefined}
                            >
                              {lesson.title}
                            </Link>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        <article className="min-w-0 max-w-3xl">
          <Link href={href("/docs")} className="inline-flex items-center gap-2 text-sm font-semibold lg:hidden">
            <ArrowLeft size={16} /> {t.back}
          </Link>
          <p className="site-eyebrow mt-6 lg:mt-0">{unitLabel}</p>
          <h1 className="site-h1 mt-3 text-[2.2rem] md:text-[3rem]">{doc.title}</h1>
          <p className="site-lede mt-4">{doc.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text3)]">
            {unit.number ? <span className="site-chip">{fill(t.lessonOf, { n: position, total: unitDocs.length })}</span> : null}
            {doc.syllabus ? (
              <span className="site-chip">
                {t.syllabus} {doc.syllabus}
              </span>
            ) : null}
            <span>
              {t.updated} {formatDate(locale, doc.updated)}
            </span>
          </div>

          <div className="site-prose mt-4">
            {doc.sections.map((section, index) => (
              <DocSectionView key={section.heading} section={section} id={sectionId(index)} t={t.visual} />
            ))}

            {doc.keyTerms?.length ? (
              <section id="key-terms" className="scroll-mt-24">
                <h2>{t.keyTerms}</h2>
                <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
                  {doc.keyTerms.map((item) => (
                    <div key={item.term} className="contents">
                      <dt className="text-sm font-semibold text-[var(--text)]">{item.term}</dt>
                      <dd className="text-sm leading-6 text-[var(--text2)] max-sm:mb-2">
                        <RichText text={item.definition} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {doc.quiz?.length ? (
              <section id="check-yourself" className="scroll-mt-24">
                <h2>{t.checkYourself}</h2>
                <div className="mt-2">
                  {doc.quiz.map((item) => (
                    <details key={item.question} className="doc-quiz">
                      <summary>
                        <span>
                          <RichText text={item.question} />
                        </span>
                        <span className="doc-quiz-toggle">{t.showAnswer}</span>
                      </summary>
                      <p className="!mt-2 text-sm">
                        <RichText text={item.answer} />
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <nav className="mt-12 grid gap-3 sm:grid-cols-2" aria-label={`${t.previous} / ${t.next}`}>
            {previous ? (
              <Link href={href(`/docs/${previous.slug}`)} className="site-card site-card-hover group p-4">
                <span className="flex items-center gap-1.5 text-xs text-[var(--text3)]">
                  <ArrowLeft size={13} /> {t.previous}
                </span>
                <span className="mt-1 block text-sm font-semibold group-hover:text-[var(--accent)]">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={href(`/docs/${next.slug}`)} className="site-card site-card-hover group p-4 text-right">
                <span className="flex items-center justify-end gap-1.5 text-xs text-[var(--text3)]">
                  {t.next} <ArrowRight size={13} />
                </span>
                <span className="mt-1 block text-sm font-semibold group-hover:text-[var(--accent)]">{next.title}</span>
              </Link>
            ) : null}
          </nav>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href("/app")} className="site-btn site-btn-accent">
              {t.tryIt} <Play size={16} />
            </Link>
            <Link href={href("/practice")} className="site-btn site-btn-ghost">
              {dict.nav.practice}
            </Link>
            <Link href={href("/manual")} className="site-btn site-btn-ghost">
              {t.openManual}
            </Link>
          </div>
        </article>

        <aside className="max-xl:hidden">
          <div className="sticky top-20">
            <p className="px-2 text-xs font-semibold text-[var(--text3)]">{t.onThisPage}</p>
            <nav className="site-toc mt-2">
              {doc.sections.map((section, index) => (
                <a key={section.heading} href={`#${sectionId(index)}`}>
                  {section.heading}
                </a>
              ))}
              {doc.keyTerms?.length ? <a href="#key-terms">{t.keyTerms}</a> : null}
              {doc.quiz?.length ? <a href="#check-yourself">{t.checkYourself}</a> : null}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
