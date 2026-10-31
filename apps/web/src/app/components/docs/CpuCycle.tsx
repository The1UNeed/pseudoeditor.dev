"use client";

import { useState } from "react";
import type { CpuBus, CpuPart } from "@/lib/docs/types";
import { useDictionary } from "@/i18n/context";
import { StepControls } from "./StepControls";

type Step = {
  title: string;
  detail: string;
  active: CpuPart[];
  buses?: CpuBus[];
  values?: Partial<Record<CpuPart, string>>;
};

const boxes: Array<{ part: CpuPart; x: number; y: number; w: number; h: number; name: string }> = [
  { part: "cu", x: 24, y: 44, w: 112, h: 58, name: "CU" },
  { part: "alu", x: 24, y: 116, w: 112, h: 58, name: "ALU" },
  { part: "acc", x: 24, y: 188, w: 112, h: 58, name: "ACC" },
  { part: "pc", x: 156, y: 44, w: 112, h: 44, name: "PC" },
  { part: "mar", x: 156, y: 98, w: 112, h: 44, name: "MAR" },
  { part: "mdr", x: 156, y: 152, w: 112, h: 44, name: "MDR" },
  { part: "cir", x: 156, y: 206, w: 112, h: 44, name: "CIR" },
];

const busY: Record<CpuBus, number> = { control: 66, address: 120, data: 174 };

/** Step through the fetch-decode-execute cycle on a Von Neumann CPU. */
export function CpuCycle({ steps }: { steps: Step[] }) {
  const t = useDictionary().docs.visual;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = steps[step];
  const values = steps.slice(0, step + 1).reduce<Partial<Record<CpuPart, string>>>(
    (all, item) => ({ ...all, ...item.values }),
    {},
  );
  const isActive = (part: CpuPart) => current.active.includes(part);
  const memoryActive = isActive("memory");

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 560 270" className="mx-auto block w-full min-w-[30rem] max-w-[40rem]" role="img" aria-label={current.title}>
          <rect x={10} y={10} width={272} height={250} rx={14} fill="var(--surface)" stroke="var(--separator)" />
          <text x={24} y={32} fontSize={11} fontWeight={700} fill="var(--text3)" letterSpacing="0.12em">
            CPU
          </text>
          {boxes.map((box) => {
            const on = isActive(box.part);
            const value = values[box.part];
            return (
              <g key={box.part}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={9}
                  fill={on ? "color-mix(in srgb, var(--accent) 16%, var(--bg))" : "var(--bg)"}
                  stroke={on ? "var(--accent)" : "var(--separator)"}
                  strokeWidth={on ? 2 : 1}
                  className="transition-all duration-300"
                />
                <text x={box.x + 10} y={box.y + 18} fontSize={11} fontWeight={700} fill={on ? "var(--accent)" : "var(--text2)"}>
                  {box.name}
                </text>
                {value ? (
                  <text x={box.x + box.w - 10} y={box.y + box.h - 11} textAnchor="end" fontSize={12} fontFamily="var(--font-mono), monospace" fill="var(--text)">
                    {value}
                  </text>
                ) : null}
              </g>
            );
          })}

          {(Object.keys(busY) as CpuBus[]).map((bus) => {
            const on = current.buses?.includes(bus) ?? false;
            const y = busY[bus];
            return (
              <g key={bus}>
                <line
                  x1={282}
                  y1={y}
                  x2={378}
                  y2={y}
                  stroke={on ? "var(--accent)" : "var(--separator)"}
                  strokeWidth={on ? 4 : 3}
                  strokeDasharray={on ? "8 5" : undefined}
                  className={on ? "doc-bus-flow" : undefined}
                />
                <text x={330} y={y - 8} textAnchor="middle" fontSize={10} fill={on ? "var(--accent)" : "var(--text3)"}>
                  {t.buses[bus]}
                </text>
              </g>
            );
          })}

          <rect
            x={378}
            y={10}
            width={172}
            height={250}
            rx={14}
            fill={memoryActive ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)"}
            stroke={memoryActive ? "var(--accent)" : "var(--separator)"}
            strokeWidth={memoryActive ? 2 : 1}
          />
          <text x={392} y={32} fontSize={11} fontWeight={700} fill={memoryActive ? "var(--accent)" : "var(--text3)"} letterSpacing="0.12em">
            {t.memory}
          </text>
          {["0100  LDA 0110", "0101  ADD 0111", "0110  0005", "0111  0003"].map((row, index) => {
            const [address, content] = row.split("  ");
            const highlighted = memoryActive && values.mar === address;
            return (
              <g key={address}>
                <rect x={392} y={48 + index * 50} width={144} height={38} rx={7} fill={highlighted ? "color-mix(in srgb, var(--accent) 22%, var(--bg))" : "var(--bg)"} stroke="var(--separator)" />
                <text x={402} y={72 + index * 50} fontSize={11} fontFamily="var(--font-mono), monospace" fill="var(--text3)">
                  {address}
                </text>
                <text x={526} y={72 + index * 50} textAnchor="end" fontSize={12} fontFamily="var(--font-mono), monospace" fill="var(--text)">
                  {content}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="min-h-[4.5rem] rounded-lg bg-[var(--surface2)] px-4 py-3" aria-live="polite">
        <div className="text-sm font-semibold">{current.title}</div>
        <div className="mt-1 text-sm leading-6 text-[var(--text2)]">{current.detail}</div>
      </div>
      <StepControls step={step} count={steps.length} onStep={setStep} playing={playing} onPlayingChange={setPlaying} intervalMs={2200} />
    </div>
  );
}
