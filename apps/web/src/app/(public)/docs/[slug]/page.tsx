import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import CopyableCodeBlock from "@/app/(public)/manual/CopyableCodeBlock";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  publicMainClassName,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
} from "@/app/components/PublicUi";
import { docs, getDoc, siteUrl } from "@/lib/seo-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);

  if (!doc) {
    return {};
  }

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: `/docs/${doc.slug}`,
    },
    openGraph: {
      title: `${doc.title} | PseudoEditor`,
      description: doc.description,
      url: `${siteUrl}/docs/${doc.slug}`,
      type: "article",
    },
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDoc(slug);

  if (!doc) {
    notFound();
  }

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: doc.title,
      description: doc.description,
      dateModified: doc.updated,
      url: `${siteUrl}/docs/${doc.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Docs", item: `${siteUrl}/docs` },
        { "@type": "ListItem", position: 3, name: doc.title, item: `${siteUrl}/docs/${doc.slug}` },
      ],
    },
  ];

  return (
    <main className={publicMainClassName}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader active="docs" />
      <article className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text2)] transition hover:text-[var(--text)]">
          <ArrowLeft size={15} /> Docs
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">{doc.title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--text2)]">{doc.description}</p>
        <p className="mt-2 text-xs font-medium text-[var(--text3)]">Updated {doc.updated}</p>

        <div className="mt-10 space-y-10 border-t border-[var(--separator)] pt-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-[var(--text2)]">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.example ? <CopyableCodeBlock code={section.example} className="mt-5" /> : null}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2.5">
          <Link href="/app" className={publicPrimaryButtonClassName}>
            Try it in the editor <ExternalLink size={15} />
          </Link>
          <Link href="/manual" className={publicSecondaryButtonClassName}>
            Open manual
          </Link>
        </div>
      </article>
    </main>
  );
}
