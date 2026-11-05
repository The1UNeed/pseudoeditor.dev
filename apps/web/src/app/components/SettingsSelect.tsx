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
        className="h-[34px] w-full min-w-0 cursor-pointer appearance-none truncate rounded-[var(--radius-control)] border border-[var(--separator-strong)] bg-[var(--bg)] pl-2.5 pr-8 text-[13px] font-medium text-[var(--text)] outline-none transition-colors hover:border-[var(--text3)] focus-visible:border-[var(--accent)] focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] pointer-coarse:h-11 pointer-coarse:text-[15px]"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text3)]"
      />
    </span>
  );
}
