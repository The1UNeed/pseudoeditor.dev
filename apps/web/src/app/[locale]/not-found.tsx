"use client";

import Link from "next/link";
import { localePath, localeTags } from "@/i18n/config";
import { useLocale } from "@/i18n/context";
import { getDictionary } from "@/i18n/messages";
import { productName } from "@/lib/seo-content";

/**
 * Rendered inside the [locale] layout for notFound() and for unmatched paths (via [...rest]).
 * Its styles are scoped to .nf so they never override the site's own body styles or theme.
 * not-found pages get no params, so the locale comes from the LocaleProvider in the [locale] layout.
 * Reading it on the client keeps every page under [locale] statically renderable.
 */
const styles = `
  .nf { font-family: var(--font-sans), "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; background: var(--bg); color: var(--text); }
  .nf { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; text-align: center; }
  .nf-brand { font-weight: 600; font-size: 13px; color: var(--text); text-decoration: none; }
  .nf-eyebrow { margin: 40px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text3); }
  .nf h1 { margin: 12px 0 0; font-size: clamp(1.875rem, 5vw, 3rem); font-weight: 600; letter-spacing: -0.025em; line-height: 1.1; }
  .nf p { margin: 16px 0 0; max-width: 32rem; font-size: 16px; line-height: 1.75; color: var(--text2); }
  .nf-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px; }
  .nf-btn { display: inline-flex; align-items: center; height: 40px; padding: 0 20px; border-radius: 12px; font-weight: 500; font-size: 14px; text-decoration: none; border: 1px solid var(--separator); background: var(--surface2); color: var(--text2); }
  .nf-btn-accent { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 600; }
`;

export default function NotFound() {
  const locale = useLocale();
  const t = getDictionary(locale).notFound;

  return (
    <main className="nf" lang={localeTags[locale]}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Link href={localePath(locale, "/")} className="nf-brand">
        {productName}
      </Link>
      <p className="nf-eyebrow">404</p>
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <div className="nf-actions">
        <Link href={localePath(locale, "/")} className="nf-btn nf-btn-accent">
          {t.home}
        </Link>
        <Link href={localePath(locale, "/app")} className="nf-btn">
          {t.editor}
        </Link>
      </div>
    </main>
  );
}
