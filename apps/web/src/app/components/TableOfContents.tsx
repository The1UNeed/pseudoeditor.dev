"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string };

// A section becomes current once its top crosses this line, just under the sticky header.
const activationLine = 120;

export function TableOfContents({ items, className = "" }: { items: TocItem[]; className?: string }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.flatMap((item) => document.getElementById(item.id) ?? []);
    if (!sections.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      // Short closing sections can never reach the line, so at the bottom take the last one on screen.
      const line = atBottom ? window.innerHeight : activationLine;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section;
      }
      setActiveId(current.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav className={`site-toc ${className}`}>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} aria-current={item.id === activeId ? "location" : undefined}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
