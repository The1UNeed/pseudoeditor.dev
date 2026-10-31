/* Shapes for the docs course. Lesson text is plain data so each locale can supply its own copy,
   and every diagram is described by a `visual` that src/app/components/docs renders. */

export type UnitId =
  | "data-representation"
  | "data-transmission"
  | "hardware"
  | "software"
  | "internet"
  | "emerging-tech"
  | "algorithms"
  | "programming"
  | "databases"
  | "boolean-logic"
  | "pseudoeditor";

export type GateName = "NOT" | "AND" | "OR" | "NAND" | "NOR" | "XOR";

/** A Boolean expression tree for the circuit visual. Leaves are input names such as "A". */
export type LogicExpr = string | { gate: "NOT"; input: LogicExpr } | { gate: Exclude<GateName, "NOT">; inputs: [LogicExpr, LogicExpr] };

export type CpuPart = "pc" | "mar" | "mdr" | "cir" | "acc" | "alu" | "cu" | "memory";
export type CpuBus = "address" | "data" | "control";

export type FlowchartShape = "terminator" | "process" | "io" | "decision" | "subroutine";

export type TreeNode = { label: string; children?: TreeNode[] };

export type DocVisual =
  | {
      kind: "binary";
      value: number;
      bits?: number;
      /** "twos" gives the most significant bit a place value of -2^(n-1). */
      mode?: "unsigned" | "twos";
      showHex?: boolean;
      showShifts?: boolean;
    }
  | { kind: "logicGate"; gates: GateName[] }
  | { kind: "logicCircuit"; expression: LogicExpr; label: string }
  | {
      kind: "cpu";
      steps: Array<{
        title: string;
        detail: string;
        active: CpuPart[];
        buses?: CpuBus[];
        /** Register contents after this step. Registers not listed keep their earlier value. */
        values?: Partial<Record<CpuPart, string>>;
      }>;
    }
  | { kind: "sort"; values: number[] }
  | { kind: "search"; values: number[]; target: number }
  | {
      kind: "trace";
      columns: string[];
      rows: string[][];
      /** Reveal one row at a time instead of the whole table. */
      stepper?: boolean;
    }
  | {
      kind: "flow";
      nodes: Array<{ label: string; detail?: string }>;
      /** "cycle" draws the last node looping back to the first. */
      layout?: "row" | "cycle";
    }
  | { kind: "pixels"; rows: string[] }
  | { kind: "sound" }
  | { kind: "parity"; value: number }
  | { kind: "checkDigit"; digits: string }
  | { kind: "segments"; segments: Array<{ label: string; detail: string; weight?: number }> }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | {
      kind: "sql";
      query: string;
      table: string;
      columns: string[];
      rows: string[][];
      /** Indexes into `rows` that the WHERE clause keeps, in result order. */
      matches: number[];
      /** Columns named in SELECT. */
      selected: string[];
    }
  | {
      kind: "array";
      name: string;
      /** One row for a 1D array, several for a 2D array. */
      values: string[][];
      highlight?: [number, number];
    }
  | {
      kind: "flowchart";
      nodes: Array<{ shape: FlowchartShape; label: string }>;
      /** A decision's "No" branch that returns to an earlier node, drawn on the left. */
      loop?: { from: number; to: number; label: string; exitLabel: string };
    }
  | { kind: "structure"; root: TreeNode };

export type DocSection = {
  heading: string;
  body: string[];
  bullets?: string[];
  visual?: DocVisual;
  /** Shown above the visual as its title. */
  visualTitle?: string;
  /** Shown under the visual. */
  caption?: string;
  example?: string;
  exampleLanguage?: "pseudocode" | "sql" | "text";
  /** Show the example above the visual instead of below it. */
  exampleFirst?: boolean;
  callout?: { tone: "key" | "tip" | "warn"; text: string };
};

export type Doc = {
  slug: string;
  unit: UnitId;
  title: string;
  description: string;
  updated: string;
  /** Cambridge IGCSE 0478 syllabus reference, such as "1.1". */
  syllabus?: string;
  sections: DocSection[];
  keyTerms?: Array<{ term: string; definition: string }>;
  quiz?: Array<{ question: string; answer: string }>;
};

export type Unit = {
  id: UnitId;
  /** Syllabus topic number, or null for the PseudoEditor guides. */
  number: number | null;
  paper: 1 | 2 | null;
  title: string;
  summary: string;
};
