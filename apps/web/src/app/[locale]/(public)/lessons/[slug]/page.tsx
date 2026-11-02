import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentArticle } from "@/app/components/docs/ContentArticle";
import { pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/server";
import { docs, docPath, getDoc, isGuide } from "@/lib/docs";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return docs.filter((doc) => !isGuide(doc)).map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const doc = getDoc(locale, slug);
  if (!doc || isGuide(doc)) return {};
  const base = pageMetadata(locale, docPath(doc), doc.title, doc.description, getDictionary(locale).meta.ogImageAlt);
  return { ...base, openGraph: { ...base.openGraph, type: "article", modifiedTime: doc.updated } };
}

export default async function LessonPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const doc = getDoc(locale, slug);
  if (!doc || isGuide(doc)) notFound();
  return <ContentArticle locale={locale} doc={doc} />;
}
