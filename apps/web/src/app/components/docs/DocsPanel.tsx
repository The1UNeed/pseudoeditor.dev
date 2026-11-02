"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import { localePath } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/context";
import { guidesByLocale } from "@/lib/docs/guides";
import { getUnit, guideUnitIds } from "@/lib/docs/units";
import { DocSectionView } from "./DocSectionView";

type DocsPanelProps = {
  slug: string;
  onSlugChange: (slug: string) => void;
  onClose: () => void;
  /** Id for the panel's heading, which names the surrounding dialog. */
  titleId: string;
};

/** The /docs guides inside the editor, so students can look something up without leaving their work. */
export default function DocsPanel({ slug, onSlugChange, onClose, titleId }: DocsPanelProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const t = dict.docs;
  const guides = guidesByLocale[locale];
  const doc = guides.find((guide) => guide.slug === slug) ?? guides[0];
  const groups = guideUnitIds.map((id) => ({ unit: getUnit(locale, id), docs: guides.filter((guide) => guide.unit === id) }));
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (articleRef.current) articleRef.current.scrollTop = 0;
  }, [doc.slug]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="flex min-h-[52px] shrink-0 items-center gap-3 border-b border-[var(--separator)] bg-[var(--titlebar)] px-4">
        <h2 id={titleId} className="text-[13px] font-semibold max-md:sr-only">
          {dict.editor.docs.title}
        </h2>
        <label className="min-w-0 flex-1 md:hidden">
          <span className="sr-only">{t.contents}</span>
          <select
            value={doc.slug}
            onChange={(event) => onSlugChange(event.target.value)}
            className="h-9 w-full rounded-lg border border-[var(--separator)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]"
          >
            {groups.map(({ unit, docs }) => (
              <optgroup key={unit.id} label={unit.title}>
                {docs.map((guide) => (
                  <option key={guide.slug} value={guide.slug}>
                    {guide.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="flex-1 max-md:hidden" />
        <a
          href={localePath(locale, `/docs/${doc.slug}`)}
          target="_blank"
          rel="noreferrer"
          aria-label={t.openInNewTab}
          title={t.openInNewTab}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] text-[var(--text2)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <ExternalLink size={15} />
          <span className="max-sm:hidden">{t.openInNewTab}</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.editor.common.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text2)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label={t.contents} className="w-60 shrink-0 overflow-y-auto border-r border-[var(--separator)] px-3 py-5 max-md:hidden">
          {groups.map(({ unit, docs }) => (
            <div key={unit.id} className="mb-5">
              <p className="px-2 text-xs font-semibold text-[var(--text3)]">{unit.title}</p>
              <ul className="mt-1.5 space-y-0.5">
                {docs.map((guide) => (
                  <li key={guide.slug}>
                    <button
                      type="button"
                      onClick={() => onSlugChange(guide.slug)}
                      aria-current={guide.slug === doc.slug ? "page" : undefined}
                      className="doc-course-link w-full text-left"
                    >
                      {guide.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div ref={articleRef} className="min-w-0 flex-1 overflow-y-auto">
          <article className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-10">
            <p className="site-eyebrow">{getUnit(locale, doc.unit).title}</p>
            <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight md:text-[2.25rem]">{doc.title}</h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text2)]">{doc.description}</p>
            <div className="site-prose mt-4">
              {doc.sections.map((section, index) => (
                <DocSectionView key={section.heading} section={section} id={`docs-panel-s${index + 1}`} t={t.visual} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
