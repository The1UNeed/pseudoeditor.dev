"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useDictionary } from "@/i18n/context";
import { StepControls } from "./StepControls";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

/** A trace table, optionally revealed one row at a time. */
export function TraceTable({ columns, rows, stepper = false }: { columns: string[]; rows: string[][]; stepper?: boolean }) {
  const [step, setStep] = useState(stepper ? 0 : rows.length - 1);
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="doc-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} data-hidden={index > step} data-active={stepper && index === step}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="font-mono">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stepper ? <StepControls step={step} count={rows.length} onStep={setStep} /> : null}
    </div>
  );
}

/** A 1D or 2D array. Click a cell to see how to address it. */
export function ArrayGrid({
  name,
  values,
  highlight,
  string = false,
}: {
  name: string;
  values: string[][];
  highlight?: [number, number];
  string?: boolean;
}) {
  const t = useDictionary().docs.visual;
  const [selected, setSelected] = useState<[number, number]>(highlight ?? [0, 0]);
  const twoD = values.length > 1;
  const [row, column] = selected;
  const addressOf = (r: number, c: number) =>
    string ? `SUBSTRING(${name}, ${c + 1}, 1)` : twoD ? `${name}[${r + 1}, ${c + 1}]` : `${name}[${c + 1}]`;
  const address = addressOf(row, column);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <table className="doc-array mx-auto border-separate border-spacing-1.5">
          <thead>
            <tr>
              {twoD ? <th /> : null}
              {values[0].map((_, index) => (
                <th key={index} data-active={index === column}>
                  {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((cells, rowIndex) => (
              <tr key={rowIndex}>
                {twoD ? (
                  <th data-active={rowIndex === row}>
                    {rowIndex + 1}
                  </th>
                ) : null}
                {cells.map((cell, cellIndex) => {
                  const active = rowIndex === row && cellIndex === column;
                  const inLine = twoD && (rowIndex === row || cellIndex === column);
                  return (
                    <td key={cellIndex} className="p-0">
                      <button
                        type="button"
                        className="doc-cell"
                        data-state={active ? "found" : inLine ? "checked" : "idle"}
                        onClick={() => setSelected([rowIndex, cellIndex])}
                        aria-label={addressOf(rowIndex, cellIndex)}
                      >
                        {cell}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center font-mono text-sm" aria-live="polite">
        {address} = <strong className="text-[var(--accent)]">{values[row][column]}</strong>
      </div>
      <div className="text-center text-xs text-[var(--text3)]">{twoD ? t.arrayHint2d : t.arrayHint}</div>
    </div>
  );
}

/** A black-and-white bitmap you can paint, with its binary rows and file size. */
export function PixelGrid({ rows: initial }: { rows: string[] }) {
  const t = useDictionary().docs.visual;
  const [rows, setRows] = useState(initial);
  const [depth, setDepth] = useState(1);
  const width = rows[0].length;
  const height = rows.length;
  const bits = width * height * depth;

  const toggle = (r: number, c: number) =>
    setRows((current) =>
      current.map((row, ri) => (ri === r ? row.slice(0, c) + (row[c] === "1" ? "0" : "1") + row.slice(c + 1) : row)),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="grid gap-px rounded-md bg-[var(--separator)] p-px" style={{ gridTemplateColumns: `repeat(${width}, 1.5rem)` }}>
          {rows.map((row, r) =>
            [...row].map((pixel, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                className="h-6 w-6 transition-colors"
                style={{ background: pixel === "1" ? "var(--text)" : "var(--bg)" }}
                onClick={() => toggle(r, c)}
                aria-label={`${t.pixel} ${r + 1}, ${c + 1}: ${pixel}`}
                aria-pressed={pixel === "1"}
              />
            )),
          )}
        </div>
        <div className="font-mono text-[13px] leading-6 tracking-[0.2em] text-[var(--text2)]" aria-hidden>
          {rows.map((row, index) => (
            <div key={index}>
              {[...row].map((pixel, c) => (
                <span key={c} className={pixel === "1" ? "text-[var(--accent)]" : undefined}>
                  {pixel}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="mr-1 text-xs text-[var(--text3)]">{t.colourDepth}</span>
        {[1, 8, 24].map((option) => (
          <button key={option} type="button" className="doc-tab" aria-pressed={depth === option} onClick={() => setDepth(option)}>
            {option} {t.bitUnit}
          </button>
        ))}
      </div>
      <div className="text-center font-mono text-xs text-[var(--text2)]">
        {width} × {height} × {depth} = {bits} {t.bitsWord} = {bits / 8} {t.bytesWord}
      </div>
      <div className="text-center text-xs text-[var(--text3)]">{t.pixelHint}</div>
    </div>
  );
}

const wave = (x: number) => 0.55 * Math.sin(x * 2 * Math.PI * 1.1) + 0.3 * Math.sin(x * 2 * Math.PI * 2.7 + 0.8);

/** Sample a sound wave: more samples and more bits per sample get closer to the real curve. */
export function SoundSampler() {
  const t = useDictionary().docs.visual;
  const [rate, setRate] = useState(12);
  const [resolution, setResolution] = useState(3);
  const levels = 2 ** resolution;
  const W = 520;
  const H = 180;
  const pad = 14;
  const toY = (v: number) => pad + ((1 - (v + 1) / 2) * (H - pad * 2));
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = i / 160;
    return `${i === 0 ? "M" : "L"}${(x * W).toFixed(1)} ${toY(wave(x)).toFixed(1)}`;
  }).join(" ");
  const quantise = (v: number) => {
    const level = Math.round(((v + 1) / 2) * (levels - 1));
    return { level, value: (level / (levels - 1)) * 2 - 1 };
  };
  const samples = Array.from({ length: rate }, (_, i) => {
    const x = (i + 0.5) / rate;
    return { x, ...quantise(wave(x)) };
  });
  const steps = samples
    .map((s, i) => {
      const x0 = (i / rate) * W;
      const x1 = ((i + 1) / rate) * W;
      return `${i === 0 ? "M" : "L"}${x0.toFixed(1)} ${toY(s.value).toFixed(1)} H${x1.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.soundAria}>
        {levels <= 32
          ? Array.from({ length: levels }, (_, i) => {
              const y = toY((i / (levels - 1)) * 2 - 1);
              return <line key={i} x1={0} x2={W} y1={y} y2={y} stroke="var(--separator)" strokeWidth={1} />;
            })
          : null}
        <path d={curve} fill="none" stroke="var(--text3)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={steps} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
        {samples.map((s, i) => (
          <circle key={i} cx={s.x * W} cy={toY(s.value)} r={3.5} fill="var(--accent)" />
        ))}
      </svg>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-[var(--text2)]">
          <span className="flex justify-between">
            <span>{t.sampleRate}</span>
            <strong className="tabular-nums text-[var(--text)]">{rate}</strong>
          </span>
          <input type="range" min={4} max={48} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="doc-range mt-2 w-full" />
        </label>
        <label className="block text-xs text-[var(--text2)]">
          <span className="flex justify-between">
            <span>{t.sampleResolution}</span>
            <strong className="tabular-nums text-[var(--text)]">
              {resolution} {t.bitUnit} · {levels} {t.levels}
            </strong>
          </span>
          <input type="range" min={1} max={8} value={resolution} onChange={(e) => setResolution(Number(e.target.value))} className="doc-range mt-2 w-full" />
        </label>
      </div>
      <div className="text-center font-mono text-xs text-[var(--text2)]">
        {fill(t.soundSize, { n: rate, b: resolution, total: rate * resolution })}
      </div>
    </div>
  );
}

const ones = (bits: number[]) => bits.reduce((sum, bit) => sum + bit, 0);

/** Even or odd parity: add a parity bit, flip bits "in transit", and see whether the receiver notices. */
export function ParityChecker({ value }: { value: number }) {
  const t = useDictionary().docs.visual;
  const [parity, setParity] = useState<"even" | "odd">("even");
  const data = Array.from({ length: 7 }, (_, i) => (value >> (6 - i)) & 1);
  const parityBit = parity === "even" ? ones(data) % 2 : 1 - (ones(data) % 2);
  const sent = [parityBit, ...data];
  const [flipped, setFlipped] = useState<number[]>([]);
  const received = sent.map((bit, index) => (flipped.includes(index) ? 1 - bit : bit));
  const count = ones(received);
  const ok = parity === "even" ? count % 2 === 0 : count % 2 === 1;

  const row = (bits: number[], clickable: boolean) => (
    <div className="mx-auto flex w-max gap-1.5">
      {bits.map((bit, index) => (
        <button
          key={index}
          type="button"
          disabled={!clickable}
          onClick={() => setFlipped((current) => (current.includes(index) ? current.filter((i) => i !== index) : [...current, index]))}
          className="doc-bit"
          data-on={bit === 1}
          data-parity={index === 0}
          data-flipped={clickable && flipped.includes(index)}
          aria-label={index === 0 ? `${t.parityBit}: ${bit}` : `${t.bit} ${index}: ${bit}`}
        >
          {bit}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {(["even", "odd"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className="doc-tab"
            aria-pressed={parity === option}
            onClick={() => {
              setParity(option);
              setFlipped([]);
            }}
          >
            {option === "even" ? t.evenParity : t.oddParity}
          </button>
        ))}
      </div>
      <div className="space-y-1.5 overflow-x-auto">
        <div className="text-center text-[11px] font-medium uppercase tracking-wider text-[var(--text3)]">{t.sent}</div>
        {row(sent, false)}
        <div className="pt-2 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--text3)]">{t.received}</div>
        {row(received, true)}
      </div>
      <div
        className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${ok ? "bg-[color-mix(in_srgb,var(--green)_14%,transparent)] text-[var(--green)]" : "bg-[color-mix(in_srgb,var(--red)_14%,transparent)] text-[var(--red)]"}`}
        aria-live="polite"
      >
        {fill(ok ? t.parityOk : t.parityError, { n: count })}
        {ok && flipped.length > 0 ? ` ${t.parityMissed}` : ""}
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text3)]">
        <span>{t.parityHint}</span>
        <button type="button" className="doc-ctl" onClick={() => setFlipped([])} disabled={flipped.length === 0} aria-label={t.reset}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

/** ISBN-13 check digit: weights 1, 3, 1, 3 ... then the digit that brings the total to a multiple of 10. */
const isbnCheck = (digits: number[]) => {
  const total = digits.reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);
  return { total, check: (10 - (total % 10)) % 10 };
};

export function CheckDigit({ digits: initial }: { digits: string }) {
  const t = useDictionary().docs.visual;
  const original = [...initial].map(Number);
  const printed = isbnCheck(original).check;
  const [digits, setDigits] = useState(original);
  const { total, check } = isbnCheck(digits);
  const ok = check === printed;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max gap-1">
          {digits.map((digit, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <button
                type="button"
                className="doc-cell doc-cell-narrow"
                data-state={digit !== original[index] ? "swap" : "idle"}
                onClick={() => setDigits((current) => current.map((d, i) => (i === index ? (d + 1) % 10 : d)))}
                aria-label={`${t.digit} ${index + 1}: ${digit}`}
              >
                {digit}
              </button>
              <span className="text-[10px] text-[var(--text3)]">×{index % 2 === 0 ? 1 : 3}</span>
            </div>
          ))}
          <div className="ml-2 flex flex-col items-center gap-1">
            <span className="doc-cell doc-cell-narrow" data-state={ok ? "found" : "error"}>
              {printed}
            </span>
            <span className="text-[10px] text-[var(--text3)]">{t.check}</span>
          </div>
        </div>
      </div>
      <div className="text-center font-mono text-xs text-[var(--text2)]">
        {fill(t.checkWorking, { total, mod: total % 10, check })}
      </div>
      <div
        className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${ok ? "bg-[color-mix(in_srgb,var(--green)_14%,transparent)] text-[var(--green)]" : "bg-[color-mix(in_srgb,var(--red)_14%,transparent)] text-[var(--red)]"}`}
        aria-live="polite"
      >
        {ok ? t.checkOk : fill(t.checkError, { check, printed })}
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text3)]">
        <span>{t.checkHint}</span>
        <button type="button" className="doc-ctl" onClick={() => setDigits(original)} aria-label={t.reset}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
