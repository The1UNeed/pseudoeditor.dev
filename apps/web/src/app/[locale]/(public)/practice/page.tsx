import type { Metadata } from "next";
import { PublicHeader } from "@/app/components/PublicHeader";
import { localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getPracticeQuestions, practiceTopics } from "@/lib/practice-questions";
import { authorName } from "@/lib/seo-content";
import { PracticeCatalog } from "./PracticeCatalog";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return {
    ...pageMetadata(locale, "/practice", t.practiceTitle, t.practiceDescription, t.ogImageAlt),
    keywords: t.keywords,
  };
}

export default async function PracticeIndexPage({ params, searchParams }: LocaleParams & {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const t = dict.practice;
  const questions = getPracticeQuestions(locale);
  const requestedTopic = (await searchParams).topic;
  const initialTopic = practiceTopics.find((topic) => topic === requestedTopic) ?? "any";

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

      <section className="site-wrap pb-8 pt-14 md:pt-20">
        <p className="site-eyebrow">{t.eyebrow}</p>
        <h1 className="site-h1 mt-4">{t.title}</h1>
        <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
      </section>

      <PracticeCatalog key={initialTopic} locale={locale} questions={questions} initialTopic={initialTopic} />
    </main>
  );
}
