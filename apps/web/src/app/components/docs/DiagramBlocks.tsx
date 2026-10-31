import { Fragment, type ReactNode } from "react";
import { ArrowDown, ArrowRight, RotateCcw } from "lucide-react";
import type { FlowchartShape, TreeNode } from "@/lib/docs/types";

/** Inline `code` and **bold** inside lesson text. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Figure({
  title,
  badge,
  caption,
  children,
}: {
  title?: string;
  badge?: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className="doc-figure">
      {title || badge ? (
        <div className="doc-figure-head">
          <span>{title}</span>
          {badge ? <span className="doc-badge">{badge}</span> : null}
        </div>
      ) : null}
      <div className="doc-figure-body">{children}</div>
      {caption ? (
        <figcaption>
          <RichText text={caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}

export function FlowDiagram({
  nodes,
  layout = "row",
  backLabel,
}: {
  nodes: Array<{ label: string; detail?: string }>;
  layout?: "row" | "cycle";
  backLabel: string;
}) {
  const horizontal = nodes.length <= 3;
  return (
    <div>
      <ol className={horizontal ? "flex flex-col items-stretch gap-2 md:flex-row" : "doc-timeline"}>
        {nodes.map((node, index) => (
          <Fragment key={node.label}>
            <li className={horizontal ? "doc-flow-node md:flex-1" : "doc-timeline-item"}>
              <span className="doc-step-num">{index + 1}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text)]">
                  <RichText text={node.label} />
                </div>
                {node.detail ? (
                  <div className="mt-1 text-xs leading-5 text-[var(--text2)]">
                    <RichText text={node.detail} />
                  </div>
                ) : null}
              </div>
            </li>
            {horizontal && index < nodes.length - 1 ? (
              <li aria-hidden className="flex items-center justify-center text-[var(--text3)]">
                <ArrowDown size={16} className="md:hidden" />
                <ArrowRight size={16} className="max-md:hidden" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
      {layout === "cycle" ? (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-[var(--text3)]">
          <RotateCcw size={13} /> {backLabel}
        </div>
      ) : null}
    </div>
  );
}

export function Segments({ segments }: { segments: Array<{ label: string; detail: string; weight?: number }> }) {
  return (
    <div className="space-y-3">
      <div className="flex overflow-hidden rounded-lg border border-[var(--separator)]">
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className="doc-segment"
            data-tone={index % 3}
            style={{ flexGrow: segment.weight ?? 1, flexBasis: 0 }}
          >
            {segment.label}
          </div>
        ))}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {segments.map((segment, index) => (
          <div key={segment.label} className="text-xs leading-5">
            <dt className="flex items-center gap-1.5 font-semibold text-[var(--text)]">
              <span className="doc-swatch" data-tone={index % 3} /> {segment.label}
            </dt>
            <dd className="mt-1 text-[var(--text2)]">
              <RichText text={segment.detail} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
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
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <RichText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|ORDER BY|ASC|DESC|AND|OR|NOT|SUM|COUNT)\b/g;

export function SqlResult({
  query,
  table,
  columns,
  rows,
  matches,
  selected,
  resultLabel,
}: {
  query: string;
  table: string;
  columns: string[];
  rows: string[][];
  matches: number[];
  selected: string[];
  resultLabel: string;
}) {
  const keep = new Set(matches);
  const selectedIndexes = selected.map((name) => columns.indexOf(name));
  return (
    <div className="space-y-4">
      <pre className="site-code">
        {query.split(SQL_KEYWORDS).map((part, index) =>
          index % 2 === 1 ? (
            <span key={index} style={{ color: "var(--code-keyword)" }}>
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </pre>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_auto_1fr] lg:items-start">
        <div className="overflow-x-auto">
          <div className="mb-1.5 font-mono text-[11px] text-[var(--text3)]">{table}</div>
          <table className="doc-table doc-table-compact">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={column} data-picked={selectedIndexes.includes(index)}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} data-dim={!keep.has(rowIndex)} data-match={keep.has(rowIndex)}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} data-picked={selectedIndexes.includes(cellIndex)}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div aria-hidden className="flex justify-center pt-8 text-[var(--text3)]">
          <ArrowDown size={18} className="lg:hidden" />
          <ArrowRight size={18} className="max-lg:hidden" />
        </div>
        <div className="overflow-x-auto">
          <div className="mb-1.5 text-[11px] font-medium text-[var(--accent)]">{resultLabel}</div>
          <table className="doc-table doc-table-compact">
            <thead>
              <tr>
                {selected.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((rowIndex) => (
                <tr key={rowIndex}>
                  {selectedIndexes.map((cellIndex) => (
                    <td key={cellIndex}>{rows[rowIndex][cellIndex]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const shapeColor: Record<FlowchartShape, string> = {
  terminator: "var(--flowchart-terminator)",
  process: "var(--flowchart-process)",
  io: "var(--flowchart-io)",
  decision: "var(--flowchart-decision)",
  subroutine: "var(--flowchart-subroutine)",
};

export function Flowchart({
  nodes,
  loop,
  shapeNames,
}: {
  nodes: Array<{ shape: FlowchartShape; label: string }>;
  loop?: { from: number; to: number; label: string; exitLabel: string };
  shapeNames: Record<FlowchartShape, string>;
}) {
  const W = 440;
  const cx = 250;
  const w = 210;
  const gap = 30;
  const heights = nodes.map((node) => (node.shape === "decision" ? 78 : 46));
  const tops = heights.map((_, index) => heights.slice(0, index).reduce((sum, h) => sum + h + gap, 12));
  const H = tops[tops.length - 1] + heights[heights.length - 1] + 12;
  const used = [...new Set(nodes.map((node) => node.shape))];

  const shape = (kind: FlowchartShape, top: number, h: number) => {
    const color = shapeColor[kind];
    const common = { fill: `color-mix(in srgb, ${color} 12%, var(--bg))`, stroke: color, strokeWidth: 1.75 };
    const left = cx - w / 2;
    switch (kind) {
      case "terminator":
        return <rect x={left} y={top} width={w} height={h} rx={h / 2} {...common} />;
      case "process":
        return <rect x={left} y={top} width={w} height={h} rx={4} {...common} />;
      case "subroutine":
        return (
          <g>
            <rect x={left} y={top} width={w} height={h} rx={4} {...common} />
            <line x1={left + 12} x2={left + 12} y1={top} y2={top + h} stroke={color} strokeWidth={1.5} />
            <line x1={left + w - 12} x2={left + w - 12} y1={top} y2={top + h} stroke={color} strokeWidth={1.5} />
          </g>
        );
      case "io":
        return <path d={`M${left + 16} ${top} H${left + w} L${left + w - 16} ${top + h} H${left} Z`} {...common} />;
      case "decision":
        return <path d={`M${cx} ${top} L${cx + w / 2} ${top + h / 2} L${cx} ${top + h} L${cx - w / 2} ${top + h / 2} Z`} {...common} />;
    }
  };

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[26rem]" role="img" aria-label={nodes.map((node) => node.label).join(", ")}>
        <defs>
          <marker id="doc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--text3)" />
          </marker>
        </defs>
        {nodes.slice(0, -1).map((_, index) => {
          const y1 = tops[index] + heights[index];
          const y2 = tops[index + 1];
          return (
            <g key={`a${index}`}>
              <line x1={cx} x2={cx} y1={y1} y2={y2 - 1} stroke="var(--text3)" strokeWidth={1.5} markerEnd="url(#doc-arrow)" />
              {loop && loop.from === index ? (
                <text x={cx + 8} y={y1 + 18} fontSize={11} fontWeight={600} fill="var(--text2)">
                  {loop.exitLabel}
                </text>
              ) : null}
            </g>
          );
        })}
        {loop ? (
          <g>
            <path
              d={`M${cx - w / 2} ${tops[loop.from] + heights[loop.from] / 2} H24 V${tops[loop.to] + heights[loop.to] / 2} H${cx - w / 2 + (nodes[loop.to].shape === "io" ? 8 : 0) - 1}`}
              fill="none"
              stroke="var(--text3)"
              strokeWidth={1.5}
              markerEnd="url(#doc-arrow)"
            />
            <text x={cx - w / 2 - 8} y={tops[loop.from] + heights[loop.from] / 2 - 7} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--text2)">
              {loop.label}
            </text>
          </g>
        ) : null}
        {nodes.map((node, index) => {
          const lines = node.label.split("\n");
          const mid = tops[index] + heights[index] / 2;
          return (
            <g key={index}>
              {shape(node.shape, tops[index], heights[index])}
              <text x={cx} y={mid - ((lines.length - 1) * 15) / 2 + 4.5} textAnchor="middle" fontSize={12.5} fontFamily="var(--font-mono), monospace" fill="var(--text)">
                {lines.map((line, lineIndex) => (
                  <tspan key={lineIndex} x={cx} dy={lineIndex === 0 ? 0 : 15}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--text2)]">
        {used.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: shapeColor[kind] }} /> {shapeNames[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TreeBranch({ node }: { node: TreeNode }) {
  return (
    <li>
      <span className="doc-tree-node">{node.label}</span>
      {node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <TreeBranch key={child.label} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function StructureDiagram({ root }: { root: TreeNode }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ul className="doc-tree mx-auto w-max">
        <TreeBranch node={root} />
      </ul>
    </div>
  );
}
