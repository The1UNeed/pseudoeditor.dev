import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { SyllabusCatalog } from "@/app/components/docs/SyllabusCatalog";
import { localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getLessonCatalog, getCourseLessons, courseLessonPath, isCourseId, type CourseId } from "@/lib/lesson-syllabi";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/lessons", t.lessonsTitle, t.lessonsDescription, t.ogImageAlt);
}

export default async function LessonsIndexPage({ params, searchParams }: LocaleParams & {
  searchParams: Promise<{ course?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).lessons;
  const courses = getLessonCatalog(locale);
  const lessons = courses.flatMap((course) => getCourseLessons(locale, course.id).map((lesson) => ({ ...lesson, href: courseLessonPath(course.id, lesson.slug) })));
  const selected = (await searchParams).course;
  const initialCourse: CourseId = typeof selected === "string" && isCourseId(selected) ? selected : "igcse";

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: localeUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t.back, item: localeUrl(locale, "/lessons") },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: localeTags[locale],
      itemListElement: lessons.map((doc, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: doc.title,
        url: localeUrl(locale, doc.href),
      })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="lessons" />
      <section className="site-wrap grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <p className="site-eyebrow">{t.eyebrow}</p>
          <h1 className="site-h1 mt-4 max-w-3xl">{t.title}</h1>
          <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
        </div>
        <div className="site-card p-5">
          <p className="text-sm font-semibold">{t.startHere}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text2)]">{t.startHereBody}</p>
          <Link href="#course-selector" className="site-btn site-btn-accent mt-4">
            {t.startHereCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <SyllabusCatalog key={initialCourse} locale={locale} courses={courses} initialCourse={initialCourse} />

    </main>
  );
}
