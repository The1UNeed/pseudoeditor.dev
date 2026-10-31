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
    errorLine: result.success ? undefined : result.diagnostics[0]?.line,
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

  it("stops on a FOR whose header fails, and keeps a cut-off trace's output to its last step", () => {
    const failing = traceRun("DECLARE Zero : INTEGER\nDECLARE I : INTEGER\nZero <- 0\nFOR I <- 1 TO 10 DIV Zero\n    OUTPUT I\nNEXT I");
    expect(failing.result.success).toBe(false);
    expect(failing.path?.at(-1)).toBe("I <- 1 TO 10 DIV Zero");

    const long = traceRun("DECLARE I : INTEGER\nFOR I <- 1 TO 3000\n    OUTPUT I\nNEXT I");
    expect(long.result.traceTruncated).toBe(true);
    const last = long.steps!.at(-1)!;
    expect(last.output).toBeLessThan(3000);
    expect(last.output).toBe(long.result.trace!.at(-1)!.output);
  });

  it("shows the right output line when an earlier output held a line break", () => {
    const { steps, result } = traceRun('OUTPUT "a", CHR(10), "b"\nOUTPUT "c"\nOUTPUT "d"', "cambridge-alevel");
    const output = result.stdout.split("\n");
    expect(output).toEqual(["a", "b", "c", "d"]);
    // Start, then each OUTPUT; the second OUTPUT has written up to "c".
    expect(steps?.map((step) => output[step.output - 1] ?? null)).toEqual([null, "b", "c", "d", "d"]);
  });

  it("follows the branch an IF took even when neither branch runs a statement", () => {
    const source = 'IF FALSE THEN\n    // then\nELSE\n    // otherwise\nENDIF\nOUTPUT "after"';
    const { graph, steps, path } = traceRun(source);
    expect(path).toEqual(["Start", "FALSE", '"after"', "End"]);
    const followed = steps![2].edgeIds.map((id) => graph.edges.find((edge) => edge.id === id)!);
    expect(followed[0].sourceHandle).toBe("false");
  });

  it("ends a failed run on the block whose expression failed, not on a routine it had left", () => {
    const { result, path, steps } = traceRun(
      "FUNCTION Zero() RETURNS INTEGER\n    RETURN 0\nENDFUNCTION\nOUTPUT 1 DIV Zero()",
    );
    expect(result.success).toBe(false);
    expect(path?.slice(-3)).toEqual(["RETURN 0", "Return", "1 DIV Zero()"]);
    expect(steps?.at(-1)?.edgeIds).toEqual([]);
  });

  it("ends a run that failed in a CASE label's test on the option, not its statement", () => {
    const { result, path } = traceRun(
      'DECLARE Zero : INTEGER\nDECLARE A : INTEGER\nZero <- 0\nA <- 1\nCASE OF A\n    1 DIV Zero : OUTPUT "one"\n    OTHERWISE : OUTPUT "other"\nENDCASE',
    );
    expect(result.success).toBe(false);
    expect(path?.at(-1)).toBe("A = 1 DIV Zero");
  });

  it("steps back to the block that called a function, which then writes its output", () => {
    const { path, steps } = traceRun("FUNCTION F() RETURNS INTEGER\n    RETURN 7\nENDFUNCTION\nOUTPUT F()\nOUTPUT 8");
    expect(path).toEqual([
      "Start",
      "F()",
      "FUNCTION F() RETURNS INTEGER",
      "RETURN 7",
      "Return",
      "F()",
      "8",
      "End",
    ]);
    expect(steps?.map((step) => step.output)).toEqual([0, 0, 0, 0, 0, 1, 2, 2]);
  });

  it("steps back to a CALL whose argument called a function, then runs the procedure", () => {
    const { path } = traceRun(
      'FUNCTION F() RETURNS INTEGER\n    RETURN 7\nENDFUNCTION\nPROCEDURE P(N : INTEGER)\n    OUTPUT N\nENDPROCEDURE\nCALL P(F())\nOUTPUT 8',
    );
    expect(path).toEqual([
      "Start",
      "P(F())",
      "FUNCTION F() RETURNS INTEGER",
      "RETURN 7",
      "Return",
      "P(F())",
      "PROCEDURE P(N : INTEGER)",
      "N",
      "Return",
      "8",
      "End",
    ]);
  });

  it("doesn't jump to a failure the cut-off trace never reached", () => {
    const { result, path } = traceRun("DECLARE I : INTEGER\nFOR I <- 1 TO 3000\n    OUTPUT I\nNEXT I\nOUTPUT 1 DIV 0");
    expect(result.success).toBe(false);
    expect(result.traceTruncated).toBe(true);
    expect(path?.at(-1)).not.toBe("1 DIV 0");
  });

  it("refuses to replay once the flowchart no longer matches the code that ran", () => {
    const source = "OUTPUT 1\nOUTPUT 2";
    const { graph, result } = traceRun(source);
    const run = { source: "OUTPUT 1\nOUTPUT 3", steps: result.trace ?? [], output: ["1", "2"], completed: true, truncated: false };
    expect(buildFlowchartRunSteps(graph.nodes, graph.edges, {}, run)).toBeNull();
  });
});
