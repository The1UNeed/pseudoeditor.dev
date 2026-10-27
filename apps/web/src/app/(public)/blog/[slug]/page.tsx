import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  publicMainClassName,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
} from "@/app/components/PublicUi";
import { getPost, posts, siteUrl } from "@/lib/seo-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | PseudoEditor`,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      url: `${siteUrl}/blog/${post.slug}`,
      author: {
        "@type": "Organization",
        name: "PseudoEditor",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
      ],
    },
  ];

  return (
    <main className={publicMainClassName}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader active="blog" />
      <article className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text2)] transition hover:text-[var(--text)]">
          <ArrowLeft size={15} /> Blog
        </Link>
        <p className="mt-6 text-xs font-medium text-[var(--text3)]">
          {post.date} · {post.readingTime}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--text2)]">{post.description}</p>
        <p className="mt-3 text-xs text-[var(--text3)]">{post.tags.join(" · ")}</p>

        <div className="mt-10 space-y-10 border-t border-[var(--separator)] pt-10">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-[var(--text2)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2.5">
          <Link href="/app" className={publicPrimaryButtonClassName}>
            Practice in the editor <ExternalLink size={15} />
          </Link>
          <Link href="/docs" className={publicSecondaryButtonClassName}>
            Browse docs
          </Link>
        </div>
      </article>
    </main>
  );
}
