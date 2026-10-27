import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* Shared building blocks so the public site uses the same surfaces, buttons, and type as the editor. */

export const publicMainClassName = "min-h-screen bg-[var(--bg)] text-[var(--text)]";

export const publicListClassName =
  "divide-y divide-[var(--separator)] border-y border-[var(--separator)]";

export const publicPrimaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110";

export const publicSecondaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--separator)] bg-[var(--surface2)] px-5 text-sm font-medium text-[var(--text2)] transition hover:bg-[var(--surface3)] hover:text-[var(--text)]";

export const publicEyebrowClassName =
  "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text3)]";

export function PublicPageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="px-4 pb-10 pt-12 md:px-6 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <p className={publicEyebrowClassName}>{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text2)]">{description}</p>
        {children ? <div className="mt-7 flex flex-wrap gap-2.5">{children}</div> : null}
      </div>
    </section>
  );
}

export function PublicSectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

/** A row in a divided list that links to a doc or post. */
export function PublicListLink({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="group flex items-start justify-between gap-6 py-5">
      <div className="min-w-0">
        {meta ? <p className="mb-1 text-xs font-medium text-[var(--text3)]">{meta}</p> : null}
        <h3 className="text-base font-semibold transition group-hover:text-[var(--accent)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--text2)]">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="mt-1 shrink-0 text-[var(--text3)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
      />
    </Link>
  );
}
