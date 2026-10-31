import type { Connection, Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { parseSource, resolveSyntax, type SyntaxId } from "@pseudoeditor/compiler";
import type { CaseStatementNode, IfStatementNode, StatementNode } from "@pseudoeditor/compiler/types";
import {
  FlowchartNodeData,
  FlowchartNodeType,
  FlowchartSourceForm,
  FlowchartSourceFormKind,
  NODE_TYPE_CONFIG,
} from "./types";

export interface FlowchartPaletteItem {
  id: string;
  type: FlowchartNodeType;
  title: string;
  description: string;
  defaults: Partial<FlowchartNodeData>;
}

type PalettePayload = {
  type: FlowchartNodeType;
  defaults?: Partial<FlowchartNodeData>;
};

export interface FlowchartGraphSnapshot {
  nodes: Node[];
  edges: Edge[];
}

/** How generated code is written: the exam syntax for new blocks, and the indentation of the source. */
export interface FlowchartCodeStyle {
  syntaxId?: string;
  indentUnit?: string;
}

/**
 * One block of the flowchart, read from source. Every block keeps enough of its original text
 * that generating code from an untouched flowchart reproduces the source line for line.
 */
type FlowItem =
  | { kind: "process"; lines: string[]; blankBefore: number }
  | { kind: "terminator"; label: "Start" | "End"; implicit: boolean; blankBefore: number }
  | { kind: "io"; ioType: "input" | "output"; content: string; form: FlowchartSourceForm; blankBefore: number }
  | { kind: "call"; content: string; form: FlowchartSourceForm; blankBefore: number }
  | {
      kind: "if";
      condition: string;
      form: FlowchartSourceForm;
      thenItems: FlowItem[];
      elseItems: FlowItem[];
      hasElseBranch: boolean;
      elseIf: boolean;
      blankBefore: number;
    }
  | {
      kind: "loop";
      controlKind: "while" | "until" | "for";
      condition: string;
      form: FlowchartSourceForm;
      bodyItems: FlowItem[];
      blankBefore: number;
    }
  | { kind: "repeat"; condition: string; form: FlowchartSourceForm; bodyItems: FlowItem[]; blankBefore: number }
  | {
      kind: "case";
      subject: string;
      /** The CASE header, closing line, and the blank lines before the closing line. */
      form: Pick<FlowchartSourceForm, "startLine" | "endLine" | "blankLinesAfterStart" | "blankLinesBeforeEnd">;
      arms: CaseArm[];
      otherwise: { label: string; inline: boolean; items: FlowItem[]; blankBefore: number } | null;
      blankBefore: number;
    }
  | {
      kind: "routine";
      routineKind: "procedure" | "function";
      header: string;
      form: FlowchartSourceForm;
      bodyItems: FlowItem[];
      blankBefore: number;
    };

interface CaseArm {
  value: string;
  form: FlowchartSourceForm;
  items: FlowItem[];
  blankBefore: number;
}

type PendingExit = {
  nodeId: string;
  sourceHandle?: string;
  label?: string;
};

interface LayoutResult {
  entryId: string | null;
  pendingExits: PendingExit[];
  nextY: number;
}

interface LayoutContext {
  nodes: Node[];
  edges: Edge[];
  nextNodeIndex: number;
  nextEdgeIndex: number;
  /** The first block each item was drawn as, so a routine can name the block it is written before. */
  entryIds: Map<FlowItem, string>;
  dialect: FlowchartDialect;
}

interface ImportState {
  lines: string[];
  indentUnit: string;
  commentPrefixes: readonly string[];
}

interface SplitLine {
  code: string;
  comment: string;
}

interface GraphIndex {
  nodeMap: Map<string, Node>;
  outgoing: Map<string, Edge[]>;
  incoming: Map<string, Edge[]>;
  /** The edges that close REPEAT loops, which don't count as a way back when finding WHILE loops. */
  backEdges: Set<string>;
  /** For each first block of a REPEAT body, the edges that loop back to it. */
  repeatEntries: Map<string, Edge[]>;
}

/** A generated line, with the blocks it belongs to so a traced run can be shown on the flowchart. */
export interface FlowchartCodeLine {
  text: string;
  /** The block that runs when the line runs. */
  nodeId?: string;
  /** The decision whose condition is tested on the line. */
  testId?: string;
}

interface EmitResult {
  lines: FlowchartCodeLine[];
  visited: Set<string>;
  /** Set when the whole sequence is a single IF block, so a parent can fold it into ELSEIF. */
  soleIfId: string | null;
  /** The blocks in the sequence at its own level, and the first of them. */
  blockCount: number;
  firstId: string | null;
  /** Statements written at the sequence's own level, counting a whole IF or loop as one. */
  statementCount: number;
  /** Whether the sequence holds a `// Start` or `// End` marker. */
  hasMarker: boolean;
}

interface EmitContext {
  index: GraphIndex;
  dialect: FlowchartDialect;
  indentUnit: string;
  /** Procedures and functions to write directly before a main-flow block. */
  routinesBefore: Map<string, FlowchartCodeLine[][]>;
  emittedAnchors: Set<string>;
}

interface FlowchartDialect {
  forms: Record<Exclude<FlowchartSourceFormKind, "until" | "routine">, { prefix: string; suffix: string }>;
  elseLine: string;
  endIf: string;
  endWhile: string;
  endFor: (iterator: string) => string;
  not: string;
  equals: string;
  /** The line that opens a REPEAT loop; IB has no loop tested after its body. */
  repeatStart: string | null;
  caseHeader: (subject: string) => string;
  otherwise: { label: string; inline: boolean };
  endCase: string;
  endRoutine: (routine: "procedure" | "function") => string;
}

const CAMBRIDGE_DIALECT: FlowchartDialect = {
  forms: {
    if: { prefix: "IF ", suffix: " THEN" },
    elseif: { prefix: "ELSEIF ", suffix: " THEN" },
    while: { prefix: "WHILE ", suffix: " DO" },
    for: { prefix: "FOR ", suffix: "" },
    repeat: { prefix: "UNTIL ", suffix: "" },
    case: { prefix: "", suffix: " : " },
    input: { prefix: "INPUT ", suffix: "" },
    output: { prefix: "OUTPUT ", suffix: "" },
    call: { prefix: "CALL ", suffix: "" },
  },
  elseLine: "ELSE",
  endIf: "ENDIF",
  endWhile: "ENDWHILE",
  endFor: (iterator) => `NEXT ${iterator}`.trimEnd(),
  not: "NOT",
  equals: "=",
  repeatStart: "REPEAT",
  caseHeader: (subject) => `CASE OF ${subject}`,
  otherwise: { label: "OTHERWISE : ", inline: true },
  endCase: "ENDCASE",
  endRoutine: (routine) => (routine === "function" ? "ENDFUNCTION" : "ENDPROCEDURE"),
};

/** Keywords for blocks added on the canvas, which have no source text to copy. */
const DIALECTS: Record<SyntaxId, FlowchartDialect> = {
  "cambridge-igcse": CAMBRIDGE_DIALECT,
  "cambridge-alevel": CAMBRIDGE_DIALECT,
  "ib-dp": {
    forms: {
      if: { prefix: "if ", suffix: " then" },
      elseif: { prefix: "else if ", suffix: " then" },
      while: { prefix: "loop while ", suffix: "" },
      for: { prefix: "loop ", suffix: "" },
      repeat: { prefix: "until ", suffix: "" },
      case: { prefix: "", suffix: " : " },
      input: { prefix: "input ", suffix: "" },
      output: { prefix: "output ", suffix: "" },
      call: { prefix: "", suffix: "" },
    },
    elseLine: "else",
    endIf: "end if",
    endWhile: "end loop",
    endFor: () => "end loop",
    not: "not",
    equals: "=",
    repeatStart: null,
    caseHeader: (subject) => `case of ${subject}`,
    otherwise: { label: "otherwise : ", inline: true },
    endCase: "end case",
    endRoutine: (routine) => (routine === "function" ? "end function" : "end procedure"),
  },
  "ocr-gcse": {
    forms: {
      if: { prefix: "if ", suffix: " then" },
      elseif: { prefix: "elseif ", suffix: " then" },
      while: { prefix: "while ", suffix: "" },
      for: { prefix: "for ", suffix: "" },
      repeat: { prefix: "until ", suffix: "" },
      case: { prefix: "case ", suffix: ":" },
      input: { prefix: "", suffix: " = input()" },
      output: { prefix: "print(", suffix: ")" },
      call: { prefix: "", suffix: "" },
    },
    elseLine: "else",
    endIf: "endif",
    endWhile: "endwhile",
    endFor: (iterator) => `next ${iterator}`.trimEnd(),
    not: "not",
    equals: "==",
    repeatStart: "do",
    caseHeader: (subject) => `switch ${subject}:`,
    otherwise: { label: "default:", inline: false },
    endCase: "endswitch",
    endRoutine: (routine) => (routine === "function" ? "endfunction" : "endprocedure"),
  },
  "aqa-gcse": {
    forms: {
      if: { prefix: "IF ", suffix: " THEN" },
      elseif: { prefix: "ELSE IF ", suffix: " THEN" },
      while: { prefix: "WHILE ", suffix: "" },
      for: { prefix: "FOR ", suffix: "" },
      repeat: { prefix: "UNTIL ", suffix: "" },
      case: { prefix: "", suffix: " : " },
      input: { prefix: "", suffix: " ← USERINPUT" },
      output: { prefix: "OUTPUT ", suffix: "" },
      call: { prefix: "", suffix: "" },
    },
    elseLine: "ELSE",
    endIf: "ENDIF",
    endWhile: "ENDWHILE",
    endFor: () => "ENDFOR",
    not: "NOT",
    equals: "=",
    repeatStart: "REPEAT",
    caseHeader: (subject) => `CASE OF ${subject}`,
    otherwise: { label: "OTHERWISE : ", inline: true },
    endCase: "ENDCASE",
    endRoutine: () => "ENDSUBROUTINE",
  },
};

// Patterns run on a line's code with its trailing comment and surrounding whitespace removed.
// They cover the forms every supported syntax accepts; the parser decides which statement a line is.
const IF_HEADER_RE = /^(if\s+)(.+?)(\s+then)?$/i;
const ELSEIF_HEADER_RE = /^(elseif\s+|else\s+if\s+)(.+?)(\s+then)?$/i;
const ELSE_RE = /^else$/i;
const ENDIF_RE = /^(?:endif|end\s+if)$/i;
const WHILE_HEADER_RE = /^(while\s+|loop\s+while\s+)(.+?)(\s+do)?$/i;
const LOOP_UNTIL_HEADER_RE = /^(loop\s+until\s+)(.+)$/i;
const ENDWHILE_RE = /^(?:endwhile|end\s+while|end\s+loop)$/i;
const REPEAT_HEADER_RE = /^(?:repeat|do)$/i;
const UNTIL_RE = /^(until\s+)(.+)$/i;
const CASE_HEADER_RE = /^(?:case|switch)\s/i;
const ENDCASE_RE = /^(?:endcase|end\s+case|endswitch|end\s+switch)$/i;
const ROUTINE_HEADER_RE = /^(procedure|subroutine|function)\s/i;
const ROUTINE_END_RE = /^(?:endprocedure|endsubroutine|endfunction|end\s+(?:procedure|subroutine|function))$/i;
const FOR_HEADER_RE = /^(for\s+|loop\s+)(?!(?:while|until)\b)(.+)$/i;
const ENDFOR_RE = /^(?:next(?:\s+[A-Za-z_][A-Za-z0-9_]*)?|endfor|end\s+for|end\s+loop)$/i;
const NEXT_WITH_ITERATOR_RE = /^(next\s+)([A-Za-z_][A-Za-z0-9_]*)\b/i;
const FOR_ITERATOR_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:←|<-|=|\s(?:from|to)\b)/i;
const INPUT_KEYWORD_RE = /^(input\s+)([^\s(].*)$/i;
const INPUT_ASSIGN_RE = /^(.+?)(\s*(?:←|<-|=)\s*(?:userinput|input\s*\(.*\)))$/i;
const PRINT_CALL_RE = /^(print\s*\()(.*)(\))$/i;
const OUTPUT_KEYWORD_RE = /^((?:output|print)\s+)(.+)$/i;
const CALL_KEYWORD_RE = /^(call\s+)(.+)$/i;
const BARE_CALL_RE = /^()([A-Za-z_][A-Za-z0-9_]*\s*\(.*\))$/;
const START_MARKER = "// Start";
const END_MARKER = "// End";
const FLOWCHART_VERTICAL_GAP = 76;
const FLOWCHART_BRANCH_HORIZONTAL_GAP = 300;
const FLOWCHART_BRANCH_VERTICAL_GAP = 92;
const FLOWCHART_NODE_X = 96;
const FLOWCHART_NODE_Y = 48;
// Procedures and functions sit to the right of everything drawn before them.
const FLOWCHART_ROUTINE_GAP = 460;
const DEFAULT_INDENT_UNIT = "    ";
// Invalid source is read line by line; deeper blocks stay as plain process lines.
const MAX_FALLBACK_NESTING = 64;

function createDefaultNodeData(type: FlowchartNodeType): FlowchartNodeData {
  switch (type) {
    case "terminator":
      return {
        label: NODE_TYPE_CONFIG[type].label,
        type,
      };
    case "process":
      return {
        label: NODE_TYPE_CONFIG[type].label,
        type,
        statements: [],
      };
    case "decision":
      return {
        label: NODE_TYPE_CONFIG[type].label,
        type,
        content: "Value > 10",
        trueLabel: "Yes",
        falseLabel: "No",
      };
    case "inputOutput":
      return {
        label: NODE_TYPE_CONFIG[type].label,
        type,
        ioType: "input",
        content: "Value",
      };
    case "subroutine":
      return {
        label: NODE_TYPE_CONFIG[type].label,
        type,
        content: "ProcedureName()",
        subroutineName: "ProcedureName",
      };
  }
}

export function createFlowchartNodeData(
  type: FlowchartNodeType,
  overrides: Partial<FlowchartNodeData> = {},
): FlowchartNodeData {
  const base = createDefaultNodeData(type);
  const nextData: FlowchartNodeData = {
    ...base,
    ...overrides,
    type,
  };

  if (type === "process") {
    nextData.statements = Array.isArray(overrides.statements)
      ? overrides.statements
      : (base.statements ?? []);
  }

  if (type === "inputOutput") {
    const ioType = overrides.ioType ?? base.ioType ?? "input";
    nextData.ioType = ioType;
    nextData.label = ioType === "input" ? "Input" : "Output";
  }

  return nextData;
}

export const FLOWCHART_PALETTE_ITEMS: FlowchartPaletteItem[] = [
  {
    id: "start",
    type: "terminator",
    title: "Start",
    description: "Program entry point",
    defaults: {
      label: "Start",
    },
  },
  {
    id: "input",
    type: "inputOutput",
    title: "Input",
    description: "Read a value into a variable",
    defaults: {
      label: "Input",
      ioType: "input",
      content: "Value",
    },
  },
  {
    id: "process",
    type: "process",
    title: "Process",
    description: "Add editable lines inside the block",
    defaults: {
      label: "Process",
      statements: [""],
    },
  },
  {
    id: "decision",
    type: "decision",
    title: "Decision",
    description: "Branch the flow with a condition",
    defaults: {
      label: "Decision",
      content: "Value > 10",
      trueLabel: "Yes",
      falseLabel: "No",
    },
  },
  {
    id: "output",
    type: "inputOutput",
    title: "Output",
    description: "Show a value or message",
    defaults: {
      label: "Output",
      ioType: "output",
      content: '"Result"',
    },
  },
  {
    id: "end",
    type: "terminator",
    title: "End",
    description: "Program exit point",
    defaults: {
      label: "End",
    },
  },
];

export function serializePaletteItem(item: FlowchartPaletteItem): string {
  return JSON.stringify({
    type: item.type,
    defaults: item.defaults,
  } satisfies PalettePayload);
}

export function parsePalettePayload(raw: string): PalettePayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PalettePayload>;
    if (!parsed.type || !NODE_TYPE_CONFIG[parsed.type]) {
      return null;
    }
    return {
      type: parsed.type,
      defaults: parsed.defaults,
    };
  } catch {
    if (raw in NODE_TYPE_CONFIG) {
      return { type: raw as FlowchartNodeType };
    }
    return null;
  }
}

