"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import type { LessonCourse } from "@/lib/lesson-syllabi";
import { unitIcons } from "./unitIcons";

export function SyllabusCatalog({ locale, courses }: { locale: Locale; courses: LessonCourse[] }) {
  const [selectedId, setSelectedId] = useState(courses[0].id);
  const course = courses.find((item) => item.id === selectedId)!;
  const t = getDictionary(locale).lessons;
  const isIgcse = course.id === "igcse";
  const groups = isIgcse ? ([1, 2] as const) : [null];

  return (
    <div className="site-wrap pb-16">
      <fieldset>
        <legend className="text-sm font-semibold">{t.chooseSyllabus}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {courses.map((item) => (
            <label key={item.id} className="cursor-pointer">
              <input
                type="radio"
                name="syllabus"
                value={item.id}
                checked={item.id === selectedId}
                onChange={() => setSelectedId(item.id)}
                aria-controls="syllabus-content"
                className="peer sr-only"
              />
              <span className="block rounded-lg border border-[var(--separator)] px-3 py-2 text-sm text-[var(--text2)] transition hover:bg-[var(--hover)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--selected)] peer-checked:text-[var(--text)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]">
                {item.title}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section id="syllabus-content" aria-labelledby="syllabus-title" className="mt-6">
        <div className="site-card grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="text-xs text-[var(--text3)]">{course.publisher} · {course.edition}</p>
            <h2 id="syllabus-title" className="mt-2 text-xl font-semibold tracking-tight">{course.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text2)]">{course.note}</p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a href={course.file} download className="site-btn site-btn-accent">
              <Download size={16} />
              {course.document === "subject-brief" ? t.downloadBrief : t.downloadSyllabus}
              <span className="text-xs opacity-80">PDF</span>
            </a>
            <a href={course.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--text2)] hover:text-[var(--text)]">
              {t.officialSource} <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {groups.map((paper) => (
          <div key={paper ?? "foundations"} className="mt-10">
            <div className="border-t border-[var(--separator)] pt-8">
              {paper !== null ? <p className="site-eyebrow">{t.paper} {paper}</p> : null}
              <h2 className="site-h2 mt-2">{paper !== null ? t.paperTitles[paper] : t.relatedLessons}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text2)]">
                {paper !== null ? t.paperSummaries[paper] : t.relatedLessonsBody}
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {course.units.filter((unit) => paper === null || unit.paper === paper).map((unit) => {
                const Icon = unitIcons[unit.id];
                return (
                  <article key={unit.id} id={unit.id} className="site-card flex flex-col p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text3)]">
                          {isIgcse ? `${t.unit} ${unit.number} · ` : ""}
                          {unit.lessons.length === 1 ? t.lessonCountOne : t.lessonCount.replace("{n}", String(unit.lessons.length))}
                        </p>
                        <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{unit.title}</h3>
                        {isIgcse ? <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{unit.summary}</p> : null}
                      </div>
                    </div>
                    <ol className="mt-4 border-t border-[var(--separator)] pt-3">
                      {unit.lessons.map((doc, index) => (
                        <li key={doc.slug}>
                          <Link href={localePath(locale, `/lessons/${doc.slug}`)} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-[var(--hover)]">
                            <span className="w-5 shrink-0 text-right font-mono text-xs text-[var(--text3)]">{index + 1}</span>
                            <span className="min-w-0 flex-1 text-[var(--text2)] transition group-hover:text-[var(--text)]">{doc.title}</span>
                            <ArrowRight size={14} className="shrink-0 text-[var(--text3)] opacity-0 transition group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
