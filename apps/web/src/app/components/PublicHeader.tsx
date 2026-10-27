import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

type PublicHeaderProps = {
  active?: "docs" | "blog" | "manual";
};

const navItems = [
  { href: "/docs", label: "Docs", key: "docs" },
  { href: "/blog", label: "Blog", key: "blog" },
  { href: "/manual", label: "Manual", key: "manual" },
] as const;

export function PublicHeader({ active }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--separator)] bg-[var(--titlebar)] px-4 md:px-6">
      <nav className="mx-auto flex h-[52px] max-w-6xl items-center gap-4">
        <Link href="/" aria-label="PseudoEditor home" className="flex items-center gap-2 transition hover:opacity-80">
          <Image src="/branding/app-icon-128.png" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="hidden text-[13px] font-semibold text-[var(--text)] sm:inline">PseudoEditor</span>
        </Link>
        <div className="flex flex-1 items-center justify-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                active === item.key
                  ? "bg-[var(--selected)] text-[var(--text)]"
                  : "text-[var(--text2)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link
          href="/app"
          aria-label="Open editor"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          <Play size={14} />
          <span className="hidden sm:inline">Open editor</span>
        </Link>
      </nav>
    </header>
  );
}
