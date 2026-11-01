import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { localePath, localeTags, localeUrl, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { courseLessonPath, getCourseLessons, type LessonCourse } from "@/lib/lesson-syllabi";
import type { CourseLesson } from "@/lib/course-lessons/types";
import { DocSectionView } from "./DocSectionView";
import { RichText } from "./DiagramBlocks";
import { CourseReferences } from "./CourseReferences";

export function CourseArticle({ locale, course, lesson }: { locale: Locale; course: LessonCourse; lesson: CourseLesson }) {
  const dict = getDictionary(locale);
  const t = dict.docs;
  const href = (path: string) => localePath(locale, path);
  const lessons = getCourseLessons(locale, course.id);
  const index = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const coursePath = `/lessons?course=${course.id}`;
  const structuredData = {
    "@context": "https://schema.org", "@type": "LearningResource", learningResourceType: "lesson",
    name: lesson.title, description: lesson.description, inLanguage: localeTags[locale],
    url: localeUrl(locale, courseLessonPath(course.id, lesson.slug)), isAccessibleForFree: true,
    isPartOf: { "@type": "Course", name: course.title }, dateModified: lesson.updated,
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="lessons" />
      <div className="site-wrap grid gap-10 py-10 md:py-14 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label={course.title} className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-3">
            <Link href={href(coursePath)} className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={15} /> {course.title}</Link>
            {course.units.map((unit) => (
              <div key={unit.id} className="mt-5">
                <p className="text-xs font-semibold text-[var(--text3)]">{unit.title}</p>
                <ul className="mt-2 space-y-1 border-l border-[var(--separator)] pl-2">
                  {unit.lessons.map((item) => (
                    <li key={item.slug}><Link href={href(item.href)} className="doc-course-link" aria-current={item.slug === lesson.slug ? "page" : undefined}>{item.title}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <article className="min-w-0 max-w-3xl">
          <Link href={href(coursePath)} className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={15} /> {course.title}</Link>
          <p className="site-eyebrow mt-6">{lesson.group}</p>
          <h1 className="site-h1 mt-3 text-[2.2rem] md:text-[3rem]">{lesson.title}</h1>
          <p className="site-lede mt-4">{lesson.description}</p>
          <p className="mt-4 text-sm leading-6 text-[var(--text2)]">{course.language}</p>
          <div className="site-prose mt-6">
            {lesson.sections.map((part, i) => <DocSectionView key={part.heading} section={part} id={`s${i + 1}`} t={t.visual} />)}
            {lesson.quiz?.length ? (
              <section id="check-yourself" className="scroll-mt-24">
                <h2>{t.checkYourself}</h2>
                {lesson.quiz.map((item) => (
                  <details key={item.question} className="doc-quiz">
                    <summary><span><RichText text={item.question} /></span><span className="doc-quiz-toggle">{t.showAnswer}</span></summary>
                    <p className="!mt-2 text-sm"><RichText text={item.answer} /></p>
                  </details>
                ))}
              </section>
            ) : null}
          </div>
          <CourseReferences locale={locale} course={course} />
          <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label={`${t.previous} / ${t.next}`}>
            {previous ? <Link href={href(courseLessonPath(course.id, previous.slug))} className="site-card site-card-hover p-4"><span className="flex items-center gap-2 text-xs text-[var(--text3)]"><ArrowLeft size={14} /> {t.previous}</span><span className="mt-2 block text-sm font-semibold">{previous.title}</span></Link> : <span />}
            {next ? <Link href={href(courseLessonPath(course.id, next.slug))} className="site-card site-card-hover p-4 text-right"><span className="flex items-center justify-end gap-2 text-xs text-[var(--text3)]">{t.next} <ArrowRight size={14} /></span><span className="mt-2 block text-sm font-semibold">{next.title}</span></Link> : null}
          </nav>
        </article>
      </div>
    </main>
  );
}
