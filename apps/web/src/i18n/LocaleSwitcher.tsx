"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, localeNames, localePath, locales, localeTags } from "./config";
import { useLocale } from "./context";

/** Path without any locale segment. English pages are rewritten to `/en/...`, so strip that too. */
function pathWithoutLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return pathname || "/";
  return `/${rest.join("/")}`;
}

/** Links to the current page in the other language. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const target = locales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <Link
      href={localePath(target, pathWithoutLocale(pathname))}
      hrefLang={localeTags[target]}
      lang={localeTags[target]}
      className={className}
      prefetch={false}
    >
      {localeNames[target]}
    </Link>
  );
}