function normalizeLineEndings(source: string): string {
  return source.replace(/\r\n?/g, "\n");
}

function getDialect(syntaxId?: string): FlowchartDialect {
  return DIALECTS[resolveSyntax(syntaxId).id];
}

/** The indentation the source uses for one nesting level: a tab, or the smallest run of leading spaces. */
export function inferIndentUnit(source: string): string {
  let smallest = 0;
  for (const line of normalizeLineEndings(source).split("\n")) {
    if (line.trim().length === 0) {
      continue;
    }
    if (line.startsWith("\t")) {
      return "\t";
    }
    const width = line.length - line.trimStart().length;
    if (width > 0 && (smallest === 0 || width < smallest)) {
      smallest = width;
    }
  }
  return smallest > 0 ? " ".repeat(smallest) : DEFAULT_INDENT_UNIT;
}

/** Splits a trimmed line into code and a trailing comment, ignoring comment markers inside strings. */
function splitTrailingComment(line: string, commentPrefixes: readonly string[]): SplitLine {
  let quote: string | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (commentPrefixes.some((prefix) => line.startsWith(prefix, index))) {
      const code = line.slice(0, index).trimEnd();
      return { code, comment: line.slice(code.length) };
    }
  }
  return { code: line, comment: "" };
}

function hasBalancedParentheses(text: string): boolean {
  let depth = 0;
  let quote: string | null = null;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function readLine(state: ImportState, lineNumber: number): SplitLine {
  return splitTrailingComment((state.lines[lineNumber - 1] ?? "").trim(), state.commentPrefixes);
}

/** Removes the indentation of `depth` nesting levels, so a line can be re-indented wherever it is emitted. */
function dedentLine(state: ImportState, line: string, depth: number): string {
  const width = depth * state.indentUnit.length;
  let index = 0;
  while (index < width && index < line.length && (line[index] === " " || line[index] === "\t")) {
    index += 1;
  }
  return line.slice(index).trimEnd();
}

function isMarkerComment(comment: string): "Start" | "End" | null {
  if (comment === START_MARKER) {
    return "Start";
  }
  if (comment === END_MARKER) {
    return "End";
  }
  return null;
}

function forIteratorOf(condition: string): string | undefined {
  return condition.match(FOR_ITERATOR_RE)?.[1];
}

/** Collects simple lines, comments, and blank lines into process blocks between the structured items. */
class BlockBuilder {
  readonly items: FlowItem[] = [];
  private chunk: string[] | null = null;
  private blankLines = 0;

  constructor(private readonly topLevel: boolean) {}

  addBlank(): void {
    this.blankLines += 1;
    this.chunk = null;
  }

  addLine(line: string): void {
    if (!this.chunk) {
      this.chunk = [];
      this.push({ kind: "process", lines: this.chunk, blankBefore: 0 });
    }
    this.chunk.push(line);
  }

  /** Adds a comment-only line; at the top level `// Start` and `// End` become terminators. */
  addComment(comment: string, line: string): void {
    const marker = this.topLevel ? isMarkerComment(comment) : null;
    if (marker) {
      this.push({ kind: "terminator", label: marker, implicit: false, blankBefore: 0 });
      this.chunk = null;
      return;
    }
    this.addLine(line);
  }

  addItem(item: FlowItem): void {
    this.push(item);
    this.chunk = null;
  }

  /** Blank lines after the last item, which belong before the block's closing line. */
  get trailingBlankLines(): number {
    return this.blankLines;
  }

  private push(item: FlowItem): void {
    item.blankBefore = this.blankLines;
    this.blankLines = 0;
    this.items.push(item);
  }
}

// ── Import from a parsed program ──

/**
 * Builds the items for the statements of one block. Returns null when the block holds code the
 * parser skipped over (such as a THEN on its own line), so the caller keeps the whole construct as text.
 */
function collectBlock(
  state: ImportState,
  statements: StatementNode[],
  fromLine: number,
  toLine: number,
  depth: number,
  topLevel = false,
): BlockBuilder | null {
  const builder = new BlockBuilder(topLevel);
  let cursor = fromLine;

  const addLooseLines = (from: number, to: number): boolean => {
    for (let lineNumber = from; lineNumber <= to; lineNumber += 1) {
      const raw = state.lines[lineNumber - 1] ?? "";
      if (raw.trim().length === 0) {
        builder.addBlank();
        continue;
      }
      const { code, comment } = readLine(state, lineNumber);
      if (code.length > 0) {
        return false;
      }
      builder.addComment(comment, dedentLine(state, raw, depth));
    }
    return true;
  };

  for (const statement of statements) {
    if (statement.span.startLine < cursor || !addLooseLines(cursor, statement.span.startLine - 1)) {
      return null;
    }

    const item = convertStatement(state, statement, depth);
    if (item) {
      builder.addItem(item);
    } else {
      for (let lineNumber = statement.span.startLine; lineNumber <= statement.span.endLine; lineNumber += 1) {
        builder.addLine(dedentLine(state, state.lines[lineNumber - 1] ?? "", depth));
      }
    }
    cursor = statement.span.endLine + 1;
  }

  return addLooseLines(cursor, toLine) ? builder : null;
}

function convertStatement(state: ImportState, statement: StatementNode, depth: number): FlowItem | null {
  switch (statement.kind) {
    case "input":
    case "output":
    case "callStatement": {
      if (statement.span.startLine !== statement.span.endLine) {
        return null;
      }
      const { code, comment } = readLine(state, statement.span.startLine);
      return convertSimpleStatement(statement, code, comment);
    }
    case "if":
      return convertIf(state, statement, depth, false);
    case "while":
    case "for": {
      const { startLine, endLine } = statement.span;
      if (endLine <= startLine) {
        return null;
      }
      const header = readLine(state, startLine);
      const end = readLine(state, endLine);
      // IB's `loop until` is a WHILE loop that runs while its condition is false.
      const untilMatch = statement.kind === "while" ? LOOP_UNTIL_HEADER_RE.exec(header.code) : null;
      const match = untilMatch ?? (statement.kind === "while" ? WHILE_HEADER_RE : FOR_HEADER_RE).exec(header.code);
      if (!match || !(statement.kind === "while" ? ENDWHILE_RE : ENDFOR_RE).test(end.code)) {
        return null;
      }
      const body = collectBlock(state, statement.body, startLine + 1, endLine - 1, depth + 1);
      if (!body) {
        return null;
      }
      const controlKind = untilMatch ? "until" : statement.kind;
      return {
        kind: "loop",
        controlKind,
        condition: match[2],
        form: {
          kind: controlKind,
          prefix: match[1],
          suffix: match[3] ?? "",
          comment: header.comment,
          endLine: dedentLine(state, state.lines[endLine - 1] ?? "", depth),
          blankLinesBeforeEnd: body.trailingBlankLines,
        },
        bodyItems: body.items,
        blankBefore: 0,
      };
    }
    case "repeat": {
      const { startLine, endLine } = statement.span;
      const header = readLine(state, startLine);
      const until = readLine(state, endLine);
      const match = UNTIL_RE.exec(until.code);
      if (
        endLine <= startLine ||
        statement.condition.span.startLine !== endLine ||
        !REPEAT_HEADER_RE.test(header.code) ||
        !match
      ) {
        return null;
      }
      const body = collectBlock(state, statement.body, startLine + 1, endLine - 1, depth + 1);
      if (!body) {
        return null;
      }
      return {
        kind: "repeat",
        condition: match[2],
        form: {
          kind: "repeat",
          prefix: match[1],
          suffix: "",
          comment: until.comment,
          startLine: dedentLine(state, state.lines[startLine - 1] ?? "", depth),
          blankLinesBeforeEnd: body.trailingBlankLines,
        },
        bodyItems: body.items,
        blankBefore: 0,
      };
    }
    case "case":
      return convertCase(state, statement, depth);
    case "procedureDefinition":
    case "functionDefinition": {
      // Routines are drawn as charts of their own, which only works for the ones at the top level.
      const { startLine, endLine } = statement.span;
      const header = readLine(state, startLine);
      if (
        depth !== 0 ||
        endLine <= startLine ||
        !ROUTINE_HEADER_RE.test(header.code) ||
        !ROUTINE_END_RE.test(readLine(state, endLine).code)
      ) {
        return null;
      }
      const body = collectBlock(state, statement.body, startLine + 1, endLine - 1, depth + 1);
      if (!body) {
        return null;
      }
      return {
        kind: "routine",
        routineKind: statement.kind === "functionDefinition" ? "function" : "procedure",
        header: header.code,
        form: {
          kind: "routine",
          prefix: "",
          suffix: "",
          comment: header.comment,
          endLine: dedentLine(state, state.lines[endLine - 1] ?? "", depth),
          blankLinesBeforeEnd: body.trailingBlankLines,
        },
        bodyItems: body.items,
        blankBefore: 0,
      };
    }
    default:
      return null;
  }
}

/** The text of a span that sits on one line, as written. */
function readSpanText(state: ImportState, span: { startLine: number; startColumn: number; endLine: number; endColumn: number }) {
  if (span.startLine !== span.endLine) {
    return null;
  }
  return (state.lines[span.startLine - 1] ?? "").slice(span.startColumn - 1, span.endColumn);
}

/**
 * Reads a CASE (or OCR `switch`) as a chain of decisions, one per option. Returns null for layouts
 * the chain can't write back as they are, such as comments between options.
 */
function convertCase(state: ImportState, statement: CaseStatementNode, depth: number): FlowItem | null {
  const { startLine, endLine } = statement.span;
  const header = readLine(state, startLine);
  const subject = readSpanText(state, statement.expression.span);
  if (
    endLine <= startLine ||
    !subject ||
    statement.expression.span.startLine !== startLine ||
    !CASE_HEADER_RE.test(header.code) ||
    !ENDCASE_RE.test(readLine(state, endLine).code) ||
    statement.clauses.length === 0
  ) {
    return null;
  }

  const arms: CaseArm[] = [];
  let otherwise: Extract<FlowItem, { kind: "case" }>["otherwise"] = null;
  let cursor = startLine + 1;

  for (const clause of statement.clauses) {
    const labelLine = clause.span.startLine;
    let blankBefore = 0;
    for (; cursor < labelLine; cursor += 1) {
      if ((state.lines[cursor - 1] ?? "").trim().length > 0) {
        return null;
      }
      blankBefore += 1;
    }
    if (otherwise) {
      // Nothing can follow OTHERWISE in a chain of decisions.
      return null;
    }

    const raw = state.lines[labelLine - 1] ?? "";
    const indent = raw.length - raw.trimStart().length;
    const { code, comment } = readLine(state, labelLine);
    const statementSpan = clause.statement.span;
    const inline = statementSpan.startLine === labelLine;
    const labelEnd = inline ? statementSpan.startColumn - 1 - indent : code.length;
    if (labelEnd <= 0 || labelEnd > code.length) {
      return null;
    }
    const label = code.slice(0, labelEnd);

    let items: FlowItem[];
    if (inline) {
      if (statementSpan.endLine !== labelLine) {
        return null;
      }
      const item = convertInlineStatement(clause.statement, code.slice(labelEnd), comment);
      if (!item) {
        return null;
      }
      items = [item];
    } else {
      const block = collectBlock(state, [clause.statement], labelLine + 1, statementSpan.endLine, depth + 2);
      if (!block) {
        return null;
      }
      items = block.items;
    }
    // Each option holds one statement; comments around it can't be placed in the chain.
    const [only, ...rest] = items;
    if (!only || rest.length > 0 || (only.kind === "process" && only.lines.length !== 1)) {
      return null;
    }
    cursor = statementSpan.endLine + 1;

    if (!clause.value) {
      otherwise = { label: inline ? label : `${label}${comment}`, inline, items, blankBefore };
      continue;
    }

    const valueSpan = clause.value.span;
    const valueStart = valueSpan.startColumn - 1 - indent;
    const valueEnd = valueSpan.endColumn - indent;
    if (valueSpan.startLine !== labelLine || valueSpan.endLine !== labelLine || valueStart < 0 || valueEnd > labelEnd) {
      return null;
    }
    // A label such as `A OR B` would need brackets to read as one condition, which would change it.
    if (hasTopLevelOperator(label.slice(valueStart, valueEnd))) {
      return null;
    }
    arms.push({
      value: label.slice(valueStart, valueEnd),
      form: {
        kind: "case",
        prefix: label.slice(0, valueStart),
        suffix: label.slice(valueEnd),
        comment: inline ? "" : comment,
        inline,
      },
      items,
      blankBefore,
    });
  }

  let blankLinesBeforeEnd = 0;
  for (; cursor < endLine; cursor += 1) {
    if ((state.lines[cursor - 1] ?? "").trim().length > 0) {
      return null;
    }
    blankLinesBeforeEnd += 1;
  }

  if (arms.length === 0) {
    return null;
  }

  return {
    kind: "case",
    subject,
    form: {
      startLine: dedentLine(state, state.lines[startLine - 1] ?? "", depth),
      endLine: dedentLine(state, state.lines[endLine - 1] ?? "", depth),
      blankLinesAfterStart: arms[0].blankBefore,
      blankLinesBeforeEnd,
    },
    arms,
    otherwise,
    blankBefore: 0,
  };
}

/** A CASE option's statement written after its label: `1 : OUTPUT "One"`. */
function convertInlineStatement(statement: StatementNode, code: string, comment: string): FlowItem | null {
  switch (statement.kind) {
    case "input":
    case "output":
    case "callStatement":
      return convertSimpleStatement(statement, code, comment) ?? { kind: "process", lines: [`${code}${comment}`], blankBefore: 0 };
    case "if":
    case "while":
    case "for":
    case "repeat":
    case "case":
    case "procedureDefinition":
    case "functionDefinition":
      return null;
    default:
      return { kind: "process", lines: [`${code}${comment}`], blankBefore: 0 };
  }
}

function convertSimpleStatement(
  statement: Extract<StatementNode, { kind: "input" | "output" | "callStatement" }>,
  code: string,
  comment: string,
): FlowItem | null {
  const toForm = (kind: FlowchartSourceFormKind, match: RegExpExecArray): FlowchartSourceForm => ({
    kind,
    prefix: match[1],
    suffix: match[3] ?? "",
    comment,
  });

  if (statement.kind === "input") {
    const keyword = INPUT_KEYWORD_RE.exec(code);
    if (keyword) {
      return { kind: "io", ioType: "input", content: keyword[2], form: toForm("input", keyword), blankBefore: 0 };
    }
    const assigned = INPUT_ASSIGN_RE.exec(code);
    if (assigned) {
      return {
        kind: "io",
        ioType: "input",
        content: assigned[1],
        form: { kind: "input", prefix: "", suffix: assigned[2], comment },
        blankBefore: 0,
      };
    }
    return null;
  }

  if (statement.kind === "output") {
    const printed = PRINT_CALL_RE.exec(code);
    const match = printed && hasBalancedParentheses(printed[2]) ? printed : OUTPUT_KEYWORD_RE.exec(code);
    return match
      ? { kind: "io", ioType: "output", content: match[2], form: toForm("output", match), blankBefore: 0 }
      : null;
  }

  const call = CALL_KEYWORD_RE.exec(code) ?? BARE_CALL_RE.exec(code);
  return call ? { kind: "call", content: call[2], form: toForm("call", call), blankBefore: 0 } : null;
}

function convertIf(
  state: ImportState,
  statement: IfStatementNode,
  depth: number,
  asElseIf: boolean,
): Extract<FlowItem, { kind: "if" }> | null {
  const { startLine, endLine } = statement.span;
  const header = readLine(state, startLine);
  const match = (asElseIf ? ELSEIF_HEADER_RE : IF_HEADER_RE).exec(header.code);
  if (!match || endLine <= startLine || !ENDIF_RE.test(readLine(state, endLine).code)) {
    return null;
  }

  const thenLast = statement.thenBody.at(-1)?.span.endLine ?? startLine;
  const firstElse = statement.elseBody[0];
  let thenEnd = endLine - 1;
  let elseItems: FlowItem[] = [];
  let hasElseBranch = false;
  let elseLine: string | undefined;
  let elseTrailingBlankLines: number | null = null;

  if (
    statement.elseBody.length === 1 &&
    firstElse.kind === "if" &&
    firstElse.span.startLine > thenLast &&
    ELSEIF_HEADER_RE.test(readLine(state, firstElse.span.startLine).code)
  ) {
    // ELSEIF chains share one ENDIF, so the nested IF ends on the same line.
    const nested = firstElse.span.endLine === endLine ? convertIf(state, firstElse, depth, true) : null;
    if (!nested) {
      return null;
    }
    thenEnd = firstElse.span.startLine - 1;
    elseItems = [nested];
    hasElseBranch = true;
    elseTrailingBlankLines = 0;
  } else {
    const searchEnd = (firstElse?.span.startLine ?? endLine) - 1;
    let elseLineNumber: number | null = null;
    for (let lineNumber = thenLast + 1; lineNumber <= searchEnd; lineNumber += 1) {
      if (ELSE_RE.test(readLine(state, lineNumber).code)) {
        elseLineNumber = lineNumber;
        break;
      }
    }

    if (elseLineNumber === null) {
      if (firstElse) {
        return null;
      }
    } else {
      const elseBlock = collectBlock(state, statement.elseBody, elseLineNumber + 1, endLine - 1, depth + 1);
      if (!elseBlock) {
        return null;
      }
      elseItems = elseBlock.items;
      elseTrailingBlankLines = elseBlock.trailingBlankLines;
      hasElseBranch = true;
      elseLine = dedentLine(state, state.lines[elseLineNumber - 1] ?? "", depth);
      thenEnd = elseLineNumber - 1;
    }
  }

  const thenBlock = collectBlock(state, statement.thenBody, startLine + 1, thenEnd, depth + 1);
  if (!thenBlock) {
    return null;
  }

  return {
    kind: "if",
    condition: match[2],
    form: {
      kind: asElseIf ? "elseif" : "if",
      prefix: match[1],
      suffix: match[3] ?? "",
      comment: header.comment,
      elseLine,
      endLine: dedentLine(state, state.lines[endLine - 1] ?? "", depth),
      blankLinesBeforeElse: hasElseBranch ? thenBlock.trailingBlankLines : 0,
      blankLinesBeforeEnd: elseTrailingBlankLines ?? thenBlock.trailingBlankLines,
    },
    thenItems: thenBlock.items,
    elseItems,
    hasElseBranch,
    elseIf: asElseIf,
    blankBefore: 0,
  };
}

function readParsedItems(state: ImportState, source: string, syntaxId?: string): FlowItem[] | null {
  const { ast, diagnostics } = parseSource(source, syntaxId);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return null;
  }

  return collectBlock(state, ast.body, 1, state.lines.length, 0, true)?.items ?? null;
}

