import type { Doc } from "../types";

export const booleanLogicEn: Doc[] = [
  {
    slug: "logic-gates",
    unit: "boolean-logic",
    title: "Logic gates and truth tables",
    description: "The six logic gates, NOT, AND, OR, NAND, NOR, and XOR, with their symbols and truth tables.",
    updated: "2026-10-31",
    syllabus: "10.1, 10.2",
    sections: [
      {
        heading: "Gates make decisions with 1s and 0s",
        body: [
          "A **logic gate** is an electronic component that takes one or two binary inputs and produces one binary output. 1 means on (TRUE), 0 means off (FALSE). Every calculation a CPU does is built from millions of these gates.",
          "A **truth table** lists every possible combination of inputs and the output for each. With 2 inputs there are 4 rows; with 3 inputs there are 8.",
        ],
      },
      {
        heading: "Try every gate",
        body: [
          "Pick a gate, then click the inputs (or a row of the truth table). Highlighted wires carry a 1.",
        ],
        visualTitle: "Logic gate explorer",
        visual: { kind: "logicGate", gates: ["NOT", "AND", "OR", "NAND", "NOR", "XOR"] },
      },
      {
        heading: "The rules in words",
        visual: {
          kind: "table",
          columns: ["Gate", "Output is 1 when...", "Expression"],
          rows: [
            ["NOT", "the input is 0 (it flips the input)", "`X = NOT A`"],
            ["AND", "**both** inputs are 1", "`X = A AND B`"],
            ["OR", "**at least one** input is 1", "`X = A OR B`"],
            ["NAND", "NOT AND: the inputs are **not both** 1", "`X = A NAND B`"],
            ["NOR", "NOT OR: **neither** input is 1", "`X = A NOR B`"],
            ["XOR", "the inputs are **different**", "`X = A XOR B`"],
          ],
        },
        body: [],
        callout: { tone: "tip", text: "A small circle (bubble) on a gate's output means NOT. That is the only difference between AND and NAND, or OR and NOR." },
      },
    ],
    keyTerms: [
      { term: "Logic gate", definition: "A component that performs a Boolean operation on binary inputs." },
      { term: "Truth table", definition: "A table showing the output for every combination of inputs." },
      { term: "XOR", definition: "Exclusive OR: outputs 1 only when the inputs are different." },
    ],
    quiz: [
      { question: "Which gate outputs 0 only when both inputs are 1?", answer: "**NAND**." },
      { question: "What is `1 XOR 1`?", answer: "**0**: the inputs are the same." },
      { question: "How many rows does a truth table with 3 inputs need?", answer: "2³ = **8** rows." },
    ],
  },
  {
    slug: "logic-circuits",
    unit: "boolean-logic",
    title: "Logic circuits and expressions",
    description: "Combine gates into circuits, write logic expressions, complete truth tables, and turn a problem statement into a circuit.",
    updated: "2026-10-31",
    syllabus: "10.3–10.5",
    sections: [
      {
        heading: "Combining gates",
        body: [
          "The output of one gate can be the input to another. A **logic circuit** is drawn from left (inputs) to right (output) and can be written as a **logic expression**, using brackets to show which gates come first.",
          "Toggle A, B, and C below and follow the 1s through the circuit.",
        ],
        visualTitle: "X = (A AND B) OR NOT C",
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "OR", inputs: [{ gate: "AND", inputs: ["A", "B"] }, { gate: "NOT", input: "C" }] },
        },
      },
      {
        heading: "Completing a truth table",
        body: [
          "For a circuit with several gates, add a working column for each gate's output. Fill the input columns by counting up in binary from 000 to 111, then work out each column from left to right.",
        ],
        visual: {
          kind: "table",
          columns: ["A", "B", "C", "A AND B", "NOT C", "X"],
          rows: [
            ["0", "0", "0", "0", "1", "1"],
            ["0", "0", "1", "0", "0", "0"],
            ["0", "1", "0", "0", "1", "1"],
            ["0", "1", "1", "0", "0", "0"],
            ["1", "0", "0", "0", "1", "1"],
            ["1", "0", "1", "0", "0", "0"],
            ["1", "1", "0", "1", "1", "1"],
            ["1", "1", "1", "1", "0", "1"],
          ],
        },
        callout: { tone: "tip", text: "Working columns earn marks and catch mistakes. In the exam you only need to fill the final column, but you can add your own." },
      },
      {
        heading: "From a problem statement",
        body: [
          "Exam questions often describe a situation in words. Turn each condition into an input, then join them with the gates that match the words **and**, **or**, and **not**.",
          "**Problem:** a security light (X) turns on when it is dark (A = 1) and either movement is detected (B = 1) or the test button is pressed (C = 1).",
          "That gives `X = A AND (B OR C)`.",
        ],
        visualTitle: "Security light",
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "AND", inputs: ["A", { gate: "OR", inputs: ["B", "C"] }] },
        },
      },
      {
        heading: "One more: a XOR circuit",
        body: [
          "**Problem:** a hallway light (X) has a switch at each end (A and B). Flipping either switch changes the light, so it is on when exactly one switch is up, unless the master switch C is off (C = 0).",
          "That gives `X = (A XOR B) AND C`.",
        ],
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "AND", inputs: [{ gate: "XOR", inputs: ["A", "B"] }, "C"] },
        },
      },
    ],
    keyTerms: [
      { term: "Logic circuit", definition: "Logic gates connected so that outputs feed into other gates." },
      { term: "Logic expression", definition: "A circuit written with gate names, inputs, and brackets, such as X = A AND (B OR C)." },
      { term: "Working column", definition: "A truth table column for an intermediate gate's output." },
    ],
    quiz: [
      { question: "For `X = (A AND B) OR NOT C`, what is X when A = 0, B = 1, C = 1?", answer: "A AND B = 0, NOT C = 0, so X = 0 OR 0 = **0**." },
      { question: "Write an expression: a fan (X) turns on if it is hot (A) and the window is not open (B).", answer: "`X = A AND NOT B`." },
      { question: "In the security light circuit, why does the light stay off in daylight even if movement is detected?", answer: "The final gate is AND with A. In daylight A = 0, so the output is 0 whatever B or C are." },
    ],
  },
];
