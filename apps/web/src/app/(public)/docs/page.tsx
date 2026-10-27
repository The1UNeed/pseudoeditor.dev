import type { Metadata } from "next";
import { PublicHeader } from "@/app/components/PublicHeader";
import {
  PublicListLink,
  PublicPageIntro,
  publicListClassName,
  publicMainClassName,
} from "@/app/components/PublicUi";
import { docs, siteUrl } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Pseudocode Docs",
  description:
    "Learn PseudoEditor syntax, variables, selection, loops, arrays, flowcharts, workspace saving, and compiler debugging.",
  alternates: {
    canonical: "/docs",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Docs", item: `${siteUrl}/docs` },
  ],
};

export default function DocsIndexPage() {
  return (
    <main className={publicMainClassName}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader active="docs" />
      <PublicPageIntro
        eyebrow="Documentation"
        title="Pseudocode docs for browser practice."
        description="Learn the syntax PseudoEditor compiles, then jump into the browser app to test the idea immediately."
      />
      <section className="px-4 pb-16 md:px-6">
        <div className={`mx-auto max-w-6xl ${publicListClassName}`}>
          {docs.map((doc) => (
            <PublicListLink
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              title={doc.title}
              description={doc.description}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
