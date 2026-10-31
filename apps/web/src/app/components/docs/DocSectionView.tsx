import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { Dictionary } from "@/i18n/messages";
import type { DocSection, DocVisual } from "@/lib/docs/types";
import CopyableCodeBlock from "@/app/[locale]/(public)/manual/CopyableCodeBlock";
import { SearchStepper, SortStepper } from "./AlgorithmSteppers";
import { BinaryExplorer } from "./BinaryExplorer";
import { CpuCycle } from "./CpuCycle";
import { ArrayGrid, CheckDigit, ParityChecker, PixelGrid, SoundSampler, TraceTable } from "./DataVisuals";
import { DataTable, Figure, FlowDiagram, Flowchart, RichText, Segments, SqlResult, StructureDiagram } from "./DiagramBlocks";
import { LogicCircuit } from "./LogicCircuit";
import { LogicGateExplorer } from "./LogicGateExplorer";

type Labels = Dictionary["docs"]["visual"];

const interactiveKinds = new Set<DocVisual["kind"]>([
  "binary",
  "logicGate",
  "logicCircuit",
  "cpu",
  "sort",
  "search",
  "pixels",
  "sound",
  "parity",
  "checkDigit",
  "array",
]);

function VisualBody({ visual, t }: { visual: DocVisual; t: Labels }) {
  switch (visual.kind) {
    case "binary":
      return <BinaryExplorer {...visual} />;
    case "logicGate":
      return <LogicGateExplorer gates={visual.gates} />;
    case "logicCircuit":
      return <LogicCircuit expression={visual.expression} label={visual.label} />;
    case "cpu":
      return <CpuCycle steps={visual.steps} />;
    case "sort":
      return <SortStepper values={visual.values} />;
    case "search":
      return <SearchStepper values={visual.values} target={visual.target} />;
    case "trace":
      return <TraceTable columns={visual.columns} rows={visual.rows} stepper={visual.stepper} />;
    case "flow":
      return <FlowDiagram nodes={visual.nodes} layout={visual.layout} backLabel={t.backToStart} />;
    case "pixels":
      return <PixelGrid rows={visual.rows} />;
    case "sound":
      return <SoundSampler />;
    case "parity":
      return <ParityChecker value={visual.value} />;
    case "checkDigit":
      return <CheckDigit digits={visual.digits} />;
    case "segments":
      return <Segments segments={visual.segments} />;
    case "table":
      return <DataTable columns={visual.columns} rows={visual.rows} />;
    case "sql":
      return <SqlResult {...visual} resultLabel={t.queryResult} />;
    case "array":
      return <ArrayGrid name={visual.name} values={visual.values} highlight={visual.highlight} />;
    case "flowchart":
      return <Flowchart nodes={visual.nodes} loop={visual.loop} shapeNames={t.shapes} />;
    case "structure":
      return <StructureDiagram root={visual.root} />;
  }
}

const calloutIcon = { key: Lightbulb, tip: Info, warn: TriangleAlert };

export function DocSectionView({ section, id, t }: { section: DocSection; id: string; t: Labels }) {
  const Icon = section.callout ? calloutIcon[section.callout.tone] : null;
  const example = !section.example ? null : section.exampleLanguage && section.exampleLanguage !== "pseudocode" ? (
    <pre className="site-code mt-5">{section.example}</pre>
  ) : (
    <CopyableCodeBlock code={section.example} className="mt-5" />
  );
  return (
    <section id={id} className="scroll-mt-24">
      <h2>{section.heading}</h2>
      {section.body.map((paragraph) => (
        <p key={paragraph}>
          <RichText text={paragraph} />
        </p>
      ))}
      {section.bullets ? (
        <ul>
          {section.bullets.map((bullet) => (
            <li key={bullet}>
              <RichText text={bullet} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.exampleFirst ? example : null}
      {section.visual ? (
        <Figure
          title={section.visualTitle}
          badge={interactiveKinds.has(section.visual.kind) ? t.interactive : undefined}
          caption={section.caption}
        >
          <VisualBody visual={section.visual} t={t} />
        </Figure>
      ) : null}
      {section.exampleFirst ? null : example}
      {section.callout && Icon ? (
        <div className="doc-callout" data-tone={section.callout.tone}>
          <Icon size={16} className="mt-0.5 shrink-0" />
          <p>
            <strong>{t.callout[section.callout.tone]}</strong> <RichText text={section.callout.text} />
          </p>
        </div>
      ) : null}
    </section>
  );
}
