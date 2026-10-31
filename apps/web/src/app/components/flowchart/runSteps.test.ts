import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Node } from "@xyflow/react";
import { compilePseudocode } from "@/compiler";
import type { RunResult } from "@/compiler/types";
import initRuntime, { run_pseudocode } from "@/runtime/wasm/pkg/pseudocode_runtime";
import { buildFlowchartFromPseudocode, getNodePrimaryText, inferIndentUnit } from "@/app/components/flowchart/model";
import { buildFlowchartRunSteps } from "@/app/components/flowchart/runSteps";
import type { FlowchartNodeData } from "@/app/components/flowchart/types";

beforeAll(async () => {
  const wasmBytes = await readFile(path.join(process.cwd(), "src/runtime/wasm/pkg/pseudocode_runtime_bg.wasm"));
  await initRuntime({ module_or_path: wasmBytes });
});

function traceRun(source: string, syntaxId = "cambridge-igcse", stdinLines: string[] = []) {
  const compiled = compilePseudocode({ source, filename: "main.pseudo", strict: true, syntaxId });
  expect(compiled.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
  const result = JSON.parse(
    run_pseudocode(
      JSON.stringify({ ast_json: compiled.astJson, stdin_lines: stdinLines, virtual_files: {}, trace: true }),
    ),
  ) as RunResult;
  const graph = buildFlowchartFromPseudocode(source, syntaxId);
  const run = {
    source,
    steps: result.trace ?? [],
    output: result.stdout.length > 0 ? result.stdout.split("\n") : [],
    completed: result.success,
    truncated: Boolean(result.traceTruncated),
  };
  const steps = buildFlowchartRunSteps(graph.nodes, graph.edges, { syntaxId, indentUnit: inferIndentUnit(source) }, run);
  const describeNode = (nodeId: string) => {
    const data = graph.nodes.find((node: Node) => node.id === nodeId)?.data as FlowchartNodeData;
    return data.type === "process" ? (data.statements ?? []).join(" / ") : getNodePrimaryText(data);
  };
  return { graph, result, steps, path: steps?.map((step) => describeNode(step.nodeId)) ?? null };
}

describe("replaying a run on the flowchart", () => {
  it("walks a REPEAT loop, a CASE, and a procedure block by block", () => {
    const source = [
      "DECLARE Count : INTEGER",
      "PROCEDURE Shout(Word : STRING)",
      "    OUTPUT Word",
      "ENDPROCEDURE",
      "Count <- 0",
      "REPEAT",
      "    Count <- Count + 1",
      "UNTIL Count >= 2",
      "CASE OF Count",
      "    1 : OUTPUT \"One\"",
      "    2 : CALL Shout(\"Two\")",
      "ENDCASE",
    ].join("\n");

    const { path, steps, result } = traceRun(source);
    expect(result.stdout).toBe("Two");
    expect(path).toEqual([
      "Start",
      "DECLARE Count : INTEGER",
      "Count <- 0",
      "Count <- Count + 1",
      "Count >= 2",
      "Count <- Count + 1",
      "Count >= 2",
      "Count = 1",
      "Count = 2",
      'Shout("Two")',
      "PROCEDURE Shout(Word : STRING)",
      "Word",
      "Return",
      "End",
    ]);
    // Each step follows an arrow, except for the jumps into and out of the procedure's own chart.
    expect(steps?.map((step) => step.edgeIds.length > 0)).toEqual([
      false, true, true, true, true, true, true, true, true, true, false, true, true, false,
    ]);
    expect(steps?.at(-1)?.output).toBe(1);
  });

  it("follows loops tested at the top in each syntax", () => {
    expect(
      traceRun("X = 0\nloop until X > 1\n    X = X + 1\nend loop\noutput X", "ib-dp").path,
    ).toEqual(["Start", "X = 0", "X > 1", "X = X + 1", "X > 1", "X = X + 1", "X > 1", "X", "End"]);
    expect(traceRun("for i = 1 to 2\n    print(i)\nnext i", "ocr-gcse").path).toEqual([
      "Start", "i = 1 to 2", "i", "i = 1 to 2", "i", "i = 1 to 2", "End",
    ]);
  });

  it("stops on the block that failed", () => {
    const { steps, path } = traceRun("DECLARE A : ARRAY[1:2] OF INTEGER\nOUTPUT \"before\"\nA[5] <- 1\nOUTPUT \"after\"");
    expect(path?.at(-1)).toContain("A[5] <- 1");
    expect(steps?.at(-1)?.output).toBe(1);
  });

  it("refuses to replay once the flowchart no longer matches the code that ran", () => {
    const source = "OUTPUT 1\nOUTPUT 2";
    const { graph, result } = traceRun(source);
    const run = { source: "OUTPUT 1\nOUTPUT 3", steps: result.trace ?? [], output: ["1", "2"], completed: true, truncated: false };
    expect(buildFlowchartRunSteps(graph.nodes, graph.edges, {}, run)).toBeNull();
  });
});
