import Link from "next/link";

const productLinks = [
  { href: "/app", label: "Editor" },
  { href: "/docs", label: "Docs" },
  { href: "/manual", label: "Manual" },
  { href: "/blog", label: "Blog" },
];

const resourceLinks = [
  { href: "https://github.com/The1UNeed/pseudoeditor.dev", label: "GitHub" },
  { href: "https://github.com/The1UNeed/pseudoeditor.dev/issues", label: "Feedback" },
];

const linkClassName = "text-[var(--text2)] transition hover:text-[var(--text)]";
const groupLabelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text3)]";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--separator)] bg-[var(--sidebar)] px-4 py-10 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-[var(--text)]">PseudoEditor</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
            Write, compile, run, and debug IGCSE-style pseudocode directly in your browser.
          </p>
        </div>

        <nav className="flex flex-wrap gap-10 md:gap-14">
          <div>
            <p className={groupLabelClassName}>Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClassName}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={groupLabelClassName}>Resources</p>
            <ul className="mt-3 space-y-2 text-sm">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-2 border-t border-[var(--separator)] pt-6 text-xs text-[var(--text3)] md:flex-row">
        <p>&copy; {year} Alex Xin LIU. Licensed under the Apache License 2.0.</p>
        <p>Built for students and teachers practicing IGCSE pseudocode.</p>
      </div>
    </footer>
  );
}