// ── Import from source that doesn't parse ──

type FallbackBlock =
  | { kind: "if"; branches: number[]; end: number }
  | { kind: "while" | "for"; end: number };

/** Matches headers to closers in one pass; unmatched headers and closers stay plain lines. */
function matchFallbackBlocks(state: ImportState): Map<number, FallbackBlock> {
  const blocks = new Map<number, FallbackBlock>();
  const stack: Array<{ line: number; kind: "if" | "while" | "for"; branches: number[]; hasElse: boolean }> = [];

  const closeNearest = (lineNumber: number, kinds: ReadonlyArray<"if" | "while" | "for">) => {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (kinds.includes(stack[index].kind)) {
        const [open] = stack.splice(index);
        blocks.set(
          open.line,
          open.kind === "if"
            ? { kind: "if", branches: open.branches, end: lineNumber }
            : { kind: open.kind, end: lineNumber },
        );
        return;
      }
    }
  };

  for (let lineNumber = 1; lineNumber <= state.lines.length; lineNumber += 1) {
    const { code } = readLine(state, lineNumber);
    if (code.length === 0) {
      continue;
    }
    const top = stack.at(-1);
    const closerKinds: Array<"if" | "while" | "for"> = [];
    if (ENDIF_RE.test(code)) closerKinds.push("if");
    if (ENDWHILE_RE.test(code)) closerKinds.push("while");
    if (ENDFOR_RE.test(code)) closerKinds.push("for");

    if (closerKinds.length > 0) {
      closeNearest(lineNumber, closerKinds);
    } else if (ELSEIF_HEADER_RE.test(code) || ELSE_RE.test(code)) {
      if (top?.kind === "if" && !top.hasElse) {
        top.branches.push(lineNumber);
        top.hasElse = ELSE_RE.test(code);
      }
    } else if (stack.length < MAX_FALLBACK_NESTING) {
      if (IF_HEADER_RE.test(code)) {
        stack.push({ line: lineNumber, kind: "if", branches: [], hasElse: false });
      } else if (WHILE_HEADER_RE.test(code)) {
        stack.push({ line: lineNumber, kind: "while", branches: [], hasElse: false });
      } else if (FOR_HEADER_RE.test(code)) {
        stack.push({ line: lineNumber, kind: "for", branches: [], hasElse: false });
      }
    }
  }

  return blocks;
}

