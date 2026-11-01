import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { buildFlowchartFromPseudocode, generatePseudocodeWithLineMap } from "./model";
import { buildFlowchartRunSteps, indexFlowchartRunVisits, type FlowchartRunStep } from "./runSteps";

/** Run with FLOWCHART_BENCHMARK=1 pnpm --filter @pseudoeditor/web exec vitest run src/app/components/flowchart/performance.test.ts */
describe("large flowcharts", () => {
  it("round-trips sequential branches and maps their traced execution", () => {
    const count = process.env.FLOWCHART_BENCHMARK ? 500 : 80;
    const source = Array.from({ length: count }, (_, i) => [
      `IF ${i} > 0 THEN`,
      `    OUTPUT ${i}`,
      "ELSE",
      `    OUTPUT ${-i}`,
      "ENDIF",
    ].join("\n")).join("\n");
    const graph = buildFlowchartFromPseudocode(source);
    const run = {
      source,
      steps: Array.from({ length: count }, (_, i) => [
        { line: i * 5 + 1, output: i, test: true, taken: i > 0 },
        { line: i * 5 + (i > 0 ? 2 : 4), output: i },
      ]).flat(),
      output: Array.from({ length: count }, (_, i) => String(i)),
      completed: true,
      truncated: false,
    };
    const rounds = process.env.FLOWCHART_BENCHMARK ? 7 : 1;
    const generation: number[] = [];
    const replay: number[] = [];
    for (let i = 0; i < rounds; i += 1) {
      const beforeGeneration = performance.now();
      const generated = generatePseudocodeWithLineMap(graph.nodes, graph.edges);
      generation.push(performance.now() - beforeGeneration);
      expect(generated.code).toBe(source);
      const beforeReplay = performance.now();
      const steps = buildFlowchartRunSteps(graph.nodes, graph.edges, {}, run);
      replay.push(performance.now() - beforeReplay);
      expect(steps).toHaveLength(count * 2 + 2);
      expect(steps!.slice(1).every((step) => step.edgeIds.length > 0)).toBe(true);
    }
    if (process.env.FLOWCHART_BENCHMARK) {
      const median = (samples: number[]) => [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
      console.log(JSON.stringify({ workload: "500 sequential IF/ELSE branches, 1502 nodes, 2001 edges, 1000 trace events", rounds, generationMs: median(generation), replayMs: median(replay), generation, replay }));
    }
  });
});


describe("replay visit indexing", () => {
  it("matches replay history when seeking forward and backward through repeated loops", () => {
    const steps: FlowchartRunStep[] = [
      { nodeId: "start", edgeIds: [], output: 0 },
      { nodeId: "test", edgeIds: ["begin"], output: 0 },
      { nodeId: "body", edgeIds: ["yes"], output: 1 },
      { nodeId: "test", edgeIds: ["back"], output: 1 },
      { nodeId: "body", edgeIds: ["yes"], output: 2 },
      { nodeId: "test", edgeIds: ["back"], output: 2 },
      { nodeId: "end", edgeIds: ["no"], output: 2 },
    ];
    const visits = indexFlowchartRunVisits(steps);
    for (const position of [0, 6, 3, 1, 5, 2, 0]) {
      const history = steps.slice(0, position + 1);
      expect(new Set([...visits.nodes].filter(([, first]) => first <= position).map(([id]) => id)))
        .toEqual(new Set(history.map((step) => step.nodeId)));
      expect(new Set([...visits.edges].filter(([, first]) => first <= position).map(([id]) => id)))
        .toEqual(new Set(history.flatMap((step) => step.edgeIds)));
    }
  });

  it.skipIf(!process.env.FLOWCHART_BENCHMARK)("measures visiting 4000 replay steps of a repeated loop", () => {
    const steps = Array.from({ length: 4000 }, (_, index) => ({
      nodeId: `node-${index % 8}`,
      edgeIds: [`edge-${index % 8}`],
      output: index,
    }));
    const nodeIds = Array.from({ length: 8 }, (_, index) => `node-${index}`);
    const edgeIds = Array.from({ length: 8 }, (_, index) => `edge-${index}`);
    let previousCount = 0;
    const before = performance.now();
    for (let position = 0; position < steps.length; position += 1) {
      const history = steps.slice(0, position + 1);
      const nodes = new Set(history.map((step) => step.nodeId));
      const edges = new Set(history.flatMap((step) => step.edgeIds));
      previousCount += nodeIds.filter((id) => nodes.has(id)).length + edgeIds.filter((id) => edges.has(id)).length;
    }
    const historyMs = performance.now() - before;
    let indexedCount = 0;
    const after = performance.now();
    const visits = indexFlowchartRunVisits(steps);
    for (let position = 0; position < steps.length; position += 1) {
      indexedCount += nodeIds.filter((id) => (visits.nodes.get(id) ?? Infinity) <= position).length
        + edgeIds.filter((id) => (visits.edges.get(id) ?? Infinity) <= position).length;
    }
    const indexedMs = performance.now() - after;
    expect(indexedCount).toBe(previousCount);
    console.log(JSON.stringify({ workload: "4000 replay positions, eight blocks and eight arrows in a loop", historyMs, indexedMs, previousCount, indexedCount }));
  });
});
