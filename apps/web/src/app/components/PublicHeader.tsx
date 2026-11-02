import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { LocaleSwitcher } from "@/i18n/LocaleSwitcher";
import { productName } from "@/lib/seo-content";

export type PublicNavKey = "docs" | "lessons" | "practice" | "blog" | "legal";

type PublicHeaderProps = {
  locale: Locale;
  active?: PublicNavKey;
};

/** The same 52px title bar as the editor, so moving between the site and /app feels like one product. */
export function PublicHeader({ locale, active }: PublicHeaderProps) {
  const t = getDictionary(locale).nav;
  const navItems = [
    { href: "/docs", label: t.docs, key: "docs" },
    { href: "/lessons", label: t.lessons, key: "lessons" },
    { href: "/practice", label: t.practice, key: "practice" },
    { href: "/blog", label: t.blog, key: "blog" },
  ] as const;

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--separator)] bg-[var(--titlebar)] px-4 md:px-6">
      <nav className="mx-auto flex min-h-[52px] max-w-6xl flex-wrap items-center gap-x-4">
        <Link
          href={localePath(locale, "/")}
          aria-label={productName}
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <Image src="/branding/app-icon-128.png" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="hidden text-[13px] font-semibold text-[var(--text)] sm:inline">{productName}</span>
        </Link>
        <div className="order-last flex w-full items-center gap-1 overflow-x-auto border-t border-[var(--separator)] py-1 md:order-none md:w-auto md:flex-1 md:justify-center md:border-0 md:py-0">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={localePath(locale, item.href)}
              aria-current={active === item.key ? "page" : undefined}
              className="site-nav-link shrink-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <LocaleSwitcher className="site-nav-link ml-auto md:ml-0" />
        <Link
          href={localePath(locale, "/app")}
          aria-label={t.openEditor}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--on-accent)] transition hover:brightness-110"
        >
          <Play size={14} />
          <span className="hidden sm:inline">{t.openEditor}</span>
        </Link>
      </nav>
    </header>
  );
}