function readFallbackRange(
  state: ImportState,
  blocks: Map<number, FallbackBlock>,
  fromLine: number,
  toLine: number,
  depth: number,
  topLevel = false,
): BlockBuilder {
  const builder = new BlockBuilder(topLevel);

  for (let lineNumber = fromLine; lineNumber <= toLine; lineNumber += 1) {
    const raw = state.lines[lineNumber - 1] ?? "";
    if (raw.trim().length === 0) {
      builder.addBlank();
      continue;
    }

    const { code, comment } = readLine(state, lineNumber);
    if (code.length === 0) {
      builder.addComment(comment, dedentLine(state, raw, depth));
      continue;
    }

    // Unparsed code is often half-typed: a line indented deeper than its block (such as the body of an
    // IF with no ENDIF yet) keeps its own indentation instead of being read as a block of its own.
    if (raw.length - raw.trimStart().length > state.indentUnit.length * depth) {
      builder.addLine(dedentLine(state, raw, depth));
      continue;
    }

    const block = blocks.get(lineNumber);
    if (block && block.end <= toLine) {
      builder.addItem(
        block.kind === "if"
          ? readFallbackIf(state, blocks, lineNumber, block.branches, block.end, depth, false)
          : readFallbackLoop(state, blocks, lineNumber, block, depth),
      );
      lineNumber = block.end;
      continue;
    }

    const simple = readFallbackSimpleLine(code, comment);
    if (simple) {
      builder.addItem(simple);
    } else {
      builder.addLine(dedentLine(state, raw, depth));
    }
  }

  return builder;
}

function readFallbackSimpleLine(code: string, comment: string): FlowItem | null {
  const input = INPUT_KEYWORD_RE.exec(code);
  if (input) {
    return {
      kind: "io",
      ioType: "input",
      content: input[2],
      form: { kind: "input", prefix: input[1], suffix: "", comment },
      blankBefore: 0,
    };
  }
  const output = OUTPUT_KEYWORD_RE.exec(code);
  if (output && !/^print\s*\(/i.test(code)) {
    return {
      kind: "io",
      ioType: "output",
      content: output[2],
      form: { kind: "output", prefix: output[1], suffix: "", comment },
      blankBefore: 0,
    };
  }
  const call = CALL_KEYWORD_RE.exec(code);
  if (call) {
    return { kind: "call", content: call[2], form: { kind: "call", prefix: call[1], suffix: "", comment }, blankBefore: 0 };
  }
  return null;
}

function readFallbackIf(
  state: ImportState,
  blocks: Map<number, FallbackBlock>,
  headerLine: number,
  branches: number[],
  endLine: number,
  depth: number,
  asElseIf: boolean,
): Extract<FlowItem, { kind: "if" }> {
  const header = readLine(state, headerLine);
  const match = (asElseIf ? ELSEIF_HEADER_RE : IF_HEADER_RE).exec(header.code);
  const [nextBranch, ...laterBranches] = branches;
  const thenEnd = (nextBranch ?? endLine) - 1;
  const thenBlock = readFallbackRange(state, blocks, headerLine + 1, thenEnd, depth + 1);
  let elseItems: FlowItem[] = [];
  let elseLine: string | undefined;
  let elseTrailingBlankLines: number | null = null;

  if (nextBranch !== undefined) {
    elseTrailingBlankLines = 0;
    if (ELSE_RE.test(readLine(state, nextBranch).code)) {
      elseLine = dedentLine(state, state.lines[nextBranch - 1] ?? "", depth);
      const elseBlock = readFallbackRange(state, blocks, nextBranch + 1, endLine - 1, depth + 1);
      elseItems = elseBlock.items;
      elseTrailingBlankLines = elseBlock.trailingBlankLines;
    } else {
      elseItems = [readFallbackIf(state, blocks, nextBranch, laterBranches, endLine, depth, true)];
    }
  }

  return {
    kind: "if",
    condition: match?.[2] ?? header.code,
    form: {
      kind: asElseIf ? "elseif" : "if",
      prefix: match?.[1] ?? "",
      suffix: match?.[3] ?? "",
      comment: header.comment,
      elseLine,
      endLine: dedentLine(state, state.lines[endLine - 1] ?? "", depth),
      blankLinesBeforeElse: nextBranch !== undefined ? thenBlock.trailingBlankLines : 0,
      blankLinesBeforeEnd: elseTrailingBlankLines ?? thenBlock.trailingBlankLines,
    },
    thenItems: thenBlock.items,
    elseItems,
    hasElseBranch: nextBranch !== undefined,
    elseIf: asElseIf,
    blankBefore: 0,
  };
}

function readFallbackLoop(
  state: ImportState,
  blocks: Map<number, FallbackBlock>,
  headerLine: number,
  block: Extract<FallbackBlock, { kind: "while" | "for" }>,
  depth: number,
): FlowItem {
  const header = readLine(state, headerLine);
  const match = (block.kind === "while" ? WHILE_HEADER_RE : FOR_HEADER_RE).exec(header.code);
  const body = readFallbackRange(state, blocks, headerLine + 1, block.end - 1, depth + 1);
  return {
    kind: "loop",
    controlKind: block.kind,
    condition: match?.[2] ?? header.code,
    form: {
      kind: block.kind,
      prefix: match?.[1] ?? "",
      suffix: match?.[3] ?? "",
      comment: header.comment,
      endLine: dedentLine(state, state.lines[block.end - 1] ?? "", depth),
      blankLinesBeforeEnd: body.trailingBlankLines,
    },
    bodyItems: body.items,
    blankBefore: 0,
  };
}

// ── Layout ──

export function createFlowchartEdge(
  id: string,
  sourceId: string,
  targetId: string,
  options: Pick<Edge, "sourceHandle" | "targetHandle" | "label"> = {},
): Edge {
  return {
    id,
    source: sourceId,
    target: targetId,
    sourceHandle: options.sourceHandle,
    targetHandle: options.targetHandle,
    type: "smoothstep",
    animated: true,
    label: options.label,
    style: { stroke: "var(--accent)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" },
    labelStyle: { fill: "var(--text2)", fontSize: 11 },
  };
}

function createSequentialEdge(
  sourceId: string,
  targetId: string,
  index: number,
  options: Pick<Edge, "sourceHandle" | "label"> = {},
): Edge {
  return createFlowchartEdge(`import-edge-${index}`, sourceId, targetId, options);
}

/**
 * The new edges that join each deleted block's predecessors to its successor, the way deleting a line
 * keeps the code around it connected. `edges` are the edges from before the deletion. Decisions have
 * two exits, so their predecessors are left unconnected.
 */
export function bridgeEdgesAroundDeletedNodes(deletedNodes: Node[], edges: Edge[]): Edge[] {
  const deletedIds = new Set(deletedNodes.map((node) => node.id));
  const decisionIds = new Set(
    deletedNodes.filter((node) => (node.data as FlowchartNodeData).type === "decision").map((node) => node.id),
  );
  const outgoing = new Map<string, Edge>();
  for (const edge of edges) {
    if (deletedIds.has(edge.source) && !outgoing.has(edge.source)) {
      outgoing.set(edge.source, edge);
    }
  }

  const resolveTarget = (nodeId: string): string | null => {
    const seen = new Set<string>();
    let currentId: string | null = nodeId;
    while (currentId && deletedIds.has(currentId)) {
      if (seen.has(currentId) || decisionIds.has(currentId)) {
        return null;
      }
      seen.add(currentId);
      currentId = outgoing.get(currentId)?.target ?? null;
    }
    return currentId;
  };

  const kept = edges.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
  const bridges: Edge[] = [];
  for (const edge of edges) {
    if (deletedIds.has(edge.source) || !deletedIds.has(edge.target)) {
      continue;
    }
    const targetId = resolveTarget(edge.target);
    if (!targetId) {
      continue;
    }
    const duplicate = [...kept, ...bridges].some(
      (existing) =>
        existing.source === edge.source &&
        (existing.sourceHandle ?? null) === (edge.sourceHandle ?? null),
    );
    if (!duplicate) {
      bridges.push({ ...edge, id: `${edge.id}-to-${targetId}`, target: targetId, targetHandle: null });
    }
  }

  return bridges;
}

function getEstimatedNodeHeight(type: FlowchartNodeType, data: FlowchartNodeData): number {
  switch (type) {
    case "terminator":
      return 60;
    case "inputOutput":
      return 88;
    case "subroutine":
      return 80;
    case "decision":
      return 140;
    case "process": {
      const statements = getProcessStatements(data);
      return Math.max(100, 64 + statements.length * 40);
    }
    default:
      return 100;
  }
}

function createNode(
  context: LayoutContext,
  type: FlowchartNodeType,
  data: FlowchartNodeData,
  x: number,
  y: number,
): Node {
  const node: Node = {
    id: `import-node-${context.nextNodeIndex}`,
    type,
    position: { x, y },
    data,
  };

  context.nextNodeIndex += 1;
  context.nodes.push(node);
  return node;
}

function pushEdge(
  context: LayoutContext,
  sourceId: string,
  targetId: string,
  options: Pick<Edge, "sourceHandle" | "label"> = {},
): void {
  context.edges.push(createSequentialEdge(sourceId, targetId, context.nextEdgeIndex, options));
  context.nextEdgeIndex += 1;
}

function connectPendingExits(
  context: LayoutContext,
  pendingExits: PendingExit[],
  targetId: string,
): void {
  for (const pending of pendingExits) {
    pushEdge(context, pending.nodeId, targetId, {
      sourceHandle: pending.sourceHandle,
      label: pending.label,
    });
  }
}

function createDecisionPendingExit(
  nodeId: string,
  sourceHandle: "true" | "false",
  data: FlowchartNodeData,
): PendingExit {
  return {
    nodeId,
    sourceHandle,
    label: sourceHandle === "true" ? data.trueLabel || "Yes" : data.falseLabel || "No",
  };
}

function withBlankLines(data: FlowchartNodeData, blankBefore: number): FlowchartNodeData {
  return blankBefore > 0 ? { ...data, blankLinesBefore: blankBefore } : data;
}

function layoutSingleNode(
  context: LayoutContext,
  x: number,
  y: number,
  type: FlowchartNodeType,
  data: FlowchartNodeData,
): LayoutResult {
  const node = createNode(context, type, data, x, y);
  return {
    entryId: node.id,
    pendingExits: [{ nodeId: node.id }],
    nextY: y + getEstimatedNodeHeight(type, data) + FLOWCHART_VERTICAL_GAP,
  };
}

function layoutLoop(
  context: LayoutContext,
  x: number,
  y: number,
  item: Extract<FlowItem, { kind: "loop" }>,
): LayoutResult {
  const nodeData = withBlankLines(
    createFlowchartNodeData("decision", {
      content: item.condition,
      trueLabel: "Yes",
      falseLabel: "No",
      controlKind: item.controlKind,
      forIterator: item.controlKind === "for" ? forIteratorOf(item.condition) : undefined,
      sourceForm: item.form,
    }),
    item.blankBefore,
  );
  const decisionNode = createNode(context, "decision", nodeData, x, y);
  const bodyStartY = y + getEstimatedNodeHeight("decision", nodeData) + FLOWCHART_BRANCH_VERTICAL_GAP;
  const bodyLayout = layoutItems(context, x + FLOWCHART_BRANCH_HORIZONTAL_GAP, bodyStartY, item.bodyItems);
  // A `loop until` runs its body while the condition is false.
  const bodyHandle = item.controlKind === "until" ? "false" : "true";
  const exitHandle = bodyHandle === "true" ? "false" : "true";
  const bodyLabel = bodyHandle === "true" ? nodeData.trueLabel || "Yes" : nodeData.falseLabel || "No";

  if (bodyLayout.entryId) {
    pushEdge(context, decisionNode.id, bodyLayout.entryId, { sourceHandle: bodyHandle, label: bodyLabel });
    connectPendingExits(context, bodyLayout.pendingExits, decisionNode.id);
  } else {
    pushEdge(context, decisionNode.id, decisionNode.id, { sourceHandle: bodyHandle, label: bodyLabel });
  }

  return {
    entryId: decisionNode.id,
    pendingExits: [createDecisionPendingExit(decisionNode.id, exitHandle, nodeData)],
    nextY: Math.max(bodyLayout.nextY, bodyStartY) + FLOWCHART_VERTICAL_GAP,
  };
}

/** REPEAT … UNTIL: the body, then the test, which loops back to the body's first block when false. */
function layoutRepeat(
  context: LayoutContext,
  x: number,
  y: number,
  item: Extract<FlowItem, { kind: "repeat" }>,
): LayoutResult {
  const bodyLayout = layoutItems(context, x, y, item.bodyItems);
  const nodeData = withBlankLines(
    createFlowchartNodeData("decision", {
      content: item.condition,
      trueLabel: "Yes",
      falseLabel: "No",
      controlKind: "repeat",
      sourceForm: item.form,
    }),
    item.blankBefore,
  );
  const decisionNode = createNode(context, "decision", nodeData, x, bodyLayout.entryId ? bodyLayout.nextY : y);
  connectPendingExits(context, bodyLayout.pendingExits, decisionNode.id);
  pushEdge(context, decisionNode.id, bodyLayout.entryId ?? decisionNode.id, {
    sourceHandle: "false",
    label: nodeData.falseLabel || "No",
  });

  return {
    entryId: bodyLayout.entryId ?? decisionNode.id,
    pendingExits: [createDecisionPendingExit(decisionNode.id, "true", nodeData)],
    nextY: decisionNode.position.y + getEstimatedNodeHeight("decision", nodeData) + FLOWCHART_VERTICAL_GAP,
  };
}

/** CASE: one decision per option down the left, each option's statement to its right, OTHERWISE last. */
function layoutCase(
  context: LayoutContext,
  x: number,
  y: number,
  item: Extract<FlowItem, { kind: "case" }>,
  armIndex = 0,
): LayoutResult {
  const { dialect } = context;
  const arm = item.arms[armIndex];
  const first = armIndex === 0;
  const last = armIndex === item.arms.length - 1;
  const nodeData = withBlankLines(
    createFlowchartNodeData("decision", {
      content: caseCondition(item.subject, arm.value, dialect),
      trueLabel: "Yes",
      falseLabel: "No",
      controlKind: "case",
      caseSubject: item.subject,
      caseStart: first || undefined,
      sourceForm: {
        ...arm.form,
        ...(first ? item.form : {}),
        ...(last && item.otherwise
          ? {
              otherwiseLabel: item.otherwise.label,
              otherwiseInline: item.otherwise.inline,
              blankLinesBeforeElse: item.otherwise.blankBefore,
            }
          : {}),
      },
    }),
    first ? item.blankBefore : arm.blankBefore,
  );
  const decisionNode = createNode(context, "decision", nodeData, x, y);
  const branchStartY = y + getEstimatedNodeHeight("decision", nodeData) + FLOWCHART_BRANCH_VERTICAL_GAP;
  const thenLayout = layoutItems(context, x + FLOWCHART_BRANCH_HORIZONTAL_GAP, branchStartY, arm.items);
  const elseLayout = last
    ? layoutItems(context, x, branchStartY, item.otherwise?.items ?? [])
    : layoutCase(context, x, branchStartY, item, armIndex + 1);

  if (thenLayout.entryId) {
    pushEdge(context, decisionNode.id, thenLayout.entryId, { sourceHandle: "true", label: nodeData.trueLabel || "Yes" });
  }
  if (elseLayout.entryId) {
    pushEdge(context, decisionNode.id, elseLayout.entryId, { sourceHandle: "false", label: nodeData.falseLabel || "No" });
  }

  return {
    entryId: decisionNode.id,
    pendingExits: [
      ...(thenLayout.entryId ? thenLayout.pendingExits : [createDecisionPendingExit(decisionNode.id, "true", nodeData)]),
      ...(elseLayout.entryId ? elseLayout.pendingExits : [createDecisionPendingExit(decisionNode.id, "false", nodeData)]),
    ],
    nextY: Math.max(thenLayout.nextY, elseLayout.nextY, branchStartY) + FLOWCHART_VERTICAL_GAP,
  };
}

/** A procedure or function as a flowchart of its own: its header, its body, then Return. */
function layoutRoutine(
  context: LayoutContext,
  x: number,
  item: Extract<FlowItem, { kind: "routine" }>,
  anchorId: string | undefined,
  order: number,
): void {
  const start = layoutSingleNode(
    context,
    x,
    FLOWCHART_NODE_Y,
    "terminator",
    withBlankLines(
      createFlowchartNodeData("terminator", {
        label: item.header,
        routine: item.routineKind,
        routineAnchor: anchorId,
        routineOrder: order,
        sourceForm: item.form,
      }),
      item.blankBefore,
    ),
  );
  const body = layoutItems(context, x, start.nextY, item.bodyItems);
  const end = layoutSingleNode(
    context,
    x,
    body.entryId ? body.nextY : start.nextY,
    "terminator",
    createFlowchartNodeData("terminator", { label: "Return", implicit: true, routineEnd: true }),
  );
  if (body.entryId && start.entryId) {
    connectPendingExits(context, start.pendingExits, body.entryId);
    connectPendingExits(context, body.pendingExits, end.entryId ?? body.entryId);
  } else if (end.entryId) {
    connectPendingExits(context, start.pendingExits, end.entryId);
  }
}

function layoutIf(
  context: LayoutContext,
  x: number,
  y: number,
  item: Extract<FlowItem, { kind: "if" }>,
): LayoutResult {
  const nodeData = withBlankLines(
    createFlowchartNodeData("decision", {
      content: item.condition,
      trueLabel: "Yes",
      falseLabel: "No",
      controlKind: "if",
      hasElseBranch: item.hasElseBranch,
      elseIf: item.elseIf || undefined,
      sourceForm: item.form,
    }),
    item.blankBefore,
  );
  const decisionNode = createNode(context, "decision", nodeData, x, y);
  const branchStartY = y + getEstimatedNodeHeight("decision", nodeData) + FLOWCHART_BRANCH_VERTICAL_GAP;
  const thenLayout = layoutItems(context, x + FLOWCHART_BRANCH_HORIZONTAL_GAP, branchStartY, item.thenItems);
  const elseLayout = layoutItems(context, x, branchStartY, item.elseItems);

  if (thenLayout.entryId) {
    pushEdge(context, decisionNode.id, thenLayout.entryId, {
      sourceHandle: "true",
      label: nodeData.trueLabel || "Yes",
    });
  }

  if (elseLayout.entryId) {
    pushEdge(context, decisionNode.id, elseLayout.entryId, {
      sourceHandle: "false",
      label: nodeData.falseLabel || "No",
    });
  }

  return {
    entryId: decisionNode.id,
    pendingExits: [
      ...(thenLayout.entryId
        ? thenLayout.pendingExits
        : [createDecisionPendingExit(decisionNode.id, "true", nodeData)]),
      ...(elseLayout.entryId
        ? elseLayout.pendingExits
        : [createDecisionPendingExit(decisionNode.id, "false", nodeData)]),
    ],
    nextY: Math.max(thenLayout.nextY, elseLayout.nextY, branchStartY) + FLOWCHART_VERTICAL_GAP,
  };
}

function layoutItem(context: LayoutContext, x: number, y: number, item: FlowItem): LayoutResult {
  switch (item.kind) {
    case "process": {
      const firstLine = item.lines.find((line) => line.trim().length > 0)?.trim() ?? "";
      return layoutSingleNode(
        context,
        x,
        y,
        "process",
        withBlankLines(
          createFlowchartNodeData("process", { label: firstLine || "Process", statements: item.lines }),
          item.blankBefore,
        ),
      );
    }
    case "terminator":
      return layoutSingleNode(
        context,
        x,
        y,
        "terminator",
        withBlankLines(
          createFlowchartNodeData("terminator", { label: item.label, implicit: item.implicit || undefined }),
          item.blankBefore,
        ),
      );
    case "io":
      return layoutSingleNode(
        context,
        x,
        y,
        "inputOutput",
        withBlankLines(
          createFlowchartNodeData("inputOutput", {
            ioType: item.ioType,
            content: item.content,
            sourceForm: item.form,
          }),
          item.blankBefore,
        ),
      );
    case "call":
      return layoutSingleNode(
        context,
        x,
        y,
        "subroutine",
        withBlankLines(
          createFlowchartNodeData("subroutine", {
            label: "Subroutine",
            content: item.content,
            subroutineName: item.content.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0],
            sourceForm: item.form,
          }),
          item.blankBefore,
        ),
      );
    case "if":
      return layoutIf(context, x, y, item);
    case "loop":
      return layoutLoop(context, x, y, item);
    case "repeat":
      return layoutRepeat(context, x, y, item);
    case "case":
      return layoutCase(context, x, y, item);
    case "routine":
      // Routines are drawn beside the main flow by buildFlowchartFromPseudocode.
      return { entryId: null, pendingExits: [], nextY: y };
  }
}

