"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { publicListClassName } from "@/app/components/PublicUi";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import type { PracticeQuestion, PracticeTopic } from "@/lib/practice-questions";
import { RandomPracticeControls } from "./RandomPracticeButton";

export function PracticeCatalog({ locale, questions, initialTopic }: {
  locale: Locale;
  questions: PracticeQuestion[];
  initialTopic: PracticeTopic | "any";
}) {
  const [topic, setTopic] = useState(initialTopic);
  const t = getDictionary(locale).practice;
  const href = (path: string) => localePath(locale, path);
  const filteredQuestions = questions.filter((question) => topic === "any" || question.topic === topic);

  return (
    <>
      <div className="site-wrap pb-10">
        <RandomPracticeControls locale={locale} questions={questions} initialTopic={initialTopic} onTopicChange={setTopic} />
      </div>
      <section className="site-wrap pb-20">
        <h2 className="sr-only">{t.allQuestions}</h2>
        <div className={publicListClassName}>
          {filteredQuestions.map((question) => (
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
    </>
  );
}
