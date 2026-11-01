// Compare all observable results against a previous WASM binary:
// git show <base>:apps/web/src/runtime/wasm/pkg/pseudocode_runtime_bg.wasm > /tmp/runtime-before.wasm
// node packages/pseudocode-runtime/examples/parity-wasm.mjs /tmp/runtime-before.wasm
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

assert.ok(process.argv[2], "Pass the baseline WASM path");
const bindings = new URL("../../../apps/web/src/runtime/wasm/pkg/pseudocode_runtime.js", import.meta.url);
const before = await import(`${bindings.href}?before`);
const after = await import(`${bindings.href}?after`);
before.initSync({ module: readFileSync(process.argv[2]) });
after.initSync({ module: readFileSync(new URL("pseudocode_runtime_bg.wasm", bindings)) });

const span = (line = 1) => ({ startLine: line, startColumn: 3, endLine: line, endColumn: 9 });
const literal = (value) => ({ kind: "literal", literalType: typeof value === "string" ? "STRING" : typeof value === "boolean" ? "BOOLEAN" : Number.isInteger(value) ? "INTEGER" : "REAL", value, span: span(2) });
const ident = (name) => ({ kind: "identifier", name, span: span(3) });
const binary = (operator, left, right) => ({ kind: "binary", operator, left, right, span: span(4) });
const output = (...values) => ({ kind: "output", values, span: span(5) });
const assign = (name, value) => ({ kind: "assignment", target: ident(name), value, span: span(6) });
const declare = (name, type = "INTEGER") => ({ kind: "declare", identifier: ident(name), typeNode: { kind: "basic", name: type }, span: span(7) });
const loop = (start, end, step, body) => ({ kind: "for", iterator: ident("Index"), startValue: literal(start), endValue: literal(end), stepValue: literal(step), body, span: span(8) });
const programs = [];
const operators = ["+", "-", "*", "/", "DIV", "MOD", "^", "=", "<>", "<", "<=", ">", ">=", "AND", "OR", "unknown"];
const pairs = [[-17, 5], [17, -5], [2.5, -1.5], [0, 0], [true, false], ["ab", "cd"], ["12", 3], [9007199254740992, 1]];
for (const operator of operators) {
  for (const [left, right] of pairs) programs.push([output(binary(operator, literal(left), literal(right)))]);
}
for (const value of [-17, 0, 2.5, false, "12"]) {
  for (const operator of ["NOT", "-"]) programs.push([output({ kind: "unary", operator, operand: literal(value), span: span(9) })]);
}
programs.push(
  [output(binary("AND", literal(false), ident("Missing"))), output(binary("OR", literal(true), binary("/", literal(1), literal(0))))],
  [declare("Total"), loop(4, -2, -2, [assign("tOtAl", binary("+", ident("TOTAL"), ident("Index")))]), output(ident("Total"))],
  [declare("Total"), loop(1, 0, 1, [assign("Total", literal(99))]), output(ident("Total"))],
  [loop(1, 3, 0, [output(literal("unreachable"))])],
  [declare("Count"), { kind: "while", condition: binary("<", ident("Count"), literal(3)), body: [assign("Count", binary("+", ident("Count"), literal(1))), output(ident("Count"))], span: span(10) }],
  [declare("Count"), { kind: "repeat", body: [assign("Count", binary("+", ident("Count"), literal(1)))], condition: binary(">=", ident("Count"), literal(3)), span: span(11) }, output(ident("Count"))],
  [{ kind: "if", condition: literal(false), thenBody: [output(literal("wrong"))], elseBody: [output(literal("a\nb"))], span: span(12) }, output(literal("after"))],
  [{ kind: "case", expression: literal(2), clauses: [{ value: literal(1), statement: output(literal("one")), span: span(13) }, { value: literal(2), statement: output(literal("two")), span: span(14) }], span: span(15) }],
);
const call = (name, args) => ({ kind: "call", name, args, span: span(16) });
const returnValue = (value) => ({ kind: "return", value, span: span(17) });
const functionDefinition = (name, params, body) => ({ kind: "functionDefinition", name, params: params.map((name) => ({ name, typeNode: { kind: "basic", name: "INTEGER" }, mode: "BYREF" })), body, span: { ...span(18), endLine: 22 } });
programs.push(
  [functionDefinition("Add", ["Z", "A"], [returnValue(binary("+", ident("z"), ident("a")))]), declare("A"), assign("A", literal(7)), output(call("ADD", [literal(2), literal(3)])), output(ident("A")), output(call("Add", [literal(4), literal(5)]))],
  [functionDefinition("Sum", ["N"], [{ kind: "if", condition: binary("<=", ident("n"), literal(0)), thenBody: [returnValue(literal(0))], elseBody: [returnValue(binary("+", ident("N"), call("sum", [binary("-", ident("N"), literal(1))])))], span: span(19) }]), output(call("SUM", [literal(7)]))],
  [functionDefinition("ExitLoop", [], [loop(1, 10, 1, [returnValue(ident("Index"))]), returnValue(literal(99))]), output(call("ExitLoop", []))],
  [{ kind: "procedureDefinition", name: "Update", params: [{ name: "Local", typeNode: { kind: "basic", name: "INTEGER" } }], body: [declare("Total", "STRING"), assign("Total", binary("+", ident("TOTAL"), ident("Local")))], span: span(20) }, declare("Total"), assign("Total", literal(8)), { kind: "callStatement", name: "update", args: [literal(3)], span: span(21) }, output(ident("total"))],
  [declare("Input", "INTEGER"), { kind: "input", target: ident("INPUT"), span: span(22) }, output(ident("input"))],
  [declare("Input", "BOOLEAN"), { kind: "input", target: ident("Input"), span: span(23) }, output(ident("Input"))],
  [output(call("RANDOM", [])), output(call("RAND", [literal(10)])), output(call("SUBSTRING", [literal("hello"), literal(2), literal(3)])), output(call("INT", [literal(-2.9)]))],
);
// Missing fields must still fail at evaluation time, after the same prior effects.
programs.push(
  [output({ kind: "binary", operator: "+", left: literal(1), span: span(24) })],
  [output(binary("AND", literal(false), { kind: "binary", operator: "/", left: literal(1) }))],
  [{ kind: "repeat", body: [output(literal("must not run"))], span: span(25) }],
  [{ kind: "assignment", value: literal(1), span: span(26) }],
  [{ kind: "if", thenBody: [output(literal("must not run"))], span: span(27) }],
  [{ kind: "while", body: [], span: span(28) }],
  [{ kind: "for", iterator: ident("Index"), endValue: literal(3), body: [], span: span(29) }],
  [output({ kind: "unary", operator: "NOT", span: span(30) })],
);
const access = (name, index) => ({ kind: "arrayAccess", name, indices: [literal(index)], span: span(31) });
programs.push(
  [declare("Count"), loop(1, 6000, 1, [assign("Count", binary("+", ident("Count"), literal(1)))]), output(ident("Count"))],
  [{ kind: "declare", identifier: ident("Data"), typeNode: { kind: "array", elementType: "INTEGER", dimensions: [{ lower: -1, upper: 2 }] }, span: span(32) }, { kind: "assignment", target: access("DATA", -1), value: literal(7), span: span(33) }, assign("Copy", ident("data")), { kind: "assignment", target: access("copy", -1), value: literal(9), span: span(34) }, output(access("Data", -1), literal(","), access("Copy", -1), literal(","), access("DATA", 0)), output(access("Data", 3))],
  [{ kind: "openfile", fileIdentifier: literal("data.txt"), mode: "WRITE", span: span(35) }, { kind: "writefile", fileIdentifier: literal("data.txt"), value: literal("first"), span: span(36) }, { kind: "writefile", fileIdentifier: literal("data.txt"), value: literal("second"), span: span(37) }, { kind: "openfile", fileIdentifier: literal("data.txt"), mode: "READ", span: span(38) }, loop(1, 4, 1, [{ kind: "readfile", fileIdentifier: literal("data.txt"), target: ident("Line"), span: span(39) }, output(ident("Line"))])],
  [...Array.from({ length: 500 }, (_, index) => declare(`Global${index}`)), functionDefinition("Add", ["Z", "A"], [returnValue(binary("+", ident("z"), ident("a")))]), output(call("Add", [literal(3), literal(4)])), output(call("Add", [literal(5), literal(6)]))],
);
programs.push([loop(1, 2, 1, [{ kind: "input", target: ident("INDEX"), span: span(40) }, output(ident("Index")), declare("index", "STRING")])]);
let cases = 0;
for (const [index, body] of programs.entries()) {
  for (const trace of [false, true]) {
    for (const instruction_budget of [0, 1, 2, 4, 8, 20, 1000, 100000]) {
      const request = JSON.stringify({ ast_json: JSON.stringify({ kind: "program", body }), stdin_lines: ["12", "TRUE"], virtual_files: {}, trace, instruction_budget });
      const expected = JSON.parse(before.run_pseudocode(request));
      const actual = JSON.parse(after.run_pseudocode(request));
      assert.deepEqual(actual, expected, `program ${index}, trace=${trace}, budget=${instruction_budget}`);
      cases += 1;
    }
  }
}
console.log(`${cases} exact baseline-WASM comparisons passed, including stdout, diagnostics, files, traces and truncation flags.`);