function layoutItems(context: LayoutContext, x: number, y: number, items: FlowItem[]): LayoutResult {
  let entryId: string | null = null;
  let pendingExits: PendingExit[] = [];
  let currentY = y;

  for (const item of items) {
    const layout = layoutItem(context, x, currentY, item);
    if (layout.entryId) {
      context.entryIds.set(item, layout.entryId);
      connectPendingExits(context, pendingExits, layout.entryId);
      entryId ??= layout.entryId;
      pendingExits = layout.pendingExits;
      currentY = layout.nextY;
    }
  }

  return { entryId, pendingExits, nextY: currentY };
}

function withImplicitTerminators(items: FlowItem[]): FlowItem[] {
  if (items.length === 0) {
    return [];
  }

  const nextItems = [...items];
  const firstItem = nextItems[0];
  const lastItem = nextItems[nextItems.length - 1];

  if (!(firstItem.kind === "terminator" && firstItem.label === "Start")) {
    nextItems.unshift({ kind: "terminator", label: "Start", implicit: true, blankBefore: 0 });
  }

  if (!(lastItem.kind === "terminator" && lastItem.label === "End")) {
    nextItems.push({ kind: "terminator", label: "End", implicit: true, blankBefore: 0 });
  }

  return nextItems;
}

export function buildFlowchartFromPseudocode(source: string, syntaxId?: string): FlowchartGraphSnapshot {
  const normalized = normalizeLineEndings(source);
  if (normalized.trim().length === 0) {
    return { nodes: [], edges: [] };
  }

  const state: ImportState = {
    lines: normalized.split("\n"),
    indentUnit: inferIndentUnit(normalized),
    commentPrefixes: resolveSyntax(syntaxId).comments,
  };
  const items =
    readParsedItems(state, normalized, syntaxId) ??
    readFallbackRange(state, matchFallbackBlocks(state), 1, state.lines.length, 0, true).items;
  const context: LayoutContext = {
    nodes: [],
    edges: [],
    nextNodeIndex: 0,
    nextEdgeIndex: 0,
    entryIds: new Map(),
    dialect: getDialect(syntaxId),
  };

  // Each routine is written before the next main-flow item, which it remembers to keep its place.
  const mainItems: FlowItem[] = [];
  const routines: Array<{ item: Extract<FlowItem, { kind: "routine" }>; before: FlowItem | null }> = [];
  for (const item of items) {
    if (item.kind === "routine") {
      routines.push({ item, before: null });
    } else {
      for (const routine of routines) {
        routine.before ??= item;
      }
      mainItems.push(item);
    }
  }
  const mainFlow = withImplicitTerminators(mainItems);
  for (const routine of routines) {
    routine.before ??= mainFlow.at(-1) ?? null;
  }

  layoutItems(context, FLOWCHART_NODE_X, FLOWCHART_NODE_Y, mainFlow);

  let routineX = FLOWCHART_NODE_X;
  routines.forEach((routine, order) => {
    if (context.nodes.length > 0) {
      routineX = Math.max(...context.nodes.map((node) => node.position.x)) + FLOWCHART_ROUTINE_GAP;
    }
    const anchorId = routine.before ? context.entryIds.get(routine.before) : undefined;
    layoutRoutine(context, routineX, routine.item, anchorId, order);
  });

  return {
    nodes: context.nodes,
    edges: context.edges,
  };
}

