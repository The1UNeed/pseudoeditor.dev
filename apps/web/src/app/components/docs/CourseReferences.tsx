import { Download, ExternalLink } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import type { LessonCourse } from "@/lib/lesson-syllabi";

export function CourseReferences({ locale, course }: { locale: Locale; course: LessonCourse }) {
  const t = getDictionary(locale).lessons;
  const localPdf = course.file.startsWith("/");
  return (
    <section aria-labelledby={`references-${course.id}`} className="mt-12 border-t border-[var(--separator)] pt-8">
      <h2 id={`references-${course.id}`} className="text-xl font-semibold tracking-tight">{t.referencesTitle}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text2)]">{t.referencesBody}</p>
      <p className="mt-4 text-sm font-semibold">{course.publisher} · {course.edition}</p>
      {course.document === "subject-brief" ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text2)]">{t.briefNote}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a href={course.file} download={localPdf || undefined} target={localPdf ? undefined : "_blank"} rel={localPdf ? undefined : "noreferrer"} className="site-btn site-btn-ghost">
          <Download size={16} /> {course.document === "subject-brief" ? t.downloadBrief : t.referencePdf} <span className="text-xs">PDF</span>
        </a>
        <a href={course.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--text2)] hover:text-[var(--text)]">
          {t.officialSource} <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
