"use client";

import { useState } from "react";
import type { GateName } from "@/lib/docs/types";
import { useDictionary } from "@/i18n/context";
import { GATE_H, GATE_W, GateShape, applyGate, inputRows, wireColor } from "./logic";

export const inputInset = (gate: GateName) => (gate === "OR" || gate === "NOR" || gate === "XOR" ? 8 : 0);

/** Pick a gate, flip its inputs, and see the matching truth-table row light up. */
export function LogicGateExplorer({ gates }: { gates: GateName[] }) {
  const t = useDictionary().docs.visual;
  const [gate, setGate] = useState<GateName>(gates[0]);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const single = gate === "NOT";
  const out = applyGate(gate, a, b);
  const rows = inputRows(single ? 1 : 2);

  const gx = 92;
  const gy = 26;
  const inA = single ? gy + GATE_H / 2 : gy + 13;
  const inB = gy + GATE_H - 13;
  const inset = inputInset(gate);

  return (
    <div className="space-y-4">
      {gates.length > 1 ? (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t.gate}>
          {gates.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={name === gate}
              className="doc-tab"
              onClick={() => setGate(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto]">
        <svg viewBox="0 0 260 100" className="mx-auto w-full max-w-[22rem]" role="img" aria-label={`${gate} ${t.gate}`}>
          {(single ? [a] : [a, b]).map((value, index) => {
            const y = index === 0 ? inA : inB;
            const name = index === 0 ? "A" : "B";
            const toggle = index === 0 ? () => setA(1 - a) : () => setB(1 - b);
            return (
              <g key={name} onClick={toggle} className="cursor-pointer">
                <line x1={40} y1={y} x2={gx + inset} y2={y} stroke={wireColor(value)} strokeWidth={2.5} />
                <rect x={6} y={y - 12} width={34} height={24} rx={7} fill={value ? "var(--accent)" : "var(--surface2)"} />
                <text x={23} y={y + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={value ? "var(--on-accent)" : "var(--text2)"}>
                  {name}={value}
                </text>
              </g>
            );
          })}
          <GateShape gate={gate} x={gx} y={gy} on={out === 1} />
          <line x1={gx + GATE_W} y1={gy + GATE_H / 2} x2={214} y2={gy + GATE_H / 2} stroke={wireColor(out)} strokeWidth={2.5} />
          <circle cx={230} cy={gy + GATE_H / 2} r={15} fill={out ? "var(--accent)" : "var(--surface2)"} />
          <text x={230} y={gy + GATE_H / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={out ? "var(--on-accent)" : "var(--text2)"}>
            {out}
          </text>
        </svg>

        <table className="doc-truth mx-auto">
          <caption className="sr-only">{t.truthTable}</caption>
          <thead>
            <tr>
              <th>A</th>
              {single ? null : <th>B</th>}
              <th>{t.output}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = single ? row[0] === a : row[0] === a && row[1] === b;
              return (
                <tr
                  key={row.join("")}
                  data-active={active}
                  onClick={() => {
                    setA(row[0]);
                    if (!single) setB(row[1]);
                  }}
                >
                  {row.map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                  <td className="font-semibold">{applyGate(gate, row[0], row[1])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="doc-ctl" aria-pressed={a === 1} onClick={() => setA(1 - a)}>
          A = {a}
        </button>
        {single ? null : (
          <button type="button" className="doc-ctl" aria-pressed={b === 1} onClick={() => setB(1 - b)}>
            B = {b}
          </button>
        )}
        <span className="text-xs text-[var(--text3)]">{t.gateHint}</span>
      </div>
    </div>
  );
}