// ── Code generation ──

/** Process lines for display, without blank lines. */
export function getProcessStatements(data: FlowchartNodeData): string[] {
  if (!Array.isArray(data.statements)) {
    return [];
  }

  return data.statements
    .map((statement) => statement.trimEnd())
    .filter((statement) => statement.trim().length > 0);
}

/** Process lines for code, keeping blank lines inside the block (such as in a procedure body). */
function getProcessCodeLines(data: FlowchartNodeData): string[] {
  const lines = Array.isArray(data.statements) ? data.statements.map((statement) => statement.trimEnd()) : [];
  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop();
  }
  return lines;
}

export function getNodePrimaryText(data: FlowchartNodeData): string {
  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (content.length > 0) {
    return content;
  }

  const label = typeof data.label === "string" ? data.label.trim() : "";
  return label;
}

/** The Start of the main flow. A procedure's header is never one, even when it is named Start. */
export function isStartNode(data: FlowchartNodeData): boolean {
  return (
    data.type === "terminator" &&
    !data.routine &&
    !data.routineEnd &&
    data.label.trim().toLowerCase().includes("start")
  );
}

/** The End of the main flow. */
export function isEndNode(data: FlowchartNodeData): boolean {
  return data.type === "terminator" && !data.routine && !data.routineEnd && !isStartNode(data);
}

function compareNodes(a: Node, b: Node): number {
  if (a.position.y !== b.position.y) {
    return a.position.y - b.position.y;
  }
  return a.position.x - b.position.x;
}

type DialectFormKind = keyof FlowchartDialect["forms"];

/** The source form for `kind`, or the syntax's keywords when the block was added on the canvas or changed kind. */
function resolveForm(
  data: FlowchartNodeData,
  kind: DialectFormKind,
  dialect: FlowchartDialect,
): { prefix: string; suffix: string; comment: string } {
  const form = data.sourceForm;
  if (form && form.kind === kind) {
    return form;
  }
  return { ...dialect.forms[kind], comment: "" };
}

function formatLine(data: FlowchartNodeData, kind: DialectFormKind, content: string, dialect: FlowchartDialect) {
  const form = resolveForm(data, kind, dialect);
  return `${form.prefix}${content}${form.suffix}${form.comment}`;
}

function buildNodeLines(data: FlowchartNodeData, dialect: FlowchartDialect): string[] {
  switch (data.type) {
    case "terminator":
      if (data.implicit) {
        return [];
      }
      return [isStartNode(data) ? START_MARKER : END_MARKER];
    case "process": {
      const statements = getProcessCodeLines(data);
      if (statements.length > 0) {
        return statements;
      }

      const content = typeof data.content === "string" ? data.content.trim() : "";
      if (content.length > 0) {
        return [content];
      }

      return ["// Process"];
    }
    case "inputOutput": {
      const kind = data.ioType === "output" ? "output" : "input";
      const payload = getNodePrimaryText(data) || (kind === "input" ? "Value" : '"Output"');
      return [formatLine(data, kind, payload, dialect)];
    }
    case "subroutine": {
      const target = getNodePrimaryText(data) || "ProcedureName()";
      return [formatLine(data, "call", target, dialect)];
    }
    default:
      return [];
  }
}

/** Whether `fromId` leads to `toId` without passing through `avoidIds`. */
function reachesNode(
  outgoing: Map<string, Edge[]>,
  fromId: string,
  toId: string,
  avoidIds: ReadonlySet<string> = new Set(),
): boolean {
  const visited = new Set<string>();
  const queue = [fromId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === undefined) {
      break;
    }
    if (currentId === toId) {
      return true;
    }
    if (visited.has(currentId) || avoidIds.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    for (const edge of outgoing.get(currentId) ?? []) {
      queue.push(edge.target);
    }
  }
  return false;
}

/**
 * Finds the edge that closes each REPEAT loop: from its test back to the body's first block. When
 * both exits lead back round (a REPEAT inside a WHILE), the loop's own edge is the one whose target
 * gets back without passing through the other exit.
 */
function findRepeatBackEdges(nodeMap: Map<string, Node>, outgoing: Map<string, Edge[]>, dialect: FlowchartDialect) {
  const backEdges = new Set<string>();
  const repeatEntries = new Map<string, Edge[]>();

  for (const node of nodeMap.values()) {
    const data = node.data as FlowchartNodeData;
    // Without REPEAT in the syntax, a loop tested at the bottom is written with a WHILE instead.
    if (data.type !== "decision" || data.controlKind !== "repeat" || (data.sourceForm?.kind !== "repeat" && !dialect.repeatStart)) {
      continue;
    }

    const exits = (outgoing.get(node.id) ?? []).filter(
      (edge) => edge.sourceHandle === "true" || edge.sourceHandle === "false",
    );
    let loops = exits.filter((edge) => reachesNode(outgoing, edge.target, node.id));
    if (loops.length === 2) {
      const [first, second] = loops;
      const own = loops.filter((edge) =>
        reachesNode(outgoing, edge.target, node.id, new Set([(edge === first ? second : first).target])),
      );
      loops = own.length === 1 ? own : loops.filter((edge) => edge.sourceHandle === "false");
    }
    if (loops.length !== 1) {
      continue;
    }

    const [backEdge] = loops;
    backEdges.add(backEdge.id);
    repeatEntries.set(backEdge.target, [...(repeatEntries.get(backEdge.target) ?? []), backEdge]);
  }

  return { backEdges, repeatEntries };
}

function buildGraphIndex(nodes: Node[], edges: Edge[], dialect: FlowchartDialect): GraphIndex {
  const sortedNodes = [...nodes].sort(compareNodes);
  const nodeMap = new Map(sortedNodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, Edge[]>();
  const incoming = new Map<string, Edge[]>();

  const compareOutgoingEdges = (left: Edge, right: Edge) => {
    const handlePriority = (edge: Edge) => {
      if (edge.sourceHandle === "true") {
        return 0;
      }
      if (edge.sourceHandle === "false") {
        return 1;
      }
      return 2;
    };

    const handleDelta = handlePriority(left) - handlePriority(right);
    if (handleDelta !== 0) {
      return handleDelta;
    }

    const leftNode = nodeMap.get(left.target);
    const rightNode = nodeMap.get(right.target);
    if (!leftNode || !rightNode) {
      return left.id.localeCompare(right.id);
    }

    return compareNodes(leftNode, rightNode);
  };

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      continue;
    }

    const outgoingBucket = outgoing.get(edge.source) ?? [];
    outgoingBucket.push(edge);
    outgoing.set(edge.source, outgoingBucket);

    const incomingBucket = incoming.get(edge.target) ?? [];
    incomingBucket.push(edge);
    incoming.set(edge.target, incomingBucket);
  }

  for (const edgeList of outgoing.values()) {
    edgeList.sort(compareOutgoingEdges);
  }

  return { nodeMap, outgoing, incoming, ...findRepeatBackEdges(nodeMap, outgoing, dialect) };
}

function getDecisionBranchEdges(index: GraphIndex, nodeId: string): {
  trueEdge: Edge | null;
  falseEdge: Edge | null;
} {
  const outgoing = index.outgoing.get(nodeId) ?? [];
  return {
    trueEdge: outgoing.find((edge) => edge.sourceHandle === "true") ?? null,
    falseEdge: outgoing.find((edge) => edge.sourceHandle === "false") ?? null,
  };
}

function getReachableDistances(
  index: GraphIndex,
  startId: string | null,
  stopIds: ReadonlySet<string>,
  forbiddenId: string,
): Map<string, number> {
  const distances = new Map<string, number>();
  if (!startId) {
    return distances;
  }

  const queue: Array<{ id: string; distance: number }> = [{ id: startId, distance: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || distances.has(current.id)) {
      continue;
    }

    if (current.id === forbiddenId && current.distance > 0) {
      continue;
    }

    distances.set(current.id, current.distance);
    if (stopIds.has(current.id) && current.distance > 0) {
      continue;
    }

    for (const edge of index.outgoing.get(current.id) ?? []) {
      if (!index.backEdges.has(edge.id) && !distances.has(edge.target)) {
        queue.push({ id: edge.target, distance: current.distance + 1 });
      }
    }
  }

  return distances;
}

/**
 * Whether a branch returns to `targetId` without leaving through `blockedIds`. Blocking the enclosing
 * loop headers and merge points keeps an inner loop's exit, which flows back through the outer loop,
 * from counting as a second path back to the inner loop. REPEAT loops' closing edges don't count either.
 */
function branchReachesNode(
  index: GraphIndex,
  startId: string | null,
  targetId: string,
  blockedIds: ReadonlySet<string>,
): boolean {
  if (!startId) {
    return false;
  }

  if (startId === targetId) {
    return true;
  }

  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId) || blockedIds.has(currentId)) {
      continue;
    }

    visited.add(currentId);
    for (const edge of index.outgoing.get(currentId) ?? []) {
      if (index.backEdges.has(edge.id)) {
        continue;
      }
      if (edge.target === targetId) {
        return true;
      }
      queue.push(edge.target);
    }
  }

  return false;
}

function findDecisionMergeNode(
  index: GraphIndex,
  decisionId: string,
  trueStartId: string | null,
  falseStartId: string | null,
  stopIds: ReadonlySet<string>,
): string | null {
  if (!trueStartId || !falseStartId) {
    return null;
  }

  if (trueStartId === falseStartId) {
    return trueStartId;
  }

  const trueReachable = getReachableDistances(index, trueStartId, stopIds, decisionId);
  const falseReachable = getReachableDistances(index, falseStartId, stopIds, decisionId);
  const candidates: Array<{ id: string; maxDistance: number; totalDistance: number }> = [];

  for (const [nodeId, trueDistance] of trueReachable) {
    if (nodeId === decisionId || !falseReachable.has(nodeId)) {
      continue;
    }

    const falseDistance = falseReachable.get(nodeId);
    if (typeof falseDistance !== "number") {
      continue;
    }

    candidates.push({
      id: nodeId,
      maxDistance: Math.max(trueDistance, falseDistance),
      totalDistance: trueDistance + falseDistance,
    });
  }

  candidates.sort((left, right) => {
    if (left.maxDistance !== right.maxDistance) {
      return left.maxDistance - right.maxDistance;
    }

    if (left.totalDistance !== right.totalDistance) {
      return left.totalDistance - right.totalDistance;
    }

    const leftNode = index.nodeMap.get(left.id);
    const rightNode = index.nodeMap.get(right.id);
    if (!leftNode || !rightNode) {
      return left.id.localeCompare(right.id);
    }

    return compareNodes(leftNode, rightNode);
  });

  return candidates[0]?.id ?? null;
}

function codeLines(texts: string[], owner: Omit<FlowchartCodeLine, "text"> = {}): FlowchartCodeLine[] {
  return texts.map((text) => ({ text, ...owner }));
}

function indentLines(lines: FlowchartCodeLine[], indentUnit: string): FlowchartCodeLine[] {
  return lines.map((line) => (line.text.length > 0 ? { ...line, text: `${indentUnit}${line.text}` } : line));
}

function getNextLinearTarget(index: GraphIndex, nodeId: string): string | null {
  return (index.outgoing.get(nodeId) ?? [])[0]?.target ?? null;
}

function negateConditionText(condition: string, dialect: FlowchartDialect): string {
  const trimmed = condition.trim();
  const wrappedMatch = trimmed.match(/^NOT\s*\((.+)\)$/i);
  if (wrappedMatch && hasBalancedParentheses(wrappedMatch[1])) {
    return wrappedMatch[1].trim();
  }

  return `${dialect.not} (${trimmed})`;
}

