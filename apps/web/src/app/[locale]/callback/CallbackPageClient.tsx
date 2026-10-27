"use client";

import Link from "next/link";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { localePath } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/context";
import { isCloudAuthConfigured } from "@/lib/auth-components";

export default function CallbackPageClient() {
  const locale = useLocale();
  const t = useDictionary().auth;
  if (!isCloudAuthConfigured()) {
    return (
      <div className="site-card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t.callbackNotConfiguredTitle}</h1>
        <p className="mt-3 leading-7 text-[var(--ink-2)]">{t.callbackNotConfiguredBody}</p>
        <Link href={localePath(locale, "/app")} className="site-btn mt-6">
          {t.backToApp}
        </Link>
      </div>
    );
  }

  return <AuthenticateWithRedirectCallback signInFallbackRedirectUrl={localePath(locale, "/app")} />;
}
