import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { publicListClassName } from "@/app/components/PublicUi";
import { formatDate, localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getPosts } from "@/lib/seo-content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/blog", t.blogTitle, t.blogDescription, t.ogImageAlt);
}

export default async function BlogIndexPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const t = dict.blog;
  const posts = getPosts(locale);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: dict.meta.blogName,
    url: localeUrl(locale, "/blog"),
    inLanguage: localeTags[locale],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} active="blog" />
      <section className="site-wrap py-14 md:py-20">
        <p className="site-eyebrow">{t.eyebrow}</p>
        <h1 className="site-h1 mt-4">{t.title}</h1>
        <p className="site-lede mt-5 max-w-2xl">{t.lede}</p>
      </section>
      <section className="site-wrap pb-20">
        <div className={publicListClassName}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={localePath(locale, `/blog/${post.slug}`)}
              className="group flex items-start justify-between gap-6 py-5"
            >
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-[var(--text3)]">
                  {formatDate(locale, post.date)} · {post.readingTime}
                </p>
                <h2 className="text-base font-semibold transition group-hover:text-[var(--accent)]">{post.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{post.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="site-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="mt-1 hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--text3)] transition group-hover:text-[var(--accent)] sm:inline-flex">
                {t.readPost} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
