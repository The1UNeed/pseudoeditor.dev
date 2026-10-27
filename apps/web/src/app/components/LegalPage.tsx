import Link from "next/link";
import type { ReactNode } from "react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { formatDate, localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

type LegalPageProps = {
  locale: Locale;
  document: LegalDocument;
  /** ISO date of the current version. */
  effectiveDate: string;
};

export function LegalPage({ locale, document, effectiveDate }: LegalPageProps) {
  const t = getDictionary(locale).legal;
  const legalLinks = [
    { href: "/terms", label: t.terms },
    { href: "/privacy", label: t.privacy },
    { href: "/security", label: t.security },
  ];

  return (
    <main>
      <PublicHeader locale={locale} active="legal" />
      <section className="site-wrap py-14 md:py-20">
        <p className="site-eyebrow">{document.eyebrow}</p>
        <h1 className="site-h1 mt-4 max-w-3xl">{document.title}</h1>
        <p className="site-lede mt-5 max-w-2xl">{document.summary}</p>
        <p className="mt-4 text-xs text-[var(--ink-3)]">
          {t.effective} {formatDate(locale, effectiveDate)}
        </p>
      </section>

      <section className="site-wrap grid gap-10 pb-20 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-3)]">{t.onThisPage}</p>
          <nav className="site-toc mt-3">
            {document.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-3)]">{t.related}</p>
          <nav className="site-toc mt-3">
            {legalLinks.map((link) => (
              <Link key={link.href} href={localePath(locale, link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="site-card site-prose max-w-3xl p-6 md:p-10">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
        </article>
      </section>
    </main>
  );
}
