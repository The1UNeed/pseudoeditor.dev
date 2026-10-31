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
    slug: "flowchart-mode",
    unit: "pseudoeditor",
    title: "Flowchart mode",
    description:
      "Turn a program into a flowchart and back, follow a run block by block, and edit from either view.",
    updated: "2026-10-31",
    sections: [
      {
        heading: "Open flowchart mode",
        body: [
          "Open a file, then select the flowchart button in the toolbar. Select it again to go back to the code. The flowchart is the same program: edit either view and the other follows, keeping your keywords, comments, blank lines, and indentation.",
          "Flowchart mode needs a mouse or trackpad, so it is available on desktop and laptop screens but not on phones and tablets. Fit View in the canvas controls zooms out until the whole flow is on screen.",
        ],
      },
      {
        heading: "How code becomes shapes",
        body: [
          "Every statement is drawn. IB's `loop until` is tested before its body, which runs on No; OCR's `do ... until` and `switch` are drawn like `REPEAT` and `CASE`.",
        ],
        visual: {
          kind: "table",
          columns: ["Code", "Drawn as"],
          rows: [
            ["`INPUT`, `OUTPUT`", "Input / output parallelogram"],
            ["`IF`, `ELSEIF`, `WHILE`, `FOR`", "Decision; Yes leaves on the right, No from the bottom, and a loop's body has an arrow back"],
            ["`REPEAT ... UNTIL`", "The body, then a decision after it: No loops back up, Yes carries on"],
            ["`CASE`", "A chain of decisions such as `Choice = 1`, one per option, with `OTHERWISE` last"],
            ["`PROCEDURE`, `FUNCTION`", "A flowchart of its own beside the main one, from its header line to Return"],
            ["`CALL`", "Subroutine box"],
            ["Assignments, `DECLARE`, `RETURN`, comments", "Process block, exactly as written"],
          ],
        },
      },
      {
        heading: "An example",
        body: [
          "Open this program in flowchart mode. `REPEAT` and `CASE` become decisions in the main flow, and `Greet` gets a flowchart of its own to the right.",
        ],
        example: `DECLARE Count : INTEGER
PROCEDURE Greet(Name : STRING)
    OUTPUT "Hello ", Name
ENDPROCEDURE
Count <- 0
REPEAT
    Count <- Count + 1
UNTIL Count >= 3
CASE OF Count
    1 : OUTPUT "One"
    3 : CALL Greet("Three")
    OTHERWISE : OUTPUT "Other"
ENDCASE`,
      },
      {
        heading: "Follow a run",
        body: [
          "Press Run while the flowchart is open. The program runs as usual, asking for `INPUT` in the terminal, and then the flowchart replays it: each block lights up as the program reaches it, the arrow it followed is highlighted, and blocks it hasn't reached yet are faded.",
          "The bar above the chart plays the run or steps through it one block at a time, forwards or back. It shows which way each decision went, such as `Count >= 3 → No`, and the latest line of output. A `CALL` jumps to the procedure's own flowchart and comes back after Return.",
          "If the program stops with an error, the replay ends on the block that failed, outlined in red. Very long runs show their first 5,000 steps. Changing the flowchart ends the replay; press Run again to follow the new version.",
        ],
      },
      {
        heading: "Edit in either view",
        body: [
          "Drag blocks from the palette onto the canvas, connect each block's bottom handle to the next block's top, and select a block to edit its text in the inspector. Blocks you add use the keywords of the exam syntax chosen in Settings.",
          "Deleting a block other than a decision joins the blocks before and after it. Clear Canvas asks for a second click, because it empties the file.",
          "A `CASE` option holds one statement. If you add a second block to an option, or change its condition to test something else, the chain is written as `IF` and `ELSEIF` instead so the code still compiles. Renaming a procedure's header line renames the procedure; update its `CALL` blocks too.",
          "The flowchart still opens when the file doesn't compile. It then reads the file line by line, and a line it can't place, such as an `IF` with no `ENDIF` yet, appears unchanged in a Process block.",
        ],
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
