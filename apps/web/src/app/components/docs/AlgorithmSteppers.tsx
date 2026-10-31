"use client";

import { useMemo, useState } from "react";
import { useDictionary } from "@/i18n/context";
import { StepControls } from "./StepControls";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

type SortFrame = {
  values: number[];
  compare: [number, number] | null;
  swapped: boolean;
  sortedFrom: number;
  pass: number;
  comparisons: number;
  swaps: number;
  note: { key: "start" | "swap" | "keep" | "passEnd" | "done"; a?: number; b?: number; n?: number; s?: number };
};

/** Bubble sort with the early exit used in the IGCSE pseudocode: stop after a pass with no swaps. */
function bubbleFrames(start: number[]): SortFrame[] {
  const values = [...start];
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let swaps = 0;
  let sortedFrom = values.length;
  frames.push({ values: [...values], compare: null, swapped: false, sortedFrom, pass: 0, comparisons, swaps, note: { key: "start" } });
  for (let pass = 1; pass < start.length; pass++) {
    let passSwaps = 0;
    for (let j = 0; j < sortedFrom - 1; j++) {
      comparisons++;
      const a = values[j];
      const b = values[j + 1];
      const swap = a > b;
      if (swap) {
        values[j] = b;
        values[j + 1] = a;
        swaps++;
        passSwaps++;
      }
      frames.push({
        values: [...values],
        compare: [j, j + 1],
        swapped: swap,
        sortedFrom,
        pass,
        comparisons,
        swaps,
        note: { key: swap ? "swap" : "keep", a, b },
      });
    }
    sortedFrom--;
    const done = passSwaps === 0 || sortedFrom <= 1;
    frames.push({
      values: [...values],
      compare: null,
      swapped: false,
      sortedFrom: done ? 0 : sortedFrom,
      pass,
      comparisons,
      swaps,
      note: done ? { key: "done", n: pass } : { key: "passEnd", n: pass, s: passSwaps },
    });
    if (done) break;
  }
  return frames;
}

export function SortStepper({ values }: { values: number[] }) {
  const t = useDictionary().docs.visual;
  const frames = useMemo(() => bubbleFrames(values), [values]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = frames[step];
  const max = Math.max(...values);
  const notes = { start: t.sortStart, swap: t.sortSwap, keep: t.sortKeep, passEnd: t.sortPassEnd, done: t.sortDone };

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end justify-center gap-2 sm:gap-3">
        {frame.values.map((value, index) => {
          const comparing = frame.compare?.includes(index) ?? false;
          const sorted = index >= frame.sortedFrom;
          const state = comparing ? (frame.swapped ? "swap" : "compare") : sorted ? "sorted" : "idle";
          return (
            <div key={index} className="flex w-9 flex-col items-center gap-1.5 sm:w-11">
              <span className="text-xs font-semibold tabular-nums">{value}</span>
              <div className="doc-bar w-full" data-state={state} style={{ height: `${(value / max) * 8.5 + 1}rem` }} />
              <span className="text-[10px] tabular-nums text-[var(--text3)]">{index + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[var(--text2)]">
        <span>
          {t.pass} <strong className="tabular-nums text-[var(--text)]">{frame.pass}</strong>
        </span>
        <span>
          {t.comparisons} <strong className="tabular-nums text-[var(--text)]">{frame.comparisons}</strong>
        </span>
        <span>
          {t.swaps} <strong className="tabular-nums text-[var(--text)]">{frame.swaps}</strong>
        </span>
      </div>
      <div className="min-h-[2.75rem] rounded-lg bg-[var(--surface2)] px-4 py-3 text-center text-sm" aria-live="polite">
        {fill(notes[frame.note.key], { a: frame.note.a ?? "", b: frame.note.b ?? "", n: frame.note.n ?? "", s: frame.note.s ?? "" })}
      </div>
      <StepControls step={step} count={frames.length} onStep={setStep} playing={playing} onPlayingChange={setPlaying} intervalMs={850} />
    </div>
  );
}

export function SearchStepper({ values, target }: { values: number[]; target: number }) {
  const t = useDictionary().docs.visual;
  const foundAt = values.indexOf(target);
  const checks = foundAt === -1 ? values.length : foundAt + 1;
  const count = checks + 1;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const checking = step === 0 ? -1 : step - 1;
  const finished = step === count - 1;

  let note = fill(t.searchStart, { target });
  if (checking >= 0) {
    const hit = values[checking] === target;
    note = fill(hit ? t.searchHit : t.searchMiss, { i: checking + 1, v: values[checking], target });
    if (finished && !hit) note = fill(t.searchNone, { target });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max gap-1.5">
          {values.map((value, index) => {
            const state =
              index === checking ? (value === target ? "found" : "compare") : index < checking ? "checked" : "idle";
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-[var(--text3)]">{index + 1}</span>
                <span className="doc-cell" data-state={state}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="min-h-[2.75rem] rounded-lg bg-[var(--surface2)] px-4 py-3 text-center text-sm" aria-live="polite">
        {note}
      </div>
      <StepControls step={step} count={count} onStep={setStep} playing={playing} onPlayingChange={setPlaying} intervalMs={800} />
    </div>
  );
}
