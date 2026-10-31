"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useDictionary } from "@/i18n/context";

/** Back / Next / Play / Reset for the step-through visuals. `step` runs from 0 to `count - 1`. */
export function StepControls({
  step,
  count,
  onStep,
  playing,
  onPlayingChange,
  intervalMs = 900,
}: {
  step: number;
  count: number;
  onStep: (step: number) => void;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  intervalMs?: number;
}) {
  const t = useDictionary().docs.visual;
  const atEnd = step >= count - 1;
  const go = (next: number) => onStep(Math.max(0, Math.min(count - 1, next)));

  useEffect(() => {
    if (!playing || !onPlayingChange) return;
    if (atEnd) {
      onPlayingChange(false);
      return;
    }
    const timer = setTimeout(() => onStep(step + 1), intervalMs);
    return () => clearTimeout(timer);
  }, [playing, atEnd, step, onStep, onPlayingChange, intervalMs]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="doc-ctl"
        onClick={() => go(step - 1)}
        disabled={step <= 0}
        aria-label={t.back}
      >
        <ChevronLeft size={15} /> <span className="max-sm:hidden">{t.back}</span>
      </button>
      <button type="button" className="doc-ctl doc-ctl-primary" onClick={() => go(step + 1)} disabled={atEnd}>
        {t.next} <ChevronRight size={15} />
      </button>
      {onPlayingChange ? (
        <button
          type="button"
          className="doc-ctl"
          onClick={() => {
            if (atEnd) go(0);
            onPlayingChange(!playing);
          }}
          aria-label={playing ? t.pause : t.play}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span className="max-sm:hidden">{playing ? t.pause : t.play}</span>
        </button>
      ) : null}
      <button type="button" className="doc-ctl" onClick={() => go(0)} disabled={step === 0} aria-label={t.reset}>
        <RotateCcw size={14} />
      </button>
      <span className="ml-auto text-xs tabular-nums text-[var(--text3)]">
        {t.step} {step + 1} / {count}
      </span>
    </div>
  );
}
