/**
 * IGCSE Flowchart Node Types
 * Based on Cambridge IGCSE Computer Science syllabus flowchart symbols
 */

export type FlowchartNodeType = 
  | 'terminator'      // Start/Stop - rounded rectangle
  | 'process'         // Process - rectangle
  | 'decision'        // Decision - diamond
  | 'inputOutput'     // Input/Output - parallelogram
  | 'subroutine';     // Subroutine - rectangle with side bars

export type FlowchartSourceFormKind = 'if' | 'elseif' | 'while' | 'for' | 'input' | 'output' | 'call';

/**
 * How a block was written in the source. Regenerating code from the flowchart reuses it so the
 * user's own keywords, spacing, and trailing comments survive a round trip in every exam syntax.
 */
export interface FlowchartSourceForm {
  kind: FlowchartSourceFormKind;
  /** Text before the block's content, such as `IF ` or `print(`. */
  prefix: string;
  /** Text after the block's content, such as ` THEN` or `)`. */
  suffix: string;
  /** Trailing comment on the block's first line, including the whitespace before it. */
  comment: string;
  /** The ELSE line of an IF, as written. */
  elseLine?: string;
  /** The closing line of an IF or loop, as written. */
  endLine?: string;
  /** Blank lines at the end of the first branch, before the ELSE or ELSEIF line. */
  blankLinesBeforeElse?: number;
  /** Blank lines at the end of the last branch or loop body, before the closing line. */
  blankLinesBeforeEnd?: number;
}

export interface FlowchartNodeData extends Record<string, unknown> {
  label: string;
  type: FlowchartNodeType;
  content?: string;
  // For decision nodes
  trueLabel?: string;
  falseLabel?: string;
  controlKind?: 'if' | 'while' | 'for';
  forIterator?: string;
  hasElseBranch?: boolean;
  /** An IF written as ELSEIF / ELSE IF directly after its parent's branch. */
  elseIf?: boolean;
  // For input/output
  ioType?: 'input' | 'output';
  // For process
  operation?: string;
  statements?: string[];
  // For subroutine
  subroutineName?: string;
  // Source round-tripping
  sourceForm?: FlowchartSourceForm;
  /** Blank lines in the source directly before this block. */
  blankLinesBefore?: number;
  /** A Start or End added for display that has no `// Start` or `// End` line in the source. */
  implicit?: boolean;
}

export interface FlowchartEdgeData {
  label?: string;
}

export const NODE_TYPE_CONFIG: Record<FlowchartNodeType, {
  label: string;
  description: string;
  shape: string;
  color: string;
  icon: string;
}> = {
  terminator: {
    label: 'Start / Stop',
    description: 'Beginning or end of the process',
    shape: 'rounded-rectangle',
    color: 'var(--flowchart-terminator)',
    icon: 'Play',
  },
  process: {
    label: 'Process',
    description: 'A visual block that can hold one or more steps',
    shape: 'rectangle',
    color: 'var(--flowchart-process)',
    icon: 'Cpu',
  },
  decision: {
    label: 'Decision',
    description: 'Yes/No or True/False branching',
    shape: 'diamond',
    color: 'var(--flowchart-decision)',
    icon: 'GitBranch',
  },
  inputOutput: {
    label: 'Input / Output',
    description: 'Read data in or write data out',
    shape: 'parallelogram',
    color: 'var(--flowchart-io)',
    icon: 'ArrowRightLeft',
  },
  subroutine: {
    label: 'Subroutine',
    description: 'Call to a separate procedure or function',
    shape: 'subroutine-rectangle',
    color: 'var(--flowchart-subroutine)',
    icon: 'Box',
  },
};

// Default node dimensions
export const NODE_DIMENSIONS = {
  terminator: { width: 160, height: 60 },
  process: { width: 220, height: 140 },
  decision: { width: 160, height: 120 },
  inputOutput: { width: 180, height: 80 },
  subroutine: { width: 180, height: 80 },
};