const EMPTY_EMIT: EmitResult = {
  lines: [],
  visited: new Set<string>(),
  soleIfId: null,
  blockCount: 0,
  firstId: null,
  statementCount: 0,
  hasMarker: false,
};

function blankLines(count: number | undefined): FlowchartCodeLine[] {
  return Array.from({ length: Math.min(1000, Math.max(0, Math.floor(Number(count) || 0))) }, () => ({ text: "" }));
}

/** A CASE option holds exactly one statement, so only such a branch can be written as one. */
function isSingleStatement(result: EmitResult): boolean {
  return result.statementCount === 1 && !result.hasMarker;
}

function emitLoop(
  context: EmitContext,
  node: Node,
  loopHandle: "true" | "false",
  bodyLines: FlowchartCodeLine[],
): FlowchartCodeLine[] {
  const { dialect, indentUnit } = context;
  const nodeData = node.data as FlowchartNodeData;
  const baseCondition = getNodePrimaryText(nodeData) || "Condition";
  const body = [...indentLines(bodyLines, indentUnit), ...blankLines(nodeData.sourceForm?.blankLinesBeforeEnd)];
  const test = { testId: node.id };

  if (nodeData.controlKind === "for") {
    const iterator =
      forIteratorOf(baseCondition) ??
      (typeof nodeData.forIterator === "string" ? nodeData.forIterator.trim() : "");
    const form = nodeData.sourceForm?.kind === "for" ? nodeData.sourceForm : null;
    // A NEXT line follows the iterator in the header, so renaming it in the inspector keeps the loop valid.
    const endLine = form?.endLine
      ? form.endLine.replace(NEXT_WITH_ITERATOR_RE, (next, keyword: string) => (iterator ? `${keyword}${iterator}` : next))
      : dialect.endFor(iterator);
    return [{ text: formatLine(nodeData, "for", baseCondition, dialect), ...test }, ...body, { text: endLine }];
  }

  const form = nodeData.sourceForm;
  if (form?.kind === "until") {
    // `loop until` runs its body while the condition is false.
    const condition = loopHandle === "false" ? baseCondition : negateConditionText(baseCondition, dialect);
    return [
      { text: `${form.prefix}${condition}${form.suffix}${form.comment}`, ...test },
      ...body,
      { text: form.endLine ?? dialect.endWhile },
    ];
  }

  const condition = loopHandle === "true" ? baseCondition : negateConditionText(baseCondition, dialect);
  const endLine = form?.kind === "while" ? form.endLine : undefined;
  return [
    { text: formatLine(nodeData, "while", condition, dialect), ...test },
    ...body,
    { text: endLine ?? dialect.endWhile },
  ];
}

function emitRepeat(
  context: EmitContext,
  decision: Node,
  backEdge: Edge,
  bodyLines: FlowchartCodeLine[],
): FlowchartCodeLine[] {
  const { dialect, indentUnit } = context;
  const data = decision.data as FlowchartNodeData;
  const form = data.sourceForm?.kind === "repeat" ? data.sourceForm : undefined;
  const baseCondition = getNodePrimaryText(data) || "Condition";
  // UNTIL ends the loop when its condition is true, so a loop back on Yes negates it.
  const condition = backEdge.sourceHandle === "true" ? negateConditionText(baseCondition, dialect) : baseCondition;
  return [
    ...blankLines(data.blankLinesBefore),
    { text: form?.startLine ?? dialect.repeatStart ?? CAMBRIDGE_DIALECT.repeatStart ?? "REPEAT" },
    ...indentLines(bodyLines, indentUnit),
    ...blankLines(form?.blankLinesBeforeEnd),
    {
      text: `${form?.prefix ?? dialect.forms.repeat.prefix}${condition}${form?.comment ?? ""}`,
      testId: decision.id,
    },
  ];
}

function emitIf(
  context: EmitContext,
  node: Node,
  trueLines: FlowchartCodeLine[],
  falseBranch: EmitResult,
  falseStartId: string | null,
  emitElse: boolean,
): FlowchartCodeLine[] {
  const { dialect, index, indentUnit } = context;
  const nodeData = node.data as FlowchartNodeData;
  // A loop whose back edge was removed is written as an IF, so its saved loop lines don't apply.
  const form =
    nodeData.sourceForm?.kind === "if" || nodeData.sourceForm?.kind === "elseif" ? nodeData.sourceForm : undefined;
  const header = formatLine(nodeData, "if", getNodePrimaryText(nodeData) || "Condition", dialect);
  const lines: FlowchartCodeLine[] = [{ text: header, testId: node.id }, ...indentLines(trueLines, indentUnit)];
  const chained = falseStartId ? (index.nodeMap.get(falseStartId)?.data as FlowchartNodeData | undefined) : undefined;
  // CASE options that can't be written as a CASE are written as an ELSEIF chain.
  const chainsAsElseIf = Boolean(chained?.elseIf || (chained?.controlKind === "case" && !chained.caseStart));

  if (chained && falseStartId && chainsAsElseIf && !chained.blankLinesBefore && falseBranch.soleIfId === falseStartId) {
    // The false branch is one IF that was written as ELSEIF: fold it back into this block,
    // swapping its IF header for the ELSEIF form and sharing this block's closing line.
    const chainedHeader = formatLine(chained, "elseif", getNodePrimaryText(chained) || "Condition", dialect);
    lines.push(
      ...blankLines(form?.blankLinesBeforeElse),
      { text: chainedHeader, testId: falseStartId },
      ...falseBranch.lines.slice(1, -1),
    );
  } else if (emitElse) {
    lines.push(
      ...blankLines(form?.blankLinesBeforeElse),
      { text: form?.elseLine ?? dialect.elseLine },
      ...indentLines(falseBranch.lines, indentUnit),
    );
  }

  lines.push(...blankLines(form?.blankLinesBeforeEnd), { text: form?.endLine ?? dialect.endIf });
  return lines;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The condition a CASE option tests. A subject such as `A OR B` is bracketed so the condition, and
 * the IF it becomes if the chain can't stay a CASE, still compares the whole subject.
 */
function caseCondition(subject: string, value: string, dialect: FlowchartDialect): string {
  return `${hasTopLevelOperator(subject) ? `(${subject})` : subject} ${dialect.equals} ${value}`;
}

/** Whether text outside strings and brackets has a comparison or logical operator. */
function hasTopLevelOperator(text: string): boolean {
  let depth = 0;
  let quote: string | null = null;
  let outside = "";
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      outside += " ";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "(" || character === "[") {
      depth += 1;
    } else if (character === ")" || character === "]") {
      depth -= 1;
    }
    outside += depth === 0 ? character : " ";
  }
  return /[=<>≠≤≥!]|\b(?:and|or|not)\b/i.test(outside);
}

/**
 * The value of a CASE option from its condition, or null once the condition is anything other than
 * `Subject = value`, such as `Subject = 1 OR Other`, which a CASE label can't express.
 */
function readCaseValue(condition: string, subject: string): string | null {
  const tested = escapeRegExp(subject.trim());
  const match = new RegExp(`^(?:${tested}|\\(\\s*${tested}\\s*\\))\\s*==?\\s*(.+)$`).exec(condition.trim());
  return match && !hasTopLevelOperator(match[1]) ? match[1] : null;
}

/** One option of a CASE: its label, then its statement on the same line or indented below. */
function emitCaseClause(
  context: EmitContext,
  label: string,
  inline: boolean,
  comment: string,
  body: FlowchartCodeLine[],
  testId: string | undefined,
): FlowchartCodeLine[] {
  if (inline && body.length === 1) {
    return [{ ...body[0], text: `${label}${body[0].text}`, testId }];
  }
  return [{ text: `${label.trimEnd()}${comment}`, testId }, ...indentLines(body, context.indentUnit)];
}

/**
 * Writes a chain of CASE options back as a CASE. Returns null when the chain no longer fits one,
 * such as an option holding two statements or a condition that tests something else; the chain is
 * then written as IF / ELSEIF.
 */
function emitCase(
  context: EmitContext,
  head: Node,
  mergeId: string | null,
  stopIds: ReadonlySet<string>,
  globallyVisited: ReadonlySet<string>,
  activePath: ReadonlySet<string>,
): { lines: FlowchartCodeLine[]; visited: Set<string> } | null {
  const { index, dialect, indentUnit } = context;
  const headData = head.data as FlowchartNodeData;
  const subject = headData.caseSubject ?? "";
  const headForm = headData.sourceForm?.kind === "case" ? headData.sourceForm : undefined;
  if (!subject.trim()) {
    return null;
  }

  const arms: Node[] = [head];
  let falseEdge = getDecisionBranchEdges(index, head.id).falseEdge;
  while (falseEdge && falseEdge.target !== mergeId) {
    const next = index.nodeMap.get(falseEdge.target);
    const data = next?.data as FlowchartNodeData | undefined;
    if (
      !next ||
      !data ||
      data.type !== "decision" ||
      data.controlKind !== "case" ||
      data.caseStart ||
      data.caseSubject !== subject ||
      (index.incoming.get(next.id) ?? []).length !== 1 ||
      arms.includes(next) ||
      stopIds.has(next.id) ||
      globallyVisited.has(next.id) ||
      activePath.has(next.id)
    ) {
      break;
    }
    arms.push(next);
    falseEdge = getDecisionBranchEdges(index, next.id).falseEdge;
  }
  const otherwiseId = falseEdge && falseEdge.target !== mergeId ? falseEdge.target : null;

  // Writing a branch can place a routine; a chain that falls back to IF writes its branches again.
  const anchorsBefore = new Set(context.emittedAnchors);
  const fail = () => {
    context.emittedAnchors = anchorsBefore;
    return null;
  };
  const visited = new Set(arms.map((arm) => arm.id));
  const branchPath = new Set([...activePath, ...visited]);
  const branchStopIds = mergeId ? new Set([...stopIds, mergeId]) : stopIds;
  const emitBranch = (startId: string) => {
    const branch = emitSequence(context, startId, branchStopIds, globallyVisited, branchPath);
    for (const id of branch.visited) {
      visited.add(id);
    }
    return isSingleStatement(branch) ? branch : null;
  };

  const lines: FlowchartCodeLine[] = [
    { text: headForm?.startLine ?? dialect.caseHeader(subject) },
    ...blankLines(headForm?.blankLinesAfterStart),
  ];
  for (const arm of arms) {
    const data = arm.data as FlowchartNodeData;
    const value = readCaseValue(getNodePrimaryText(data), subject);
    const trueTarget = getDecisionBranchEdges(index, arm.id).trueEdge?.target ?? null;
    if (value === null || !trueTarget || trueTarget === mergeId) {
      return fail();
    }
    const branch = emitBranch(trueTarget);
    if (!branch) {
      return fail();
    }
    const form = data.sourceForm?.kind === "case" ? data.sourceForm : undefined;
    const label = `${form?.prefix ?? dialect.forms.case.prefix}${value}${form?.suffix ?? dialect.forms.case.suffix}`;
    lines.push(
      ...(arm === head ? [] : blankLines(data.blankLinesBefore)),
      ...indentLines(
        emitCaseClause(context, label, form ? Boolean(form.inline) : dialect.otherwise.inline, form?.comment ?? "", branch.lines, arm.id),
        indentUnit,
      ),
    );
  }

  if (otherwiseId) {
    const branch = emitBranch(otherwiseId);
    if (!branch) {
      return fail();
    }
    const lastData = arms[arms.length - 1].data as FlowchartNodeData;
    const lastForm = lastData.sourceForm?.kind === "case" ? lastData.sourceForm : undefined;
    const label = lastForm?.otherwiseLabel ?? dialect.otherwise.label;
    const inline = lastForm?.otherwiseLabel !== undefined ? Boolean(lastForm.otherwiseInline) : dialect.otherwise.inline;
    lines.push(
      ...blankLines(lastForm?.blankLinesBeforeElse),
      ...indentLines(emitCaseClause(context, label, inline, "", branch.lines, undefined), indentUnit),
    );
  }

  lines.push(...blankLines(headForm?.blankLinesBeforeEnd), { text: headForm?.endLine ?? dialect.endCase });
  return { lines, visited };
}

