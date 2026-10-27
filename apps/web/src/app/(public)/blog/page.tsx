import type { Metadata } from "next";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  PublicListLink,
  PublicPageIntro,
  publicListClassName,
  publicMainClassName,
} from "@/app/components/PublicUi";
import { posts, siteUrl } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Pseudocode Blog",
  description:
    "Read PseudoEditor posts about IGCSE pseudocode, tracing, loops, compiler errors, and browser-based practice.",
  alternates: {
    canonical: "/blog",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "PseudoEditor Blog",
  url: `${siteUrl}/blog`,
};

export default function BlogIndexPage() {
  return (
    <main className={publicMainClassName}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader active="blog" />
      <PublicPageIntro
        eyebrow="Blog"
        title="Pseudocode practice notes."
        description="Short guides for students and teachers using a browser pseudocode compiler for algorithm practice."
      />
      <section className="px-4 pb-16 md:px-6">
        <div className={`mx-auto max-w-6xl ${publicListClassName}`}>
          {posts.map((post) => (
            <PublicListLink
              key={post.slug}
              href={`/blog/${post.slug}`}
              meta={`${post.date} · ${post.readingTime}`}
              title={post.title}
              description={post.description}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
