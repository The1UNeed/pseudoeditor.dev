import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { publicListClassName } from "@/app/components/PublicUi";
import { localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getPracticeQuestions } from "@/lib/practice-questions";
import { authorName } from "@/lib/seo-content";
import { RandomPracticeControls } from "./RandomPracticeButton";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return {
    ...pageMetadata(locale, "/practice", t.practiceTitle, t.practiceDescription, t.ogImageAlt),
    keywords: t.keywords,
  };
}

export default async function PracticeIndexPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const t = dict.practice;
  const questions = getPracticeQuestions(locale);
  const href = (path: string) => localePath(locale, path);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": ["CollectionPage", "LearningResource"],
      name: dict.meta.practiceTitle,
      description: dict.meta.practiceDescription,
      url: localeUrl(locale, "/practice"),
      inLanguage: localeTags[locale],
      learningResourceType: "practice problem",
      educationalUse: "practice",
      educationalLevel: "secondary",
      isAccessibleForFree: true,
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      provider: { "@type": "Person", name: authorName },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: localeUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t.back, item: localeUrl(locale, "/practice") },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: localeTags[locale],
      itemListElement: questions.map((question, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: question.title,
        url: localeUrl(locale, `/practice/${question.id}`),
      })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="practice" />

      <section className="site-wrap py-14 md:py-20">
        <p className="site-eyebrow">{t.eyebrow}</p>
        <h1 className="site-h1 mt-4">{t.title}</h1>
        <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
        <div className="mt-8">
          <RandomPracticeControls locale={locale} questions={questions} />
        </div>
      </section>

      <section className="site-wrap pb-20">
        <h2 className="sr-only">{t.allQuestions}</h2>
        <div className={publicListClassName}>
          {questions.map((question) => (
            <Link
              key={question.id}
              href={href(`/practice/${question.id}`)}
              className="group flex items-start justify-between gap-6 py-5"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className="site-chip">{t.topics[question.topic]}</span>
                  <span className="site-chip">{t.difficulty[question.difficulty]}</span>
                  <span className="site-chip">{question.exam}</span>
                </div>
                <h2 className="text-base font-semibold transition group-hover:text-[var(--accent)]">{question.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{question.description}</p>
              </div>
              <span className="mt-1 hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--text3)] transition group-hover:text-[var(--accent)] sm:inline-flex">
                {t.openQuestion} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
