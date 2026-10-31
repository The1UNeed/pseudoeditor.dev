import { describe, expect, it } from "vitest";
import { compilePseudocode } from "@pseudoeditor/compiler";
import {
  buildFlowchartFromPseudocode,
  createFlowchartNodeData,
  generatePseudocodeFromFlowchart,
  generatePseudocodeWithLineMap,
  getDecisionEdgeLabel,
  inferIndentUnit,
  bridgeEdgesAroundDeletedNodes,
} from "@/app/components/flowchart/model";
import type { FlowchartNodeData } from "@/app/components/flowchart/types";
import type { Edge, Node } from "@xyflow/react";

describe("flowchart model helpers", () => {
  it("creates input and output nodes with the correct defaults", () => {
    const inputNode = createFlowchartNodeData("inputOutput", {
      ioType: "input",
      content: "UserName",
    });
    const outputNode = createFlowchartNodeData("inputOutput", {
      ioType: "output",
      content: '"Done"',
    });

    expect(inputNode.label).toBe("Input");
    expect(inputNode.ioType).toBe("input");
    expect(outputNode.label).toBe("Output");
    expect(outputNode.ioType).toBe("output");
  });

  it("generates pseudocode from configured flowchart blocks", () => {
    const nodes: Node[] = [
      {
        id: "start",
        type: "terminator",
        position: { x: 0, y: 0 },
        data: createFlowchartNodeData("terminator", { label: "Start" }),
      },
      {
        id: "input",
        type: "inputOutput",
        position: { x: 0, y: 120 },
        data: createFlowchartNodeData("inputOutput", {
          ioType: "input",
          content: "Value",
        }),
      },
      {
        id: "process",
        type: "process",
        position: { x: 0, y: 240 },
        data: createFlowchartNodeData("process", {
          label: "Process",
          statements: ["Total <- Total + Value", "Count <- Count + 1"],
        }),
      },
      {
        id: "output",
        type: "inputOutput",
        position: { x: 0, y: 360 },
        data: createFlowchartNodeData("inputOutput", {
          ioType: "output",
          content: "Total",
        }),
      },
      {
        id: "end",
        type: "terminator",
        position: { x: 0, y: 480 },
        data: createFlowchartNodeData("terminator", { label: "End" }),
      },
    ];

    const edges: Edge[] = [
      { id: "e1", source: "start", target: "input" },
      { id: "e2", source: "input", target: "process" },
      { id: "e3", source: "process", target: "output" },
      { id: "e4", source: "output", target: "end" },
    ];

    expect(generatePseudocodeFromFlowchart(nodes, edges)).toBe(
      [
        "// Start",
        "INPUT Value",
        "Total <- Total + Value",
        "Count <- Count + 1",
        "OUTPUT Total",
        "// End",
      ].join("\n"),
    );
  });

  it("uses configured branch labels for decision connections", () => {
    const label = getDecisionEdgeLabel(
      { sourceHandle: "true" },
      createFlowchartNodeData("decision", {
        content: "Score >= 50",
        trueLabel: "Pass",
        falseLabel: "Retry",
      }),
    );

    expect(label).toBe("Pass");
  });

  it("hydrates a block graph from structured IF / ELSE pseudocode", () => {
    const source = [
      "// Start",
      "INPUT Value",
      "IF Score >= 50 THEN",
      '    OUTPUT "Pass"',
      "ELSE",
      '    OUTPUT "Retry"',
      "ENDIF",
      'OUTPUT "Done"',
      "// End",
    ].join("\n");

    const snapshot = buildFlowchartFromPseudocode(source);

    expect(snapshot.nodes.map((node) => node.type)).toEqual([
      "terminator",
      "inputOutput",
      "decision",
      "inputOutput",
      "inputOutput",
      "inputOutput",
      "terminator",
    ]);
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(source);
  });

  it("builds a real branched graph for IF / ELSE blocks and reconnects both branches", () => {
    const body = [
      "IF Value > 10 THEN",
      '    OUTPUT "High"',
      "ELSE",
      "    INPUT Value",
      "ENDIF",
      'OUTPUT "Done"',
    ].join("\n");
    const snapshot = buildFlowchartFromPseudocode(body);
    const decisionNode = snapshot.nodes.find((node) => node.type === "decision");
    const finalOutputNode = snapshot.nodes.find((node) => {
      const data = node.data as FlowchartNodeData;
      return node.type === "inputOutput" && data.ioType === "output" && data.content === '"Done"';
    });

    expect(decisionNode).toBeTruthy();
    expect(finalOutputNode).toBeTruthy();

    const trueEdge = snapshot.edges.find((edge) => edge.source === decisionNode?.id && edge.sourceHandle === "true");
    const falseEdge = snapshot.edges.find((edge) => edge.source === decisionNode?.id && edge.sourceHandle === "false");
    const mergeEdges = snapshot.edges.filter((edge) => edge.target === finalOutputNode?.id);

    expect(trueEdge?.label).toBe("Yes");
    expect(falseEdge?.label).toBe("No");
    expect(mergeEdges).toHaveLength(2);

    const trueTarget = snapshot.nodes.find((node) => node.id === trueEdge?.target);
    const falseTarget = snapshot.nodes.find((node) => node.id === falseEdge?.target);

    expect((trueTarget?.position.x ?? 0) > (decisionNode?.position.x ?? 0)).toBe(true);
    expect((falseTarget?.position.y ?? 0) > (decisionNode?.position.y ?? 0)).toBe(true);
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(body);
  });

  it("round-trips WHILE loops through a decision node with a back edge", () => {
    const body = [
      "WHILE Number > 9 DO",
      "    OUTPUT Number",
      "    INPUT Number",
      "ENDWHILE",
      'OUTPUT "Done"',
    ].join("\n");

    const snapshot = buildFlowchartFromPseudocode(body);
    const decisionNode = snapshot.nodes.find((node) => node.type === "decision");
    const backEdge = snapshot.edges.find((edge) => edge.target === decisionNode?.id);

    expect(decisionNode).toBeTruthy();
    expect(backEdge).toBeTruthy();
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(body);
  });

  it("round-trips FOR loops through a decision node with a back edge", () => {
    const source = [
      "Total <- 0",
      "FOR Index <- 1 TO 5",
      '    OUTPUT "Pass"',
      "NEXT Index",
    ].join("\n");

    const snapshot = buildFlowchartFromPseudocode(source);
    const decisionNode = snapshot.nodes.find((node) => node.type === "decision");
    const backEdge = snapshot.edges.find((edge) => edge.target === decisionNode?.id);

    expect(snapshot.nodes.map((node) => node.type)).toContain("terminator");
    expect(decisionNode).toBeTruthy();
    expect((decisionNode?.data as FlowchartNodeData | undefined)?.controlKind).toBe("for");
    expect(backEdge).toBeTruthy();
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(source);
  });

  it("keeps control structures as decisions when falling back to line parsing", () => {
    const source = [
      "DECLARE invalid_name : INTEGER",
      "FOR Index <- 1 TO 5",
      "IF Index = 1 THEN",
      'OUTPUT "First"',
      "ENDIF",
      "NEXT Index",
    ].join("\n");

    const snapshot = buildFlowchartFromPseudocode(source);
    const decisionNodes = snapshot.nodes.filter((node) => node.type === "decision");

    expect(decisionNodes.map((node) => (node.data as FlowchartNodeData).controlKind)).toEqual(["for", "if"]);
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(
      [
        "DECLARE invalid_name : INTEGER",
        "FOR Index <- 1 TO 5",
        "    IF Index = 1 THEN",
        '        OUTPUT "First"',
        "    ENDIF",
        "NEXT Index",
      ].join("\n"),
    );
  });

  it("keeps nested FOR loops as loops instead of turning the inner one into an IF", () => {
    const source = [
      "DECLARE I : INTEGER",
      "DECLARE J : INTEGER",
      "FOR I <- 1 TO 3",
      "    FOR J <- 1 TO 3",
      "        OUTPUT I * J",
      "    NEXT J",
      "NEXT I",
    ].join("\n");

    const snapshot = buildFlowchartFromPseudocode(source);
    const loops = snapshot.nodes.filter((node) => (node.data as FlowchartNodeData).controlKind === "for");

    expect(loops).toHaveLength(2);
    expect(generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges)).toBe(source);
  });

  const roundTripCases: Array<{ name: string; syntaxId: string; source: string }> = [
    {
      name: "comments, blank lines, and expressions as written",
      syntaxId: "cambridge-alevel",
      source: [
        "// Read a value",
        "DECLARE Total : INTEGER // running total",
        "DECLARE Name : STRING",
        "",
        "INPUT Name // who",
        "Total <- (1 + 2) * 3",
        "IF Total MOD 2 = 0 THEN // even?",
        "    // say so",
        '    OUTPUT "Even " & Name',
        "ELSE // odd",
        '    OUTPUT "http://example.com"',
        "ENDIF // done",
        "",
        "",
        "OUTPUT Square(Total)",
      ].join("\n"),
    },
    {
      name: "blank lines before ELSE, ELSEIF, and closing lines",
      syntaxId: "cambridge-igcse",
      source: [
        "DECLARE A : INTEGER",
        "INPUT A",
        "IF A = 1 THEN",
        "    OUTPUT 1",
        "",
        "ELSEIF A = 2 THEN",
        "    OUTPUT 2",
        "",
        "ELSE",
        "    OUTPUT 3",
        "",
        "",
        "ENDIF",
        "FOR A <- 1 TO 2",
        "    WHILE A > 5 DO",
        "        A <- A - 1",
        "",
        "    ENDWHILE",
        "",
        "NEXT A",
      ].join("\n"),
    },
    {
      name: "ELSEIF chains",
      syntaxId: "cambridge-igcse",
      source: [
        "DECLARE A : INTEGER",
        "INPUT A",
        "IF A = 1 THEN",
        "    OUTPUT 1",
        "ELSEIF A = 2 THEN",
        "    OUTPUT 2",
        "ELSE",
        "    OUTPUT 3",
        "ENDIF",
      ].join("\n"),
    },
    {
      name: "loops nested in branches and branches nested in loops",
      syntaxId: "cambridge-igcse",
      source: [
        "DECLARE I : INTEGER",
        "DECLARE J : INTEGER",
        "INPUT J",
        "IF J > 0 THEN",
        "    FOR I <- 1 TO J STEP 2",
        "        WHILE J > I DO",
        "            J <- J - 1",
        "        ENDWHILE",
        "        IF I = 3 THEN",
        '            OUTPUT "three"',
        "        ENDIF",
        "    NEXT I",
        "ELSE",
        "    WHILE J < 0 DO",
        "    ENDWHILE",
        "ENDIF",
        "OUTPUT J",
      ].join("\n"),
    },
    {
      name: "REPEAT, CASE, and procedures kept as text blocks",
      syntaxId: "cambridge-igcse",
      source: [
        "PROCEDURE Greet(Name : STRING)",
        "",
        '    OUTPUT "Hi ", Name',
        "ENDPROCEDURE",
        "DECLARE A : INTEGER",
        "A <- 0",
        "WHILE A < 3 DO",
        "    REPEAT",
        "        A <- A + 1",
        "    UNTIL A > 1",
        "    CASE OF A",
        '        2 : OUTPUT "two"',
        '        OTHERWISE OUTPUT "other"',
        "    ENDCASE",
        "ENDWHILE",
        'CALL Greet("Sam")',
      ].join("\n"),
    },
    {
      name: "tab indentation",
      syntaxId: "cambridge-igcse",
      source: "DECLARE A : INTEGER\nINPUT A\nIF A > 1 THEN\n\tIF A > 2 THEN\n\t\tOUTPUT A\n\tENDIF\nENDIF",
    },
    {
      name: "IB loops and selection",
      syntaxId: "ib-dp",
      source: [
        "X = 0",
        "input X",
        "if X > 5 then",
        '    output "big"',
        "else if X > 2 then",
        '    output "mid"',
        "end if",
        "loop while X > 0",
        "    X = X - 1",
        "end loop",
        "loop I from 1 to 3",
        "    output I",
        "end loop",
        "loop until X = 3",
        "    X = X + 1",
        "end loop",
      ].join("\n"),
    },
    {
      name: "OCR print, input, and method calls",
      syntaxId: "ocr-gcse",
      source: [
        'name = input("Name: ")',
        "total = 0",
        "for i = 1 to 3",
        "    total = total + i",
        "next i",
        "while total > 0",
        "    total = total - 1",
        "endwhile",
        "if total == 0 then",
        '    print("Total = " + str(total))',
        "elseif total == 1 then",
        "    print(name)",
        "endif",
      ].join("\n"),
    },
    {
      name: "AQA USERINPUT and ENDFOR",
      syntaxId: "aqa-gcse",
      source: [
        "# AQA program",
        "x ← USERINPUT",
        "IF x > 3 THEN",
        '    OUTPUT "big"',
        "ELSE IF x > 1 THEN",
        '    OUTPUT "mid"',
        "ENDIF",
        "FOR i ← 1 TO 3",
        "    OUTPUT i",
        "ENDFOR",
        "WHILE x > 0",
        "    x ← x - 1",
        "ENDWHILE",
      ].join("\n"),
    },
    {
      name: "explicit Start and End markers",
      syntaxId: "cambridge-igcse",
      source: ['// Start', 'OUTPUT "x"', "// End"].join("\n"),
    },
    {
      name: "source that does not compile, including an IF still being typed",
      syntaxId: "cambridge-igcse",
      source: [
        "DECLARE A : INTEGR",
        "INPUT A",
        "WHILE A > 0 DO",
        "    IF A = 2 THEN",
        '        OUTPUT "two"',
        "    ELSEIF A = 3 THEN",
        '        OUTPUT "three"',
        "    ENDIF",
        "    A <- A - 1",
        "ENDWHILE",
        "IF A > 1 THEN",
        '    OUTPUT "x"',
        'OUTPUT "y"',
      ].join("\n"),
    },
  ];

  it.each(roundTripCases)("regenerates the source unchanged: $name", ({ syntaxId, source }) => {
    const snapshot = buildFlowchartFromPseudocode(source, syntaxId);
    const code = generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges, {
      syntaxId,
      indentUnit: inferIndentUnit(source),
    });

    expect(code).toBe(source);
  });

  it("draws decisions for the IF and loop blocks of every syntax", () => {
    const otherSyntaxes = new Set(["ib-dp", "ocr-gcse", "aqa-gcse"]);
    for (const { syntaxId, source } of roundTripCases.filter((testCase) => otherSyntaxes.has(testCase.syntaxId))) {
      const kinds = buildFlowchartFromPseudocode(source, syntaxId).nodes
        .map((node) => (node.data as FlowchartNodeData).controlKind)
        .filter(Boolean);
      expect(kinds, syntaxId).toEqual(expect.arrayContaining(["if", "for", "while"]));
    }
  });

  it.each([
    { syntaxId: "cambridge-igcse", setup: "DECLARE Value : INTEGER\nValue <- 3", assign: "<-" },
    { syntaxId: "cambridge-alevel", setup: "DECLARE Value : INTEGER\nValue <- 3", assign: "<-" },
    { syntaxId: "ib-dp", setup: "Value = 3", assign: "=" },
    { syntaxId: "ocr-gcse", setup: "Value = 3", assign: "=" },
    { syntaxId: "aqa-gcse", setup: "Value ← 3", assign: "←" },
  ])("writes blocks added on the canvas in $syntaxId keywords that compile", ({ syntaxId, setup, assign }) => {
    const snapshot = buildFlowchartFromPseudocode(setup, syntaxId);
    const endNode = snapshot.nodes.find((node) => (node.data as FlowchartNodeData).label === "End");
    const lastEdge = snapshot.edges.find((edge) => edge.target === endNode?.id);
    if (!endNode || !lastEdge) {
      throw new Error("Imported graph has no End terminator.");
    }

    const add = (id: string, type: string, data: FlowchartNodeData, y: number): Node => ({
      id,
      type,
      position: { x: 0, y },
      data,
    });
    const nodes: Node[] = [
      ...snapshot.nodes,
      add("input", "inputOutput", createFlowchartNodeData("inputOutput", { ioType: "input", content: "Value" }), 1000),
      add("check", "decision", createFlowchartNodeData("decision", { content: "Value > 10" }), 1100),
      add("big", "inputOutput", createFlowchartNodeData("inputOutput", { ioType: "output", content: '"Big"' }), 1200),
      add("loop", "decision", createFlowchartNodeData("decision", { content: "Value > 0" }), 1300),
      add("step", "process", createFlowchartNodeData("process", { statements: [`Value ${assign} Value - 1`] }), 1400),
      add("until", "decision", createFlowchartNodeData("decision", { content: "Value > 5" }), 1500),
      add("again", "process", createFlowchartNodeData("process", { statements: [`Value ${assign} Value + 1`] }), 1600),
    ];
    const edges: Edge[] = [
      ...snapshot.edges.filter((edge) => edge !== lastEdge),
      { id: "a", source: lastEdge.source, target: "input" },
      { id: "b", source: "input", target: "check" },
      { id: "c", source: "check", sourceHandle: "true", target: "big" },
      { id: "d", source: "check", sourceHandle: "false", target: "loop" },
      { id: "e", source: "big", target: "loop" },
      { id: "f", source: "loop", sourceHandle: "true", target: "step" },
      { id: "g", source: "step", target: "loop" },
      { id: "h", source: "loop", sourceHandle: "false", target: "until" },
      { id: "i", source: "until", sourceHandle: "false", target: "again" },
      { id: "j", source: "again", target: "until" },
      { id: "k", source: "until", sourceHandle: "true", target: endNode.id },
    ];

    const code = generatePseudocodeFromFlowchart(nodes, edges, { syntaxId });
    const errors = compilePseudocode({ source: code, filename: "main.pseudo", strict: true, syntaxId }).diagnostics.filter(
      (diagnostic) => diagnostic.severity === "error",
    );

    expect(code.startsWith(setup)).toBe(true);
    expect(errors).toEqual([]);
  });

  it("keeps a FOR loop's NEXT and an ELSEIF chain valid after editing them in the inspector", () => {
    const source = [
      "DECLARE I : INTEGER",
      "DECLARE K : INTEGER",
      "DECLARE A : INTEGER",
      "INPUT A",
      "FOR I <- 1 TO 3",
      "    OUTPUT A",
      "NEXT I // finished",
      "IF A = 1 THEN",
      "    OUTPUT 1",
      "ELSEIF A = 2 THEN",
      "    OUTPUT 2",
      "ENDIF",
    ].join("\n");
    const snapshot = buildFlowchartFromPseudocode(source);
    const nodes = snapshot.nodes.map((node) => {
      const data = node.data as FlowchartNodeData;
      if (data.controlKind === "for") {
        return { ...node, data: { ...data, content: "K <- 1 TO 5" } };
      }
      if (data.elseIf) {
        return { ...node, data: { ...data, content: "A = 3" } };
      }
      return node;
    });

    const code = generatePseudocodeFromFlowchart(nodes, snapshot.edges);

    expect(code).toContain("FOR K <- 1 TO 5\n    OUTPUT A\nNEXT K // finished");
    expect(code).toContain("ELSEIF A = 3 THEN");
    expect(compilePseudocode({ source: code, filename: "main.pseudo", strict: true }).success).toBe(true);
  });

  it("joins the blocks around a deleted block", () => {
    const source = [
      "DECLARE A : INTEGER",
      "INPUT A",
      "IF A > 1 THEN",
      '    OUTPUT "x"',
      "ELSE",
      '    OUTPUT "y"',
      "ENDIF",
      'OUTPUT "done"',
    ].join("\n");
    const snapshot = buildFlowchartFromPseudocode(source);
    const deleted = snapshot.nodes.filter((node) => (node.data as FlowchartNodeData).content === '"x"');
    const nodes = snapshot.nodes.filter((node) => !deleted.includes(node));

    const bridges = bridgeEdgesAroundDeletedNodes(deleted, snapshot.edges);
    const edges = [
      ...snapshot.edges.filter((edge) => !deleted.some((node) => edge.source === node.id || edge.target === node.id)),
      ...bridges,
    ];

    expect(bridges).toHaveLength(1);
    expect(generatePseudocodeFromFlowchart(nodes, edges)).toBe(
      ["DECLARE A : INTEGER", "INPUT A", "IF A > 1 THEN", "ELSE", '    OUTPUT "y"', "ENDIF", 'OUTPUT "done"'].join("\n"),
    );
  });

  it("closes an imported loop with ENDIF once its back edge is removed", () => {
    const source = ["DECLARE A : INTEGER", "A <- 3", "WHILE A > 0 DO", "    OUTPUT A", "ENDWHILE"].join("\n");
    const snapshot = buildFlowchartFromPseudocode(source);
    const body = snapshot.nodes.find((node) => node.type === "inputOutput");
    const edges = snapshot.edges.filter((edge) => edge.source !== body?.id);

    const code = generatePseudocodeFromFlowchart(snapshot.nodes, edges);

    expect(code).toBe(["DECLARE A : INTEGER", "A <- 3", "IF A > 0 THEN", "    OUTPUT A", "ELSE", "ENDIF"].join("\n"));
    expect(compilePseudocode({ source: code, filename: "main.pseudo", strict: true }).success).toBe(true);
  });
});

