import type { Metadata } from "next";
import ManualContent from "@/app/[locale]/(public)/manual/ManualContent";
import { pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/app/manual", t.appManualTitle, t.appManualDescription, t.ogImageAlt);
}

export default async function AppManualPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return <ManualContent locale={locale} />;
}