/** The REPEAT loop that starts at `entryId`, choosing the outermost when several loops start there. */
function findRepeatAt(
  context: EmitContext,
  entryId: string,
  stopIds: ReadonlySet<string>,
  globallyVisited: ReadonlySet<string>,
  activePath: ReadonlySet<string>,
): { decision: Node; backEdge: Edge } | null {
  const { index } = context;
  const blockedIds = new Set([...stopIds, ...activePath]);
  const candidates = (index.repeatEntries.get(entryId) ?? []).filter(
    (edge) =>
      !stopIds.has(edge.source) &&
      !globallyVisited.has(edge.source) &&
      !activePath.has(edge.source) &&
      branchReachesNode(index, entryId, edge.source, blockedIds),
  );
  const outer =
    candidates.find((candidate) =>
      candidates.every((other) => other === candidate || branchReachesNode(index, other.source, candidate.source, blockedIds)),
    ) ?? candidates[0];
  const decision = outer ? index.nodeMap.get(outer.source) : undefined;
  return outer && decision ? { decision, backEdge: outer } : null;
}

/**
 * Writes the routines that belong before `nodeId`. Only a top-level sequence places them: a routine
 * whose block was moved into a branch or loop goes to the top of the file instead, since routines
 * can't be declared inside a block.
 */
function emitRoutinesBefore(
  context: EmitContext,
  nodeId: string,
  lines: FlowchartCodeLine[],
  topLevel: boolean,
): void {
  if (!topLevel) {
    return;
  }
  const routines = context.routinesBefore.get(nodeId);
  if (!routines || context.emittedAnchors.has(nodeId)) {
    return;
  }
  context.emittedAnchors.add(nodeId);
  for (const routine of routines) {
    lines.push(...routine);
  }
}

function emitSequence(
  context: EmitContext,
  startId: string | null,
  stopIds: ReadonlySet<string>,
  globallyVisited: ReadonlySet<string>,
  activePath: ReadonlySet<string> = new Set(),
): EmitResult {
  const { index, dialect } = context;
  const lines: FlowchartCodeLine[] = [];
  const visited = new Set<string>();
  let currentId = startId;
  let blockCount = 0;
  let statementCount = 0;
  let hasMarker = false;
  let firstId: string | null = null;
  let soleIfId: string | null = null;

  while (currentId && !stopIds.has(currentId) && !visited.has(currentId)) {
    if (globallyVisited.has(currentId) || activePath.has(currentId)) {
      break;
    }

    const node = index.nodeMap.get(currentId);
    if (!node) {
      break;
    }

    const nodeData = node.data as FlowchartNodeData;
    // Nested sequences always stop somewhere or sit on a decision's path; the top level does neither.
    emitRoutinesBefore(context, node.id, lines, stopIds.size === 0 && activePath.size === 0);
    blockCount += 1;
    firstId ??= node.id;

    // A REPEAT starts at its body's first block, so it is found before that block is written.
    const repeat = findRepeatAt(context, node.id, stopIds, globallyVisited, activePath);
    if (repeat) {
      const { decision, backEdge } = repeat;
      const body =
        decision.id === node.id
          ? EMPTY_EMIT
          : emitSequence(context, node.id, new Set([...stopIds, decision.id]), globallyVisited, activePath);
      lines.push(...emitRepeat(context, decision, backEdge, body.lines));
      for (const visitedId of body.visited) {
        visited.add(visitedId);
      }
      visited.add(decision.id);
      statementCount += 1;
      const { trueEdge, falseEdge } = getDecisionBranchEdges(index, decision.id);
      currentId = (backEdge.sourceHandle === "true" ? falseEdge : trueEdge)?.target ?? null;
      continue;
    }

    lines.push(...blankLines(nodeData.blankLinesBefore));

    if (nodeData.type === "decision") {
      statementCount += 1;
      const { trueEdge, falseEdge } = getDecisionBranchEdges(index, node.id);
      const trueStartId = trueEdge?.target ?? null;
      const falseStartId = falseEdge?.target ?? null;
      const blockedIds = new Set([...stopIds, ...activePath]);
      const trueLoops = branchReachesNode(index, trueStartId, node.id, blockedIds);
      const falseLoops = branchReachesNode(index, falseStartId, node.id, blockedIds);
      const nextActivePath = new Set(activePath);
      nextActivePath.add(node.id);
      visited.add(node.id);

      if (trueLoops !== falseLoops) {
        const loopHandle = trueLoops ? "true" : "false";
        const loopStartId = loopHandle === "true" ? trueStartId : falseStartId;
        const exitStartId = loopHandle === "true" ? falseStartId : trueStartId;
        const loopBody =
          loopStartId && loopStartId !== node.id
            ? emitSequence(context, loopStartId, new Set([...stopIds, node.id]), globallyVisited, nextActivePath)
            : EMPTY_EMIT;

        lines.push(...emitLoop(context, node, loopHandle, loopBody.lines));
        for (const visitedId of loopBody.visited) {
          visited.add(visitedId);
        }
        currentId = exitStartId;
        continue;
      }

      const mergeNodeId = findDecisionMergeNode(index, node.id, trueStartId, falseStartId, stopIds);

      if (nodeData.controlKind === "case" && nodeData.caseStart) {
        const caseBlock = emitCase(context, node, mergeNodeId, stopIds, globallyVisited, activePath);
        if (caseBlock) {
          lines.push(...caseBlock.lines);
          for (const visitedId of caseBlock.visited) {
            visited.add(visitedId);
          }
          currentId = mergeNodeId;
          continue;
        }
      }

      const branchStopIds = mergeNodeId ? new Set([...stopIds, mergeNodeId]) : stopIds;
      const trueBranch =
        trueStartId && trueStartId !== mergeNodeId
          ? emitSequence(context, trueStartId, branchStopIds, globallyVisited, nextActivePath)
          : EMPTY_EMIT;
      const falseBranch =
        falseStartId && falseStartId !== mergeNodeId
          ? emitSequence(context, falseStartId, branchStopIds, globallyVisited, nextActivePath)
          : EMPTY_EMIT;

      for (const visitedId of trueBranch.visited) {
        visited.add(visitedId);
      }
      for (const visitedId of falseBranch.visited) {
        visited.add(visitedId);
      }

      const emitElse =
        Boolean(nodeData.hasElseBranch) ||
        falseBranch.lines.length > 0 ||
        (Boolean(falseStartId) && falseStartId !== mergeNodeId);

      lines.push(...emitIf(context, node, trueBranch.lines, falseBranch, falseStartId, emitElse));
      if (blockCount === 1) {
        soleIfId = node.id;
      }

      currentId = mergeNodeId;
      continue;
    }

    const nodeLines = buildNodeLines(nodeData, dialect);
    lines.push(...codeLines(nodeLines, { nodeId: node.id }));
    if (nodeData.type === "terminator") {
      hasMarker ||= nodeLines.length > 0;
    } else {
      statementCount += nodeLines.filter((line) => line.trim().length > 0).length;
    }
    visited.add(node.id);
    currentId = getNextLinearTarget(index, node.id);
  }

  return {
    lines,
    visited,
    soleIfId: blockCount === 1 ? soleIfId : null,
    blockCount,
    firstId,
    statementCount,
    hasMarker,
  };
}

/** A procedure or function: its header, the blocks after its Start, and its closing line. */
function emitRoutine(context: EmitContext, start: Node, globallyVisited: ReadonlySet<string>) {
  const { index, dialect, indentUnit } = context;
  const data = start.data as FlowchartNodeData;
  const routine = data.routine ?? "procedure";
  const form = data.sourceForm?.kind === "routine" ? data.sourceForm : undefined;
  const firstId = getNextLinearTarget(index, start.id);
  const body = firstId ? emitSequence(context, firstId, new Set(), globallyVisited) : EMPTY_EMIT;
  const endId = [...body.visited].find(
    (id) => (index.nodeMap.get(id)?.data as FlowchartNodeData | undefined)?.routineEnd,
  );
  const header = data.label.trim() || (routine === "function" ? "FUNCTION Name()" : "PROCEDURE Name()");
  return {
    visited: body.visited,
    lines: [
      ...blankLines(data.blankLinesBefore),
      { text: `${header}${form?.comment ?? ""}`, nodeId: start.id },
      ...indentLines(body.lines, indentUnit),
      ...blankLines(form?.blankLinesBeforeEnd),
      { text: form?.endLine ?? dialect.endRoutine(routine), nodeId: endId },
    ],
  };
}

function trimBlankLines(lines: FlowchartCodeLine[]): FlowchartCodeLine[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].text.trim().length === 0) {
    start += 1;
  }
  while (end > start && lines[end - 1].text.trim().length === 0) {
    end -= 1;
  }
  return lines.slice(start, end);
}

/**
 * Generates code from the flowchart, with the block each line belongs to. The line map is what lets
 * a traced run, which reports line numbers, light up the matching blocks.
 */
export function generatePseudocodeWithLineMap(
  nodes: Node[],
  edges: Edge[],
  style: FlowchartCodeStyle = {},
): { code: string; lines: FlowchartCodeLine[] } {
  const sortedNodes = [...nodes].sort(compareNodes);
  if (sortedNodes.length === 0) {
    return { code: "", lines: [] };
  }

  const dialect = getDialect(style.syntaxId);
  const index = buildGraphIndex(nodes, edges, dialect);
  const context: EmitContext = {
    index,
    dialect,
    indentUnit: style.indentUnit || DEFAULT_INDENT_UNIT,
    routinesBefore: new Map(),
    emittedAnchors: new Set(),
  };
  const visited = new Set<string>();

  // Routines are written first so the main flow can place each one before the block it preceded.
  const routineStarts = sortedNodes
    .filter((node) => {
      const data = node.data as FlowchartNodeData;
      return data.type === "terminator" && Boolean(data.routine);
    })
    .sort(
      (left, right) =>
        ((left.data as FlowchartNodeData).routineOrder ?? 0) - ((right.data as FlowchartNodeData).routineOrder ?? 0) ||
        compareNodes(left, right),
    );
  const routines: Array<{ anchor?: string; lines: FlowchartCodeLine[] }> = [];
  for (const start of routineStarts) {
    visited.add(start.id);
    const routine = emitRoutine(context, start, visited);
    for (const visitedId of routine.visited) {
      visited.add(visitedId);
    }
    routines.push({ anchor: (start.data as FlowchartNodeData).routineAnchor, lines: routine.lines });
  }
  for (const routine of routines) {
    if (routine.anchor && index.nodeMap.has(routine.anchor) && !visited.has(routine.anchor)) {
      context.routinesBefore.set(routine.anchor, [...(context.routinesBefore.get(routine.anchor) ?? []), routine.lines]);
    }
  }

  const lines: FlowchartCodeLine[] = [];
  const startCandidates = [
    ...sortedNodes.filter((node) => isStartNode(node.data as FlowchartNodeData)),
    ...sortedNodes.filter((node) => (index.incoming.get(node.id) ?? []).length === 0),
    ...sortedNodes,
  ];

  for (const candidate of startCandidates) {
    if (visited.has(candidate.id)) {
      continue;
    }

    const emitted = emitSequence(context, candidate.id, new Set(), visited);
    lines.push(...emitted.lines);
    for (const visitedId of emitted.visited) {
      visited.add(visitedId);
    }
  }

  // A routine whose block was deleted goes at the top, where routines usually are.
  const unplaced = routines.filter((routine) => !routine.anchor || !context.emittedAnchors.has(routine.anchor));
  const trimmed = trimBlankLines([...unplaced.flatMap((routine) => routine.lines), ...lines]);
  return { code: trimmed.map((line) => line.text).join("\n"), lines: trimmed };
}

export function generatePseudocodeFromFlowchart(nodes: Node[], edges: Edge[], style: FlowchartCodeStyle = {}): string {
  return generatePseudocodeWithLineMap(nodes, edges, style).code;
}

export function getDecisionEdgeLabel(
  connection: Pick<Connection, "sourceHandle">,
  data: FlowchartNodeData,
): string | undefined {
  if (data.type !== "decision") {
    return undefined;
  }

  if (connection.sourceHandle === "true") {
    return data.trueLabel || "Yes";
  }

  if (connection.sourceHandle === "false") {
    return data.falseLabel || "No";
  }

  return undefined;
}
