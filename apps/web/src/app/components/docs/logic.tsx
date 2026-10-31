import type { GateName, LogicExpr } from "@/lib/docs/types";

export const GATE_W = 64;
export const GATE_H = 48;

export function applyGate(gate: GateName, a: number, b = 0): number {
  switch (gate) {
    case "NOT":
      return a ? 0 : 1;
    case "AND":
      return a & b;
    case "OR":
      return a | b;
    case "NAND":
      return a & b ? 0 : 1;
    case "NOR":
      return a | b ? 0 : 1;
    case "XOR":
      return a ^ b;
  }
}

export function evaluate(expr: LogicExpr, inputs: Record<string, number>): number {
  if (typeof expr === "string") return inputs[expr] ?? 0;
  if (expr.gate === "NOT") return applyGate("NOT", evaluate(expr.input, inputs));
  return applyGate(expr.gate, evaluate(expr.inputs[0], inputs), evaluate(expr.inputs[1], inputs));
}

export function inputNames(expr: LogicExpr): string[] {
  const names = new Set<string>();
  const walk = (node: LogicExpr) => {
    if (typeof node === "string") names.add(node);
    else if (node.gate === "NOT") walk(node.input);
    else node.inputs.forEach(walk);
  };
  walk(expr);
  return [...names].sort();
}

export function formatExpr(expr: LogicExpr, top = true): string {
  if (typeof expr === "string") return expr;
  if (expr.gate === "NOT") return `NOT ${formatExpr(expr.input, false)}`;
  const text = `${formatExpr(expr.inputs[0], false)} ${expr.gate} ${formatExpr(expr.inputs[1], false)}`;
  return top ? text : `(${text})`;
}

/** Every combination of 0/1 for `count` inputs, counting up in binary. */
export function inputRows(count: number): number[][] {
  return Array.from({ length: 2 ** count }, (_, row) =>
    Array.from({ length: count }, (_, index) => (row >> (count - 1 - index)) & 1),
  );
}

/** A gate symbol (IEEE distinctive shape) whose top-left corner is at (x, y). Output sits at x + GATE_W. */
export function GateShape({ gate, x, y, on }: { gate: GateName; x: number; y: number; on: boolean }) {
  const h = GATE_H;
  const bubble = gate === "NOT" || gate === "NAND" || gate === "NOR";
  const body = bubble ? GATE_W - 10 : GATE_W;
  const stroke = on ? "var(--accent)" : "var(--text3)";
  const fill = on ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface)";
  let path: string;
  if (gate === "NOT") {
    path = `M0 4 L${body} ${h / 2} L0 ${h - 4} Z`;
  } else if (gate === "AND" || gate === "NAND") {
    const r = h / 2;
    path = `M0 0 H${body - r} A${r} ${r} 0 0 1 ${body - r} ${h} H0 Z`;
  } else {
    path = `M0 0 Q${body * 0.3} ${h / 2} 0 ${h} Q${body * 0.62} ${h} ${body} ${h / 2} Q${body * 0.62} 0 0 0 Z`;
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      {gate === "XOR" ? (
        <path d={`M-7 0 Q${body * 0.3 - 7} ${h / 2} -7 ${h}`} fill="none" stroke={stroke} strokeWidth={2} />
      ) : null}
      <path d={path} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      {bubble ? <circle cx={body + 5} cy={h / 2} r={4.5} fill={fill} stroke={stroke} strokeWidth={2} /> : null}
      <text
        x={gate === "NOT" ? body * 0.32 : body * 0.42}
        y={h / 2 + 4}
        textAnchor="middle"
        fontSize={gate === "NOT" ? 9 : 10.5}
        fontWeight={600}
        fill="var(--text2)"
      >
        {gate}
      </text>
    </g>
  );
}

export const wireColor = (on: number | boolean) => (on ? "var(--accent)" : "var(--text3)");
