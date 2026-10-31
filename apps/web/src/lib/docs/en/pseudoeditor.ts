import type { Doc } from "../types";

export const pseudoeditorEn: Doc[] = [
  {
    slug: "getting-started",
    unit: "pseudoeditor",
    title: "Getting started with PseudoEditor",
    description:
      "Open the browser editor, write your first pseudocode program, compile it, and run it directly in the browser.",
    updated: "2026-05-04",
    sections: [
      {
        heading: "Start in the browser",
        body: [
          "Open the app, create or select a pseudocode document, and type directly into the editor. PseudoEditor saves local work during development and supports cloud workspace sync on the deployed site when you sign in.",
          "Use the Run button to compile the current file. Diagnostics appear with line and column details when the compiler finds syntax or semantic problems.",
        ],
      },
      {
        heading: "First program",
        body: [
          "A simple program declares variables, assigns values with `<-`, and writes output with `OUTPUT`. Keep one statement per line when you are learning because diagnostics are easier to follow.",
        ],
        example: `DECLARE Name : STRING
INPUT Name
OUTPUT "Hello ", Name`,
      },
    ],
  },
  {
    slug: "syntax",
    unit: "pseudoeditor",
    title: "Pseudocode syntax reference",
    description:
      "Reference the core pseudocode syntax supported by the browser compiler, including assignment, conditions, loops, arrays, and output.",
    updated: "2026-10-31",
    sections: [
      {
        heading: "Core statements",
        body: [
          "Use `DECLARE` for variables, `<-` for assignment, `INPUT` for user input, and `OUTPUT` for displayed values.",
          "Pick Cambridge IGCSE, Cambridge A Level, IB, OCR, or AQA in Settings so the compiler follows that board's notation.",
        ],
        example: `DECLARE Total : INTEGER
Total <- 0
OUTPUT Total`,
      },
      {
        heading: "Cheat sheet",
        body: ["Every block has a matching closing keyword. Matching block endings makes programs easier to trace and debug."],
        visual: {
          kind: "table",
          columns: ["Structure", "Opens with", "Closes with"],
          rows: [
            ["Selection", "`IF ... THEN`", "`ENDIF`"],
            ["Multi-way selection", "`CASE OF ...`", "`ENDCASE`"],
            ["Count-controlled loop", "`FOR ... TO ...`", "`NEXT ...`"],
            ["Pre-condition loop", "`WHILE ... DO`", "`ENDWHILE`"],
            ["Post-condition loop", "`REPEAT`", "`UNTIL ...`"],
            ["Procedure", "`PROCEDURE ...`", "`ENDPROCEDURE`"],
            ["Function", "`FUNCTION ... RETURNS ...`", "`ENDFUNCTION`"],
          ],
        },
      },
    ],
  },
  {
    slug: "debugging-errors",
    unit: "pseudoeditor",
    title: "Debugging compiler errors",
    description:
      "Use diagnostics, line numbers, and generated output to fix pseudocode syntax and logic problems.",
    updated: "2026-05-04",
    sections: [
      {
        heading: "Read the first error first",
        body: [
          "Syntax problems often cascade. Fix the earliest error, run again, and then move to the next diagnostic.",
          "Line and column details point to where the compiler first noticed the problem, which may be slightly after the actual typo.",
        ],
      },
      {
        heading: "Check declarations and block endings",
        body: [
          "Many beginner errors come from using an undeclared variable, mixing value types, or forgetting an `ENDIF`, `NEXT`, `ENDWHILE`, or `UNTIL`.",
        ],
        callout: {
          tone: "tip",
          text: "A program that compiles can still be wrong. Once the errors are gone, trace it with test data, as in the testing and trace tables lesson.",
        },
      },
    ],
  },
  {
    slug: "saving-workspaces",
    unit: "pseudoeditor",
    title: "Saving browser workspaces",
    description: "Understand how local browser storage and signed-in cloud sync work in PseudoEditor.",
    updated: "2026-05-04",
    sections: [
      {
        heading: "Local and cloud modes",
        body: [
          "On localhost, PseudoEditor saves to browser storage. On pseudoeditor.dev, signed-in users can save workspaces through Clerk authentication and Convex cloud sync.",
          "Signed-out production sessions can edit in memory, but signing in is required before cloud saving.",
        ],
      },
    ],
  },
  {
    slug: "exam-style-practice",
    unit: "pseudoeditor",
    title: "How to practise random pseudocode questions",
    description:
      "Use PseudoEditor's random practice questions to rehearse IGCSE, O Level, and A Level algorithm tasks in the browser editor.",
    updated: "2026-09-19",
    sections: [
      {
        heading: "Start with a random task",
        body: [
          "Open Practice and click Practice a random question. The page picks an original exam-style task so you cannot memorise a fixed order.",
          "Filter by topic when you want only loops, arrays, strings, or procedures. Leave the filter on any topic for mixed Paper 2 revision.",
        ],
      },
      {
        heading: "Write it in the editor",
        body: [
          "Each question has a starter file. Open it in the editor, complete the algorithm, then use Run with the sample input.",
          "Treat the sample output as a first check, then trace one edge case by hand before moving to another question.",
        ],
      },
    ],
  },
];
