import type { Edge, Node } from "@xyflow/react";
import type { RunTraceStep } from "@/compiler/types";
import { generatePseudocodeWithLineMap, isEndNode, isStartNode, type FlowchartCodeStyle } from "./model";
import type { FlowchartNodeData } from "./types";

/** One block lit up while replaying a run. */
export interface FlowchartRunStep {
  nodeId: string;
  /** The arrows followed from the previous step's block; empty when the run jumps into or out of a routine. */
  edgeIds: string[];
  /** Lines of output written once this step has run. */
  output: number;
}

export interface FlowchartRunInput {
  source: string;
  steps: RunTraceStep[];
  output: string[];
  completed: boolean;
  truncated: boolean;
}

// Blocks with no runnable code, such as comments, sit between two steps on at most a few arrows.
const MAX_PATH_LENGTH = 12;

function findPath(outgoing: Map<string, Edge[]>, fromId: string, toId: string): string[] {
  const previous = new Map<string, Edge>();
  const queue: Array<{ id: string; depth: number }> = [{ id: fromId, depth: 0 }];
  const seen = new Set([fromId]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= MAX_PATH_LENGTH) {
      continue;
    }
    for (const edge of outgoing.get(current.id) ?? []) {
      if (edge.target === toId) {
        const path = [edge.id];
        for (let at = current.id; at !== fromId; ) {
          const step = previous.get(at);
          if (!step) {
            break;
          }
          path.unshift(step.id);
          at = step.source;
        }
        return path;
      }
      if (!seen.has(edge.target)) {
        seen.add(edge.target);
        previous.set(edge.target, edge);
        queue.push({ id: edge.target, depth: current.depth + 1 });
      }
    }
  }
  return [];
}

/**
 * Turns a traced run into the blocks it passed through. Returns null when the flowchart no longer
 * matches the code that ran, since the run's line numbers would then point at the wrong blocks.
 */
export function buildFlowchartRunSteps(
  nodes: Node[],
  edges: Edge[],
  style: FlowchartCodeStyle,
  run: FlowchartRunInput,
): FlowchartRunStep[] | null {
  const { lines } = generatePseudocodeWithLineMap(nodes, edges, style);
  const sourceLines = run.source.replace(/\r\n?/g, "\n").split("\n");
  // Generated code starts at the first non-blank line; indentation may differ, the lines may not.
  const offset = sourceLines.findIndex((line) => line.trim().length > 0);
  if (offset < 0 || lines.length === 0 || lines.length > sourceLines.length - offset) {
    return null;
  }
  for (let index = offset; index < sourceLines.length; index += 1) {
    if (sourceLines[index].trim() !== (lines[index - offset]?.text ?? "").trim()) {
      return null;
    }
  }

  const outgoing = new Map<string, Edge[]>();
  for (const edge of edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const start = sorted.find((node) => isStartNode(node.data as FlowchartNodeData));
  const end = sorted.find((node) => isEndNode(node.data as FlowchartNodeData));

  const steps: FlowchartRunStep[] = [];
  const visit = (nodeId: string, output: number) => {
    const previous = steps.at(-1);
    steps.push({ nodeId, edgeIds: previous ? findPath(outgoing, previous.nodeId, nodeId) : [], output });
  };

  if (start) {
    visit(start.id, 0);
  }
  let lastWasStatement = false;
  run.steps.forEach((event, index) => {
    const line = lines[event.line - 1 - offset];
    const nodeId = event.test ? (line?.testId ?? line?.nodeId) : (line?.nodeId ?? line?.testId);
    const output = run.steps[index + 1]?.output ?? run.output.length;
    if (!nodeId) {
      return;
    }
    const previous = steps.at(-1);
    // A process block runs its lines one after another; it is one step on the chart.
    if (!event.test && lastWasStatement && previous?.nodeId === nodeId) {
      previous.output = output;
      return;
    }
    lastWasStatement = !event.test;
    visit(nodeId, output);
  });
  if (run.completed && !run.truncated && end && steps.at(-1)?.nodeId !== end.id) {
    visit(end.id, run.output.length);
  }

  return steps;
}
