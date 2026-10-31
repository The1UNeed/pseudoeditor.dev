"use client";

import { useState, type ReactNode } from "react";
import type { GateName, LogicExpr } from "@/lib/docs/types";
import { useDictionary } from "@/i18n/context";
import { GATE_H, GATE_W, GateShape, evaluate, formatExpr, inputNames, inputRows, wireColor } from "./logic";
import { inputInset } from "./LogicGateExplorer";

const COL = 112;
const ROW = 46;
const LEFT = 44;
const TOP = 16;

type Placed =
  | { kind: "input"; name: string; x: number; y: number }
  | { kind: "gate"; gate: GateName; expr: LogicExpr; x: number; y: number; children: Placed[] };

function gateDepth(expr: LogicExpr): number {
  if (typeof expr === "string") return 0;
  const children = expr.gate === "NOT" ? [expr.input] : expr.inputs;
  return 1 + Math.max(...children.map(gateDepth));
}

/** Lays the tree out right to left: the output gate in the last column, inputs on the far left. */
function layout(expr: LogicExpr) {
  const columns = gateDepth(expr);
  let leaf = 0;
  const place = (node: LogicExpr, depth: number): Placed => {
    if (typeof node === "string") return { kind: "input", name: node, x: LEFT, y: TOP + ROW / 2 + leaf++ * ROW };
    const children = (node.gate === "NOT" ? [node.input] : node.inputs).map((child) => place(child, depth + 1));
    const y = children.reduce((sum, child) => sum + child.y, 0) / children.length;
    return { kind: "gate", gate: node.gate, expr: node, x: LEFT + 30 + (columns - depth) * COL, y, children };
  };
  const root = place(expr, 1);
  return { root, width: LEFT + 30 + columns * COL + GATE_W + 70, height: TOP * 2 + leaf * ROW };
}

/** Flip the inputs of a whole circuit; every wire shows its live value. */
export function LogicCircuit({ expression, label }: { expression: LogicExpr; label: string }) {
  const t = useDictionary().docs.visual;
  const names = inputNames(expression);
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(names.map((name) => [name, 0])));
  const { root, width, height } = layout(expression);
  const out = evaluate(expression, values);
  const toggle = (name: string) => setValues((current) => ({ ...current, [name]: 1 - (current[name] ?? 0) }));

  const parts: ReactNode[] = [];
  const draw = (node: Placed, key: string): { x: number; y: number; value: number } => {
    if (node.kind === "input") {
      const value = values[node.name] ?? 0;
      parts.push(
        <g key={key} onClick={() => toggle(node.name)} className="cursor-pointer">
          <rect x={node.x - 36} y={node.y - 12} width={34} height={24} rx={7} fill={value ? "var(--accent)" : "var(--surface2)"} />
          <text x={node.x - 19} y={node.y + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={value ? "var(--on-accent)" : "var(--text2)"}>
            {node.name}
          </text>
        </g>,
      );
      return { x: node.x - 2, y: node.y, value };
    }
    const top = node.y - GATE_H / 2;
    const single = node.gate === "NOT";
    node.children.forEach((child, index) => {
      const from = draw(child, `${key}.${index}`);
      const toY = single ? node.y : top + (index === 0 ? 13 : GATE_H - 13);
      const toX = node.x + inputInset(node.gate);
      const midX = node.x - 14 - (single ? 0 : (1 - index) * 9);
      parts.unshift(
        <path
          key={`${key}.w${index}`}
          d={`M${from.x} ${from.y} H${midX} V${toY} H${toX}`}
          fill="none"
          stroke={wireColor(from.value)}
          strokeWidth={2.25}
          strokeLinejoin="round"
        />,
      );
    });
    const value = evaluate(node.expr, values);
    parts.push(<GateShape key={key} gate={node.gate} x={node.x} y={top} on={value === 1} />);
    return { x: node.x + GATE_W, y: node.y, value };
  };
  const end = draw(root, "r");

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block"
          style={{ width: "100%", maxWidth: width * 1.15, minWidth: Math.min(width, 520) }}
          role="img"
          aria-label={`${label} = ${formatExpr(expression)}`}
        >
          {parts}
          <line x1={end.x} y1={end.y} x2={width - 40} y2={end.y} stroke={wireColor(out)} strokeWidth={2.5} />
          <circle cx={width - 24} cy={end.y} r={16} fill={out ? "var(--accent)" : "var(--surface2)"} />
          <text x={width - 24} y={end.y + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={out ? "var(--on-accent)" : "var(--text2)"}>
            {label}={out}
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {names.map((name) => (
          <button key={name} type="button" className="doc-ctl" aria-pressed={values[name] === 1} onClick={() => toggle(name)}>
            {name} = {values[name]}
          </button>
        ))}
      </div>
      <div className="text-center font-mono text-sm">
        {label} = {formatExpr(expression)}
      </div>

      <div className="overflow-x-auto">
        <table className="doc-truth mx-auto">
          <caption className="sr-only">{t.truthTable}</caption>
          <thead>
            <tr>
              {names.map((name) => (
                <th key={name}>{name}</th>
              ))}
              <th>{label}</th>
            </tr>
          </thead>
          <tbody>
            {inputRows(names.length).map((row) => {
              const rowValues = Object.fromEntries(names.map((name, index) => [name, row[index]]));
              const active = names.every((name) => values[name] === rowValues[name]);
              return (
                <tr key={row.join("")} data-active={active} onClick={() => setValues(rowValues)}>
                  {row.map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                  <td className="font-semibold">{evaluate(expression, rowValues)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