describe("REPEAT, CASE, and routines on the flowchart", () => {
  const compiles = (source: string, syntaxId = "cambridge-igcse") =>
    compilePseudocode({ source, filename: "main.pseudo", strict: true, syntaxId }).diagnostics.filter(
      (diagnostic) => diagnostic.severity === "error",
    );
  const roundTrip = (source: string, syntaxId = "cambridge-igcse") => {
    const snapshot = buildFlowchartFromPseudocode(source, syntaxId);
    return {
      snapshot,
      code: generatePseudocodeFromFlowchart(snapshot.nodes, snapshot.edges, { syntaxId, indentUnit: inferIndentUnit(source) }),
    };
  };
  const dataOf = (node: Node) => node.data as FlowchartNodeData;
  const verbatimBlocks = (nodes: Node[]) =>
    nodes.filter((node) => /^\s*(REPEAT|CASE|PROCEDURE|FUNCTION|do|switch|procedure|SUBROUTINE)\b/im.test((dataOf(node).statements ?? []).join("\n")));

  const cambridge = [
    "DECLARE Count : INTEGER",
    "DECLARE Choice : INTEGER",
    "",
    "PROCEDURE Greet(Name : STRING)",
    '    OUTPUT "Hello ", Name',
    "ENDPROCEDURE",
    "",
    "FUNCTION Square(N : INTEGER) RETURNS INTEGER",
    "    RETURN N * N",
    "ENDFUNCTION",
    "",
    "Count <- 0",
    "REPEAT",
    "    Count <- Count + 1 // step",
    "    OUTPUT Square(Count)",
    "UNTIL Count >= 3 // done",
    "Choice <- 2",
    "CASE OF Choice",
    '    1 : OUTPUT "One"',
    "    2 :",
    '        CALL Greet("Two")',
    "",
    '    OTHERWISE : OUTPUT "Other"',
    "ENDCASE",
    'OUTPUT "Done"',
  ].join("\n");

  it.each([
    ["cambridge-igcse", cambridge],
    [
      "ocr-gcse",
      [
        "x = 0",
        "do",
        "    x = x + 1",
        "until x >= 3",
        "switch x:",
        "    case 1:",
        '        print("one")',
        "    case 3:",
        '        print("three")',
        "    default:",
        '        print("other")',
        "endswitch",
        "function double(n)",
        "    return n * 2",
        "endfunction",
        "print(double(x))",
      ].join("\n"),
    ],
    ["aqa-gcse", ["SUBROUTINE Show(N)", "    OUTPUT N", "ENDSUBROUTINE", "I ← 0", "REPEAT", "    I ← I + 1", "    Show(I)", "UNTIL I = 3"].join("\n")],
    ["ib-dp", ["X = 0", "loop until X > 3", "    X = X + 1", "end loop", "output X"].join("\n")],
  ])("draws every block of a %s program as shapes and writes it back unchanged", (syntaxId, source) => {
    expect(compiles(source, syntaxId)).toEqual([]);
    const { snapshot, code } = roundTrip(source, syntaxId);

    expect(code).toBe(source);
    expect(verbatimBlocks(snapshot.nodes)).toEqual([]);
  });

  it("draws REPEAT as a test after the body that loops back on No", () => {
    const { snapshot } = roundTrip(cambridge);
    const test = snapshot.nodes.find((node) => dataOf(node).controlKind === "repeat");
    const body = snapshot.nodes.find((node) => (dataOf(node).statements ?? []).includes("Count <- Count + 1 // step"));

    expect(dataOf(test!).content).toBe("Count >= 3");
    expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: test!.id, target: body!.id, sourceHandle: "false" }));
    expect(test!.position.y).toBeGreaterThan(body!.position.y);
  });

  it("draws CASE as a chain of decisions and each routine as its own chart", () => {
    const { snapshot } = roundTrip(cambridge);
    const options = snapshot.nodes.filter((node) => dataOf(node).controlKind === "case");
    const routineStarts = snapshot.nodes.filter((node) => dataOf(node).routine);
    const reachable = (fromId: string) => {
      const seen = new Set([fromId]);
      for (let grew = true; grew; ) {
        grew = false;
        for (const edge of snapshot.edges) {
          if (seen.has(edge.source) && !seen.has(edge.target)) {
            seen.add(edge.target);
            grew = true;
          }
        }
      }
      return seen;
    };

    expect(options.map((node) => dataOf(node).content)).toEqual(["Choice = 1", "Choice = 2"]);
    expect(routineStarts.map((node) => dataOf(node).label)).toEqual([
      "PROCEDURE Greet(Name : STRING)",
      "FUNCTION Square(N : INTEGER) RETURNS INTEGER",
    ]);
    const main = reachable(snapshot.nodes.find((node) => dataOf(node).label === "Start")!.id);
    for (const start of routineStarts) {
      expect(main.has(start.id)).toBe(false);
      expect([...reachable(start.id)].some((id) => dataOf(snapshot.nodes.find((node) => node.id === id)!).routineEnd)).toBe(true);
    }
  });

  it.each([
    ["WHILE inside REPEAT", "REPEAT\n    WHILE B < 3 DO\n        B <- B + 1\n    ENDWHILE\nUNTIL A > 2"],
    ["REPEAT inside WHILE", "WHILE A < 3 DO\n    REPEAT\n        B <- B + 1\n    UNTIL B > 2\n    A <- A + 1\nENDWHILE"],
    ["REPEAT inside REPEAT", "REPEAT\n    REPEAT\n        B <- B + 1\n    UNTIL B > 2\nUNTIL A > 2"],
    ["IF first in REPEAT", "REPEAT\n    IF A > 1 THEN\n        B <- 1\n    ENDIF\nUNTIL A > 2"],
    ["empty REPEAT", "REPEAT\nUNTIL A > 2"],
    ["CASE inside REPEAT", "REPEAT\n    CASE OF A\n        1 : B <- 1\n        2 : B <- 2\n    ENDCASE\n    A <- A + 1\nUNTIL A > 2"],
    ["blocks inside CASE", 'CASE OF A\n    1 :\n        REPEAT\n            B <- B + 1\n        UNTIL B > 2\n    2 :\n        IF B > 1 THEN\n            OUTPUT "x"\n        ENDIF\nENDCASE'],
    ["REPEAT inside FOR", "FOR A <- 1 TO 3\n    REPEAT\n        B <- B + 1\n    UNTIL B > A\nNEXT A"],
    ["REPEAT inside IF", 'IF A > 1 THEN\n    REPEAT\n        A <- A - 1\n    UNTIL A = 1\nELSE\n    OUTPUT "small"\nENDIF'],
    ["spaced CASE", 'CASE OF A\n\n    1 : OUTPUT "a" // one\n\n    2 : OUTPUT "b"\n    OTHERWISE :\n        OUTPUT "c"\n\nENDCASE'],
  ])("round-trips %s", (_name, body) => {
    const source = `DECLARE A : INTEGER\nDECLARE B : INTEGER\n${body}`;
    expect(compiles(source)).toEqual([]);
    const { snapshot, code } = roundTrip(source);

    expect(code).toBe(source);
    expect(verbatimBlocks(snapshot.nodes)).toEqual([]);
  });

  it("keeps the code valid after editing CASE options in the inspector", () => {
    const { snapshot } = roundTrip(cambridge);
    const firstOption = snapshot.nodes.find((node) => dataOf(node).content === "Choice = 1")!;
    const withData = (id: string, data: Partial<FlowchartNodeData>) =>
      snapshot.nodes.map((node) => (node.id === id ? { ...node, data: { ...dataOf(node), ...data } } : node));

    const renumbered = generatePseudocodeFromFlowchart(withData(firstOption.id, { content: "Choice = 5" }), snapshot.edges);
    expect(renumbered).toContain('CASE OF Choice\n    5 : OUTPUT "One"\n    2 :');
    expect(compiles(renumbered)).toEqual([]);

    // A condition that tests something else no longer fits a CASE, so the chain becomes IF / ELSEIF.
    const retested = generatePseudocodeFromFlowchart(withData(firstOption.id, { content: "Count > 1" }), snapshot.edges);
    expect(retested).not.toContain("CASE OF");
    expect(retested).toContain('IF Count > 1 THEN\n    OUTPUT "One"\nELSEIF Choice = 2 THEN');
    expect(compiles(retested)).toEqual([]);
  });

  it("writes a CASE option holding two statements as IF / ELSEIF", () => {
    const { snapshot } = roundTrip(cambridge);
    const one = snapshot.nodes.find((node) => dataOf(node).content === '"One"')!;
    const after = snapshot.edges.find((edge) => edge.source === one.id)!;
    const extra: Node = { id: "extra", type: "process", position: { x: one.position.x, y: one.position.y + 10 }, data: createFlowchartNodeData("process", { statements: ["Count <- 9"] }) };
    const edges = [
      ...snapshot.edges.filter((edge) => edge !== after),
      { id: "to-extra", source: one.id, target: "extra" },
      { id: "from-extra", source: "extra", target: after.target },
    ];

    const code = generatePseudocodeFromFlowchart([...snapshot.nodes, extra], edges);
    expect(code).toContain('IF Choice = 1 THEN\n    OUTPUT "One"\n    Count <- 9\nELSEIF Choice = 2 THEN');
    expect(compiles(code)).toEqual([]);
  });

  it("keeps REPEAT edits, routine renames, and a routine whose next block was deleted valid", () => {
    const { snapshot } = roundTrip(cambridge);
    const nodes = snapshot.nodes.map((node) => {
      const data = dataOf(node);
      if (data.controlKind === "repeat") return { ...node, data: { ...data, content: "Count >= 5" } };
      if (data.routine === "procedure") return { ...node, data: { ...data, label: "PROCEDURE Welcome(Name : STRING)" } };
      return node;
    });
    const renamedCall = nodes.map((node) =>
      dataOf(node).content === 'Greet("Two")' ? { ...node, data: { ...dataOf(node), content: 'Welcome("Two")' } } : node,
    );

    const edited = generatePseudocodeFromFlowchart(renamedCall, snapshot.edges);
    expect(edited).toContain("UNTIL Count >= 5 // done");
    expect(edited).toContain("PROCEDURE Welcome(Name : STRING)\n    OUTPUT \"Hello \", Name\nENDPROCEDURE");
    expect(compiles(edited)).toEqual([]);

    // The routines were written before `Count <- 0`; deleting that block moves them to the top.
    const anchor = renamedCall.find((node) => (dataOf(node).statements ?? []).includes("Count <- 0"))!;
    const remaining = renamedCall.filter((node) => node !== anchor);
    const edges = [
      ...snapshot.edges.filter((edge) => edge.source !== anchor.id && edge.target !== anchor.id),
      ...bridgeEdgesAroundDeletedNodes([anchor], snapshot.edges),
    ];
    const moved = generatePseudocodeFromFlowchart(remaining, edges);
    expect(moved.startsWith("PROCEDURE Welcome(Name : STRING)")).toBe(true);
    expect(moved).not.toContain("Count <- 0");
    expect(compiles(moved)).toEqual([]);
  });

  it("writes a CASE option whose condition gained another test as IF / ELSEIF", () => {
    const source = ["DECLARE A : BOOLEAN", "DECLARE B : BOOLEAN", "CASE OF A", '    TRUE : OUTPUT "yes"', '    FALSE : OUTPUT "no"', "ENDCASE"].join("\n");
    const { snapshot } = roundTrip(source);
    const nodes = snapshot.nodes.map((node) =>
      dataOf(node).content === "A = TRUE" ? { ...node, data: { ...dataOf(node), content: "A = TRUE OR B" } } : node,
    );

    const code = generatePseudocodeFromFlowchart(nodes, snapshot.edges);
    expect(code).not.toContain("CASE OF");
    expect(code).toContain('IF A = TRUE OR B THEN\n    OUTPUT "yes"\nELSEIF A = FALSE THEN');
    expect(compiles(code)).toEqual([]);
  });

  it("keeps a routine at the top level when the block it was written before moves into a branch", () => {
    const source = ["PROCEDURE P()", '    OUTPUT "p"', "ENDPROCEDURE", 'OUTPUT "first"', "IF TRUE THEN", '    OUTPUT "inside"', "ENDIF", "CALL P()"].join("\n");
    const { snapshot } = roundTrip(source);
    const first = snapshot.nodes.find((node) => dataOf(node).content === '"first"')!;
    const decision = snapshot.nodes.find((node) => node.type === "decision")!;
    const inside = snapshot.nodes.find((node) => dataOf(node).content === '"inside"')!;
    // Rewire so the anchor block runs on the IF's Yes branch, before "inside".
    const edges = snapshot.edges
      .filter((edge) => edge.target !== first.id && edge.source !== first.id && !(edge.source === decision.id && edge.sourceHandle === "true"))
      .concat([
        { id: "start-if", source: snapshot.nodes.find((node) => dataOf(node).label === "Start")!.id, target: decision.id },
        { id: "yes-first", source: decision.id, target: first.id, sourceHandle: "true" },
        { id: "first-inside", source: first.id, target: inside.id },
      ]);

    const code = generatePseudocodeFromFlowchart(snapshot.nodes, edges);
    expect(code.startsWith('PROCEDURE P()\n    OUTPUT "p"\nENDPROCEDURE')).toBe(true);
    expect(code).toContain('IF TRUE THEN\n    OUTPUT "first"\n    OUTPUT "inside"\nENDIF');
    expect(compiles(code)).toEqual([]);
  });

  it("maps each generated line to the block that runs it", () => {
    const { snapshot } = roundTrip(cambridge);
    const { lines } = generatePseudocodeWithLineMap(snapshot.nodes, snapshot.edges);
    const owner = (text: string) => {
      const line = lines.find((candidate) => candidate.text.trim() === text);
      const id = line?.testId ?? line?.nodeId;
      return id ? dataOf(snapshot.nodes.find((node) => node.id === id)!) : null;
    };

    expect(lines.map((line) => line.text).join("\n")).toBe(cambridge);
    expect(owner("UNTIL Count >= 3 // done")?.controlKind).toBe("repeat");
    expect(owner('1 : OUTPUT "One"')?.content).toBe("Choice = 1");
    expect(lines.find((line) => line.text.trim() === '1 : OUTPUT "One"')?.nodeId).toBeDefined();
    expect(owner("PROCEDURE Greet(Name : STRING)")?.routine).toBe("procedure");
    expect(owner("ENDPROCEDURE")?.routineEnd).toBe(true);
    expect(owner("REPEAT")).toBeNull();
  });
});
