import { describe, expect, it } from "vitest";
import { compilePseudocode } from "./index";
import { tokenize } from "./tokenizer";
import { parseSource } from "./parser";
import { analyzeProgram } from "./semantics";

// Opt in because wall-clock timings are evidence, not CI assertions.
// COMPILER_BENCHMARK=1 pnpm --filter @pseudoeditor/compiler exec vitest run src/performance.test.ts --reporter verbose
const benchmark = process.env.COMPILER_BENCHMARK ? describe : describe.skip;
const arithmeticSource = `DECLARE Total : INTEGER\n${Array.from({ length: 2000 }, (_, i) =>
  `Total <- Total + ${i}\nIF Total > ${i} THEN\nOUTPUT "Total is ", Total\nENDIF`,
).join("\n")}`;

const fileSource = `${Array.from({ length: 200 }, (_, i) => `OPENFILE "data-${i}.txt" FOR READ`).join("\n")}
DECLARE Total : INTEGER
${Array.from({ length: 1000 }, (_, i) => `IF Total > ${i} THEN\nTotal <- Total + 1\nENDIF`).join("\n")}`;

benchmark("pseudocode compilation performance", () => {
  it.each([
    { workload: "arithmetic and branches", source: arithmeticSource, statements: 4001 },
    { workload: "file processing branches", source: fileSource, statements: 1201 },
  ])("measures $workload", ({ workload, source, statements }) => {
    expect(source.length).toBeLessThan(256 * 1024);
    const result = compilePseudocode({ source, filename: "benchmark.pseudo", strict: true });
    expect(result.success).toBe(true);
    expect(result.diagnostics).toEqual([]);
    const ast = JSON.parse(result.astJson!);
    expect(ast.body).toHaveLength(statements);
    const measure = (name: string, run: () => unknown) => {
      for (let i = 0; i < 5; i++) run();
      const timings = Array.from({ length: 15 }, () => {
        const start = performance.now();
        run();
        return performance.now() - start;
      }).sort((a, b) => a - b);
      console.log(JSON.stringify({ workload, name, sourceBytes: source.length, medianMs: timings[7] }));
    };
    measure("compile", () => compilePseudocode({ source, filename: "benchmark.pseudo", strict: true }));
    measure("tokenize", () => tokenize(source));
    measure("parse including tokenize", () => parseSource(source));
    measure("semantic analysis", () => analyzeProgram(ast));
  });
});
