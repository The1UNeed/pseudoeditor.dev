import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bug,
  Cloud,
  Code2,
  GitBranch,
  GraduationCap,
  Lock,
  Play,
  ScrollText,
  Shuffle,
} from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import { PublicListLink, publicListClassName } from "@/app/components/PublicUi";
import { defaultLocale, localePath, localeTags, localeUrl, pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import {
  authorName,
  getDocs,
  getFaq,
  getPosts,
  githubUrl,
  productName,
  productSlogan,
  productTagline,
  siteUrl,
} from "@/lib/seo-content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return {
    ...pageMetadata(locale, "/", t.homeTitle, t.homeDescription, t.ogImageAlt),
    keywords: t.keywords,
  };
}

const featureIcons = [Code2, Play, GitBranch, Bug, Cloud, Lock];

function HeroWindow({ workspace, compiled, terminal }: { workspace: string; compiled: string; terminal: string }) {
  const kw = "text-[var(--code-keyword)]";
  const type = "text-[var(--code-type)]";
  const num = "text-[var(--code-number)]";
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--separator)] bg-[var(--bg)] text-left shadow-[var(--shadow-xl)]"
      aria-hidden="true"
    >
      <div className="flex h-[44px] items-center gap-2 border-b border-[var(--separator)] bg-[var(--titlebar)] px-4">
        <span className="window-dot bg-[var(--traffic-red)]" />
        <span className="window-dot bg-[var(--traffic-yellow)]" />
        <span className="window-dot bg-[var(--traffic-green)]" />
        <span className="ml-3 text-[13px] font-medium text-[var(--text2)]">main.pseudo</span>
        <span className="ml-auto text-xs font-medium text-[var(--green)]">{compiled}</span>
      </div>
      <div className="grid md:grid-cols-[170px_1fr]">
        <aside className="hidden border-r border-[var(--separator)] bg-[var(--sidebar)] px-2 py-3 text-[13px] md:block">
          <p className="px-2 pb-2 text-[11px] font-semibold text-[var(--text2)]">{workspace}</p>
          <p className="rounded-lg bg-[var(--selected)] px-2 py-1.5 text-[var(--text)]">main.pseudo</p>
          <p className="px-2 py-1.5 text-[var(--text2)]">validate.pseudo</p>
          <p className="px-2 py-1.5 text-[var(--text2)]">search.pseudo</p>
        </aside>
        <div className="min-w-0">
          <pre className="m-0 overflow-x-auto p-5 font-mono text-[13px] leading-7 text-[var(--code-text)]">
            <span className="italic text-[var(--code-comment)]">{"// Sum the first five integers"}</span>
            {"\n"}
            <span className={kw}>DECLARE</span> Number : <span className={type}>INTEGER</span>
            {"\n"}
            <span className={kw}>DECLARE</span> Total : <span className={type}>INTEGER</span>
            {"\n"}
            Total <span className={kw}>{"<-"}</span> <span className={num}>0</span>
            {"\n\n"}
            <span className={kw}>FOR</span> Number <span className={kw}>{"<-"}</span> <span className={num}>1</span>{" "}
            <span className={kw}>TO</span> <span className={num}>5</span>
            {"\n"}
            {"    "}Total <span className={kw}>{"<-"}</span> Total + Number
            {"\n"}
            <span className={kw}>NEXT</span> Number
            {"\n\n"}
            <span className={kw}>OUTPUT</span> <span className="text-[var(--code-string)]">{'"Total = "'}</span>, Total
          </pre>
          <div className="border-t border-[var(--separator)] bg-[var(--sidebar)] p-4 font-mono text-[12px]">
            <p className="text-[var(--text3)]">{terminal}</p>
            <p className="mt-1 text-[var(--green)]">&gt; Total = 15</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const t = dict.home;
  const docs = getDocs(locale);
  const posts = getPosts(locale);
  const faqItems = getFaq(locale);
  const href = (path: string) => localePath(locale, path);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: productName,
      alternateName: ["PseudoEditor editor", "Pseudocode editor", "Pseudocode compiler", "伪代码编辑器"],
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Pseudocode editor and compiler",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern browser with WebAssembly",
      url: localeUrl(locale, "/"),
      inLanguage: Object.values(localeTags),
      description: locale === defaultLocale ? productTagline : dict.meta.homeDescription,
      image: `${siteUrl}/icon.png`,
      author: { "@type": "Person", name: authorName },
      publisher: { "@type": "Person", name: authorName, url: siteUrl },
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: dict.meta.audienceType,
      },
      educationalUse: ["practice", "self-study", "classroom"],
      isAccessibleForFree: true,
      license: "https://www.apache.org/licenses/LICENSE-2.0",
      keywords: dict.meta.keywords.join(", "),
      featureList: dict.meta.featureList,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: productName,
      url: siteUrl,
      inLanguage: Object.values(localeTags),
      publisher: { "@type": "Person", name: authorName },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: localeTags[locale],
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader locale={locale} />

      <section className="site-wrap grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="site-eyebrow">{t.eyebrow}</p>
          <h1 className="site-h1 mt-5">
            {t.h1a}
            <br />
            <span className="text-[var(--accent)]">{t.h1b}</span>
          </h1>
          <p className="site-lede mt-6 max-w-xl">
            {locale === defaultLocale ? `${productSlogan} ` : ""}
            {t.lede}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href("/app")} className="site-btn site-btn-accent">
              {t.ctaStart} <Play size={16} />
            </Link>
            <Link href={href("/practice")} className="site-btn site-btn-ghost">
              {t.ctaPractice} <Shuffle size={16} />
            </Link>
            <Link href={href("/docs")} className="site-btn site-btn-ghost">
              {t.ctaDocs} <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--ink-3)]">{t.noAccount}</p>
        </div>
        <HeroWindow workspace={t.windowWorkspace} compiled={t.windowCompiled} terminal={t.windowTerminal} />
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="site-wrap py-16 md:py-20">
          <p className="site-eyebrow">{t.featuresEyebrow}</p>
          <h2 className="site-h2 mt-3 max-w-2xl">{t.featuresTitle}</h2>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, index) => {
              const Icon = featureIcons[index] ?? Code2;
              return (
                <article key={feature.title}>
                  <Icon size={20} className="text-[var(--accent)]" />
                  <h3 className="mt-3 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="site-wrap grid gap-10 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="site-eyebrow">{t.studentsEyebrow}</p>
          <h2 className="site-h2 mt-3">{t.studentsTitle}</h2>
          <p className="site-lede mt-5 max-w-lg">{t.studentsLede}</p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--ink-3)]">{t.teacherNote}</p>
          <Link href={href("/practice")} className="site-btn mt-7">
            {t.studentsPractice} <Shuffle size={16} />
          </Link>
        </div>
        <ul className={publicListClassName}>
          {t.exams.map((exam) => (
            <li key={exam.name} className="flex gap-4 py-5">
              <GraduationCap size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold tracking-tight">{exam.name}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">{exam.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="site-wrap grid gap-10 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="site-eyebrow">{t.learnEyebrow}</p>
            <h2 className="site-h2 mt-3">{t.learnTitle}</h2>
            <p className="site-lede mt-5 max-w-lg">{t.learnLede}</p>
            <Link href={href("/manual")} className="site-btn mt-7">
              {t.learnCta} <ScrollText size={16} />
            </Link>
          </div>
          <div className={publicListClassName}>
            {docs.slice(0, 4).map((doc, index) => (
              <PublicListLink
                key={doc.slug}
                href={href(`/docs/${doc.slug}`)}
                meta={`${t.guideLabel} ${index + 1}`}
                title={doc.title}
                description={doc.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="site-wrap py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="site-eyebrow">{t.blogEyebrow}</p>
              <h2 className="site-h2 mt-3">{t.blogTitle}</h2>
            </div>
            <Link href={href("/blog")} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              {t.blogAll} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={`mt-8 ${publicListClassName}`}>
            {posts.slice(0, 3).map((post) => (
              <PublicListLink
                key={post.slug}
                href={href(`/blog/${post.slug}`)}
                meta={post.readingTime}
                title={post.title}
                description={post.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="site-wrap grid gap-10 border-t border-[var(--line)] py-16 md:py-20 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="site-eyebrow">{t.faqEyebrow}</p>
          <h2 className="site-h2 mt-3">{t.faqTitle}</h2>
          <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.question}
                  <span className="font-mono text-[var(--accent)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-[var(--ink-2)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="site-card flex flex-col justify-between p-8">
          <div>
            <p className="site-eyebrow">{t.ossEyebrow}</p>
            <h2 className="site-h2 mt-3">{t.ossTitle}</h2>
            <p className="mt-4 leading-7 text-[var(--text2)]">{t.ossBody}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="site-btn site-btn-accent">
              {t.ossGithub} <ArrowUpRight size={16} />
            </a>
            <Link href={href("/security")} className="site-btn">
              {t.ossSecurity}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
