import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Cloud,
  Code2,
  FileCode2,
  GitBranch,
  Play,
  Settings,
} from "lucide-react";
import { HighlightedPseudocode } from "@/app/(public)/manual/CopyableCodeBlock";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  PublicListLink,
  PublicSectionHeading,
  publicEyebrowClassName,
  publicListClassName,
  publicMainClassName,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
} from "@/app/components/PublicUi";
import {
  docs,
  faqItems,
  homeSeoDescription,
  homeSeoTitle,
  authorName,
  posts,
  productName,
  productTagline,
  seoKeywords,
  siteUrl,
} from "@/lib/seo-content";

export const metadata: Metadata = {
  title: homeSeoTitle,
  description: homeSeoDescription,
  keywords: seoKeywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: productName,
    title: homeSeoTitle,
    description: homeSeoDescription,
    images: [{ url: "/icon.png?v=2", width: 512, height: 512, alt: "PseudoEditor app icon" }],
  },
  twitter: {
    card: "summary",
    title: homeSeoTitle,
    description: homeSeoDescription,
    images: ["/icon.png?v=2"],
  },
};

const features = [
  {
    icon: Code2,
    title: "Strict pseudocode compiler",
    body: "Tokenize, parse, validate, and compile structured pseudocode with line-level diagnostics.",
  },
  {
    icon: Play,
    title: "Fast browser execution",
    body: "Run pseudocode directly in the browser terminal, including interactive INPUT programs.",
  },
  {
    icon: GitBranch,
    title: "Flowchart support",
    body: "Switch between source and visual control-flow thinking for decisions, loops, and processes.",
  },
  {
    icon: Cloud,
    title: "Workspace saving",
    body: "Use local browser storage in development and signed-in cloud workspace sync on pseudoeditor.dev.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: productName,
    alternateName: [
      "Pseudocode Compiler",
      "Pseudocode Editor",
      "IGCSE Pseudocode Compiler",
      "IGCSE Pseudocode Editor",
    ],
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: productTagline,
    creator: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Person",
      name: authorName,
    },
    isAccessibleForFree: true,
    keywords: seoKeywords.join(", "),
    featureList: [
      "Pseudocode editor",
      "Pseudocode compiler",
      "Browser pseudocode runner",
      "Line-level compiler diagnostics",
      "Flowchart support",
      "IGCSE-style pseudocode practice",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: productName,
    alternateName: ["PseudoEditor and Compiler", "Pseudocode Editor and Compiler"],
    url: siteUrl,
    publisher: {
      "@type": "Person",
      name: authorName,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/docs?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

const previewSource = `DECLARE Number : INTEGER
DECLARE Total : INTEGER
Total <- 0

FOR Number <- 1 TO 5
    Total <- Total + Number
NEXT Number

OUTPUT "Total = ", Total`;

const textLinkClassName =
  "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition hover:brightness-110";

const previewFiles = ["main.pseudo", "loops.pseudo", "array-search.pseudo"];

/** A static replica of the /app workspace window. */
function EditorPreview() {
  const lineCount = previewSource.split("\n").length;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--separator)] bg-[var(--bg)] shadow-[var(--shadow-xl)]"
      aria-hidden="true"
    >
      <div className="flex h-[52px] items-center border-b border-[var(--separator)] bg-[var(--titlebar)] px-4">
        <div className="flex w-[120px] items-center gap-2">
          <span className="window-dot bg-[var(--traffic-red)]" />
          <span className="window-dot bg-[var(--traffic-yellow)]" />
          <span className="window-dot bg-[var(--traffic-green)]" />
        </div>
        <p className="flex-1 text-center text-[13px] font-medium text-[var(--text2)]">
          Pseudocode Compiler
        </p>
        <div className="flex w-[120px] items-center justify-end gap-2.5 text-[var(--text3)]">
          <BookOpen size={16} />
          <Settings size={16} />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--green)] text-white">
            <Play size={13} fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="grid md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-[var(--separator)] bg-[var(--sidebar)] px-2 py-3 md:block">
          <p className="px-2 pb-2 text-[11px] font-semibold text-[var(--text2)]">Explorer</p>
          {previewFiles.map((file, index) => (
            <div
              key={file}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${
                index === 0
                  ? "bg-[var(--selected)] text-[var(--text)]"
                  : "text-[var(--text2)]"
              }`}
            >
              <FileCode2 size={14} className="shrink-0 text-[var(--accent)]" />
              {file}
            </div>
          ))}
        </aside>
        <div className="min-w-0">
          <div className="flex h-10 items-end border-b border-[var(--separator)] bg-[var(--surface)] px-2">
            <span className="rounded-t-lg border border-b-0 border-[var(--separator)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--text)]">
              main.pseudo
            </span>
          </div>
          <div className="flex overflow-hidden py-4 font-mono text-[13px] leading-6">
            <div className="select-none px-4 text-right text-[var(--line-num)]">
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            <pre className="m-0 min-w-0 flex-1 overflow-hidden pr-4 text-[var(--code-text)]">
              <code>
                <HighlightedPseudocode code={previewSource} />
              </code>
            </pre>
          </div>
          <div className="border-t border-[var(--separator)] bg-[var(--surface)] px-4 py-3 font-mono text-[13px]">
            <p className="mb-1.5 font-sans text-xs font-semibold text-[var(--text2)]">Terminal</p>
            <p className="text-[var(--text)]">Total = 15</p>
            <p className="text-[var(--text3)]">Program finished</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={publicMainClassName}>
      <JsonLd />
      <PublicHeader />

      <section className="px-4 pb-16 pt-14 md:px-6 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Image
            src="/branding/app-icon-128.png"
            alt=""
            width={56}
            height={56}
            className="mx-auto h-14 w-14"
            priority
          />
          <p className={`mt-6 ${publicEyebrowClassName}`}>Free pseudocode compiler and editor</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
            PseudoEditor and Compiler
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--text2)] md:text-lg md:leading-8">
            Built by Alex Xin LIU, PseudoEditor is a free, open-source pseudocode compiler and editor for writing, running, debugging, and learning IGCSE-style pseudocode anywhere.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href="/app" className={publicPrimaryButtonClassName}>
              <Play size={16} />
              Launch editor
            </Link>
            <Link href="/docs" className={publicSecondaryButtonClassName}>
              Read docs
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <EditorPreview />
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title}>
                <Icon size={20} className="text-[var(--accent)]" />
                <h2 className="mt-3 text-base font-semibold">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text2)]">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <PublicSectionHeading eyebrow="Learn while you build" title="Docs and examples beside the app." />
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text2)]">
              The new pseudoeditor.dev site gives search engines useful learning pages while giving students a direct path from explanation to practice.
            </p>
            <Link href="/manual" className={`mt-6 ${textLinkClassName}`}>
              Open manual <ArrowRight size={15} />
            </Link>
          </div>
          <div className={publicListClassName}>
            {docs.slice(0, 4).map((doc) => (
              <PublicListLink
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                title={doc.title}
                description={doc.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <PublicSectionHeading eyebrow="Blog" title="Pseudocode practice notes." />
            <Link href="/blog" className={`mt-6 ${textLinkClassName}`}>
              View all posts <ArrowRight size={15} />
            </Link>
          </div>
          <div className={publicListClassName}>
            {posts.slice(0, 3).map((post) => (
              <PublicListLink
                key={post.slug}
                href={`/blog/${post.slug}`}
                meta={post.readingTime}
                title={post.title}
                description={post.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--separator)] px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <PublicSectionHeading eyebrow="FAQ" title="Questions" />
          <div className={publicListClassName}>
            {faqItems.map((item) => (
              <details key={item.question} className="py-4">
                <summary className="cursor-pointer text-sm font-semibold transition hover:text-[var(--accent)]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-6 text-[var(--text2)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
