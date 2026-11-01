import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type SettingsSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  className?: string;
};

// Native select with the browser chevron replaced, so the arrow sits inside the field's padding.
// The open option list follows the root color-scheme that the theme code sets.
export function SettingsSelect({ className = "", children, ...props }: SettingsSelectProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <select
        {...props}
        className="h-9 w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg border border-[var(--separator)] bg-[var(--bg)] pl-3 pr-9 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-button)] outline-none transition-colors hover:border-[color-mix(in_srgb,var(--text3)_45%,var(--separator))] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]"
      />
    </span>
  );
}
