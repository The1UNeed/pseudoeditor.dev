import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, FileText, GitBranch, Play } from "lucide-react";
import CopyableCodeBlock from "@/app/(public)/manual/CopyableCodeBlock";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  PublicPageIntro,
  PublicSectionHeading,
  publicListClassName,
  publicMainClassName,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
} from "@/app/components/PublicUi";
import { siteUrl } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Pseudocode Manual",
  description:
    "Use the PseudoEditor pseudocode manual for syntax rules, control flow, arrays, trace tables, and exam-style practice.",
  alternates: {
    canonical: "/manual",
  },
};

const manualSections = [
  {
    icon: Code2,
    title: "Core syntax",
    body: "Use DECLARE, assignment, INPUT, OUTPUT, comments, constants, and typed values in a consistent exam-style format.",
    bullets: ["Assignment uses <-", "Variables use explicit types", "Comments start with //"],
  },
  {
    icon: GitBranch,
    title: "Selection and loops",
    body: "Pick IF, CASE, FOR, WHILE, or REPEAT UNTIL based on when the condition is known and when it should be tested.",
    bullets: ["FOR for known counts", "WHILE can run zero times", "REPEAT UNTIL runs first"],
  },
  {
    icon: FileText,
    title: "Arrays and records",
    body: "Represent list-style data with indexed arrays, then process values through counted loops and clear bounds.",
    bullets: ["Indexes are explicit", "Bounds are part of declaration", "Nested loops cover tables"],
  },
  {
    icon: BookOpen,
    title: "Tracing and debugging",
    body: "Use trace tables, line-by-line state changes, and compiler diagnostics to catch logic and syntax errors earlier.",
    bullets: ["Track changed variables", "Check block endings", "Test edge cases"],
  },
] as const;

const examples = [
  {
    title: "Counted total",
    code: `DECLARE Number : INTEGER
DECLARE Total : INTEGER
Total <- 0

FOR Number <- 1 TO 5
    Total <- Total + Number
NEXT Number

OUTPUT "Total = ", Total`,
  },
  {
    title: "Input validation",
    code: `DECLARE Choice : INTEGER

REPEAT
    OUTPUT "Choose 1 to 4"
    INPUT Choice
UNTIL Choice >= 1 AND Choice <= 4

OUTPUT "Accepted"`,
  },
] as const;

const checklist = [
  "Declare every variable and array before use.",
  "Initialize totals, counters, and flags before loops.",
  "Use the loop type that matches the question.",
  "Close every IF, CASE, and loop block clearly.",
  "Trace the program with at least one normal input and one edge case.",
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "PseudoEditor Pseudocode Manual",
  description: metadata.description,
  url: `${siteUrl}/manual`,
};

export default function ManualPage() {
  return (
    <main className={publicMainClassName}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader active="manual" />

      <PublicPageIntro
        eyebrow="Manual"
        title="Pseudocode manual for practical writing."
        description="A managed reference for the syntax, control flow, and tracing habits used across PseudoEditor. Keep it open beside the browser editor while you practise."
      >
        <Link href="/app" className={publicPrimaryButtonClassName}>
          <Play size={15} /> Open editor
        </Link>
        <Link href="/docs" className={publicSecondaryButtonClassName}>
          Browse docs <ArrowRight size={15} />
        </Link>
      </PublicPageIntro>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 md:grid-cols-2">
          {manualSections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title}>
                <Icon size={20} className="text-[var(--accent)]" />
                <h2 className="mt-3 text-lg font-semibold">{section.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text2)]">{section.body}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text2)] marker:text-[var(--text3)]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto max-w-6xl">
          <PublicSectionHeading eyebrow="Examples" title="Small patterns you can run." />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {examples.map((example) => (
              <article key={example.title}>
                <h3 className="text-sm font-semibold">{example.title}</h3>
                <CopyableCodeBlock code={example.code} className="mt-3" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <PublicSectionHeading eyebrow="Before you submit" title="A compact checking routine." />
            <p className="mt-4 text-sm leading-6 text-[var(--text2)]">
              Treat the manual as a working checklist, not a long rules page. Write the algorithm, run it, then trace the parts that change state.
            </p>
          </div>
          <ol className={publicListClassName}>
            {checklist.map((item, index) => (
              <li key={item} className="flex items-baseline gap-4 py-3.5 text-sm leading-6 text-[var(--text2)]">
                <span className="w-4 shrink-0 font-mono text-xs text-[var(--text3)]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
