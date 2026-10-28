import type { Metadata } from "next";
import { LegalPage } from "@/app/components/LegalPage";
import { pageMetadata } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { privacyEn } from "./content.en";
import { privacyZh } from "./content.zh";

const effectiveDate = "2026-10-28";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale).meta;
  return pageMetadata(locale, "/privacy", t.privacyTitle, t.privacyDescription, t.ogImageAlt);
}

export default async function PrivacyPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return <LegalPage locale={locale} document={locale === "zh" ? privacyZh : privacyEn} effectiveDate={effectiveDate} />;
}
