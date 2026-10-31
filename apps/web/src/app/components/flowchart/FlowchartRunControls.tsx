'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { useDictionary } from '@/i18n/context';

export const RUN_SPEEDS = [1, 2, 4] as const;

interface FlowchartRunControlsProps {
  /** Null when the flowchart no longer matches the code that ran. */
  stepCount: number | null;
  index: number;
  playing: boolean;
  speed: number;
  /** What the current block did, such as `Count >= 3 → No`. */
  description: string;
  lastOutput: string | null;
  stopped: boolean;
  truncatedAt: number | null;
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onClose: () => void;
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text2)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/** Steps through the last run on the flowchart. */
export function FlowchartRunControls({
  stepCount,
  index,
  playing,
  speed,
  description,
  lastOutput,
  stopped,
  truncatedAt,
  onIndexChange,
  onPlayingChange,
  onSpeedChange,
  onClose,
}: FlowchartRunControlsProps) {
  const t = useDictionary().editor.flowchart.run;
  const lastIndex = (stepCount ?? 1) - 1;
  const atEnd = index >= lastIndex;

  return (
    <div
      role="group"
      aria-label={t.label}
      className="pointer-events-auto flex max-w-[min(720px,calc(100%-2rem))] flex-col gap-1 rounded-xl border border-[var(--separator)] bg-[var(--sidebar)] px-2 py-1.5 shadow-lg"
    >
      {stepCount === null ? (
        <div className="flex items-center gap-2 pl-2">
          <p className="text-xs text-[var(--text2)]">{t.outOfDate}</p>
          <ControlButton label={t.close} onClick={onClose}>
            <X className="h-4 w-4" />
          </ControlButton>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <ControlButton label={t.first} onClick={() => onIndexChange(0)} disabled={index === 0}>
              <SkipBack className="h-4 w-4" />
            </ControlButton>
            <ControlButton label={t.previous} onClick={() => onIndexChange(index - 1)} disabled={index === 0}>
              <ChevronLeft className="h-4 w-4" />
            </ControlButton>
            <button
              type="button"
              onClick={() => {
                if (!playing && atEnd) {
                  onIndexChange(0);
                }
                onPlayingChange(!playing);
              }}
              aria-label={playing ? t.pause : t.play}
              title={playing ? t.pause : t.play}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition hover:opacity-90"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <ControlButton label={t.next} onClick={() => onIndexChange(index + 1)} disabled={atEnd}>
              <ChevronRight className="h-4 w-4" />
            </ControlButton>
            <ControlButton label={t.last} onClick={() => onIndexChange(lastIndex)} disabled={atEnd}>
              <SkipForward className="h-4 w-4" />
            </ControlButton>

            <span className="ml-1 shrink-0 text-xs font-medium tabular-nums text-[var(--text)]">
              {t.stepOf(index + 1, stepCount)}
            </span>
            <span
              className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-[var(--text2)] [font-variant-ligatures:none]"
              title={description}
              data-testid="flowchart-run-description"
            >
              {description}
            </span>

            <button
              type="button"
              onClick={() => onSpeedChange(RUN_SPEEDS[(RUN_SPEEDS.indexOf(speed as 1 | 2 | 4) + 1) % RUN_SPEEDS.length])}
              aria-label={t.speed(speed)}
              title={t.speed(speed)}
              className="ml-1 h-8 shrink-0 rounded-lg px-2 text-xs font-medium tabular-nums text-[var(--text2)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              {speed}×
            </button>
            <ControlButton label={t.close} onClick={onClose}>
              <X className="h-4 w-4" />
            </ControlButton>
          </div>

          {stopped || truncatedAt !== null || lastOutput !== null ? (
            <div className="flex items-center gap-3 px-2 pb-0.5 text-xs">
              {stopped ? <span className="text-[var(--red)]">{t.stopped}</span> : null}
              {lastOutput !== null ? (
                <span className="min-w-0 truncate text-[var(--text2)]">
                  <span className="text-[var(--text3)]">{t.output}: </span>
                  <span className="font-mono text-[var(--text)] [font-variant-ligatures:none]" data-testid="flowchart-run-output">
                    {lastOutput}
                  </span>
                </span>
              ) : null}
              {truncatedAt !== null ? <span className="text-[var(--text3)]">{t.truncated(truncatedAt)}</span> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
