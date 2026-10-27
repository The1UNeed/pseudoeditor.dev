import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { LocaleSwitcher } from "@/i18n/LocaleSwitcher";
import { authorName, githubUrl, productName } from "@/lib/seo-content";

const linkClassName = "text-[var(--text2)] transition hover:text-[var(--text)]";
const groupLabelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text3)]";

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  const dict = getDictionary(locale);
  const t = dict.footer;
  const columns = [
    {
      title: t.product,
      links: [
        { href: localePath(locale, "/app"), label: t.editor },
        { href: localePath(locale, "/practice"), label: t.practice },
        { href: localePath(locale, "/docs"), label: dict.nav.docs },
        { href: localePath(locale, "/manual"), label: dict.nav.manual },
        { href: localePath(locale, "/blog"), label: dict.nav.blog },
      ],
    },
    {
      title: t.project,
      links: [
        { href: githubUrl, label: t.sourceCode, external: true },
        { href: `${githubUrl}/issues`, label: t.reportIssue, external: true },
        { href: `${githubUrl}/blob/main/LICENSE`, label: t.license, external: true },
      ],
    },
    {
      title: t.legal,
      links: [
        { href: localePath(locale, "/terms"), label: t.terms },
        { href: localePath(locale, "/privacy"), label: t.privacy },
        { href: localePath(locale, "/security"), label: t.security },
      ],
    },
  ];

  return (
    <footer className="border-t border-[var(--separator)] bg-[var(--sidebar)] px-4 py-10 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-[var(--text)]">{productName}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text2)]">{t.slogan}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{t.slogan2}</p>
          <p className={`mt-6 ${groupLabelClassName}`}>{t.language}</p>
          <p className="mt-2 text-sm">
            <LocaleSwitcher className={linkClassName} />
          </p>
        </div>

        <nav className="flex flex-wrap gap-10 md:gap-14">
          {columns.map((column) => (
            <div key={column.title}>
              <p className={groupLabelClassName}>{column.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClassName}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-2 border-t border-[var(--separator)] pt-6 text-xs text-[var(--text3)] md:flex-row">
        <p>
          &copy; {year} {authorName}. {t.copyright}
        </p>
        <p>{t.freeForever}</p>
      </div>
    </footer>
  );
}
