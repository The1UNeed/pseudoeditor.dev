import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseArticle } from "@/app/components/docs/CourseArticle";
import { pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/server";
import { courseLessonPath, getCourseLessons, getLessonCatalog, getLessonCourse, isCourseId } from "@/lib/lesson-syllabi";

type Props = { params: Promise<{ locale: string; slug: string; lesson: string }> };

export function generateStaticParams() {
  return getLessonCatalog("en").filter((course) => course.id !== "igcse").flatMap((course) =>
    getCourseLessons("en", course.id).map((lesson) => ({ slug: course.id, lesson: lesson.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug, lesson: lessonSlug } = await params;
  if (!isCourseId(slug) || slug === "igcse") return {};
  const lesson = getCourseLessons(locale, slug).find((item) => item.slug === lessonSlug);
  if (!lesson) return {};
  return pageMetadata(locale, courseLessonPath(slug, lesson.slug), lesson.title, lesson.description, getDictionary(locale).meta.ogImageAlt);
}

export default async function CourseLessonPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { slug, lesson: lessonSlug } = await params;
  if (!isCourseId(slug) || slug === "igcse") notFound();
  const course = getLessonCourse(locale, slug);
  const lesson = getCourseLessons(locale, slug).find((item) => item.slug === lessonSlug);
  if (!lesson) notFound();
  return <CourseArticle locale={locale} course={course} lesson={lesson} />;
}
