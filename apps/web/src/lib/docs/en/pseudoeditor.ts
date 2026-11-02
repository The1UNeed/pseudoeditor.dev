import type { Doc } from "../types";

export const pseudoeditorEn: Doc[] = [
  {
    slug: "pseudocode-compiler",
    unit: "pseudoeditor",
    title: "How to compile and run pseudocode online",
    description: "Use PseudoEditor's free online pseudocode compiler and runner. Choose an exam syntax, run a loop, check its output, and fix compiler errors.",
    updated: "2026-11-01",
    sections: [
      {
        heading: "What does a pseudocode compiler accept?",
        body: [
          "A pseudocode compiler, sometimes shortened to pseudocompiler, checks programs written in a defined pseudocode notation. Pseudocode has no universal executable syntax, so an informal algorithm written in English may need to be rewritten before it can run.",
          "PseudoEditor supports Cambridge IGCSE, Cambridge AS and A Level, IB Diploma Programme, OCR GCSE, and AQA GCSE notation. Open Settings and choose your exam syntax before running a program. The compiler, syntax highlighting, and autocomplete follow that choice.",
        ],
      },
      {
        heading: "Compiler, runner, and pseudo emulator",
        body: [
          "The compiler tokenizes your code, parses its structure, and checks for errors such as undeclared variables and incompatible types. If the checks pass, it produces an abstract syntax tree, or AST.",
          "The runner executes that AST using a Rust runtime compiled to WebAssembly in your browser. It handles assignments, conditions, loops, input, and output. A runner is sometimes called a pseudocode interpreter or pseudo emulator. It executes the supported pseudocode instructions rather than emulating computer hardware.",
        ],
      },
      {
        heading: "Run a program and check the result",
        body: [
          "Open the editor, create a file called `total.pseudo`, and select Cambridge IGCSE in Settings. Paste this program and choose Run. The terminal should print `Total = 15`.",
          "The loop adds 1, 2, 3, 4, and 5. Change the upper bound from 5 to 3 and run again: the expected output is `Total = 6`. Initializing Total to zero makes the starting value explicit.",
        ],
        example: `DECLARE Number : INTEGER
DECLARE Total : INTEGER
Total <- 0
FOR Number <- 1 TO 5
    Total <- Total + Number
NEXT Number
OUTPUT "Total = ", Total`,
      },
      {
        heading: "Use a browser without installing Visual Studio Code",
        body: [
          "PseudoEditor is a standalone pseudocode editor with a built-in compiler and runner. You can use it in a modern browser without installing Visual Studio Code or an extension. Write and run code without an account; sign in if you want cloud workspace saving.",
          "When a program reaches INPUT, enter a value in the terminal and submit it to continue. On a phone, open the Output tab to see the terminal. On a desktop or laptop, flowchart mode lets you follow the recorded run block by block.",
        ],
      },
      {
        heading: "Fix errors, then test your algorithm",
        body: [
          "If compilation fails, read the first diagnostic and check its line and column. Common causes are a misspelled variable, a missing block ending, or syntax from a different exam board. Fix that error and run again before working through later diagnostics.",
          "A successful compilation checks syntax and types; it does not prove that the algorithm solves the problem. Compare output with results you worked out by hand, test boundary inputs, and trace branches and loops. The syntax reference and debugging guides explain the supported statements and common errors.",
        ],
      },
    ],
  },
  {
    slug: "getting-started",
    unit: "pseudoeditor",
    title: "Getting started with the studio editor",
    description: "Create a file, run your first pseudocode program, enter input, and save your work.",
    updated: "2026-11-01",
    sections: [
      {
        heading: "Create your first file",
        body: [
          "Open the studio editor and choose Create File in the Explorer. Give the file a name such as `hello.pseudo`, then choose Create & Open. On a phone, open the Files tab to find the Explorer.",
          "Open Settings and set Exam syntax to the board you study. The example below uses Cambridge IGCSE. Return to the Editor and type or paste the program into your file.",
        ],
      },
      {
        heading: "First program",
        body: ["This program reads a name and prints a greeting. Keep one statement per line so errors are easy to find."],
        example: `DECLARE Name : STRING
INPUT Name
OUTPUT "Hello ", Name`,
      },
      {
        heading: "Run and enter input",
        body: [
          "Choose Run in the toolbar. The editor compiles the active file and starts the program. When it reaches `INPUT Name`, type a name in Terminal input and press Enter or choose Send.",
          "If you enter Mai, the program should print `Hello Mai`. Change the greeting and run again to see your edit take effect. On a phone, use the Output tab to see the result.",
        ],
      },
      {
        heading: "Save your work",
        body: [
          "Choose Save workspace before leaving. On the website, sign in to save your workspace to your account. Check that the status says Saved before you close the page.",
          "You can write and run without an account. If you stay signed out, keep a copy of your code before refreshing or closing the tab.",
        ],
      },
    ],
  },
  {
    slug: "workspace-files",
    unit: "pseudoeditor",
    title: "Organise files in the studio",
    description: "Create files and folders, switch between programs, and rename or move items in the Explorer.",
    updated: "2026-11-01",
    sections: [
      {
        heading: "Create and open files",
        body: [
          "Choose Create File in the Explorer, enter a file name, then choose Create & Open. Select a file in the Explorer to open it. The active tab is the program that Run will compile.",
          "Closing a tab keeps the file in your workspace. You can open it again from the Explorer. On a phone, switch between the Files and Editor tabs.",
        ],
      },
      {
        heading: "Group programs in folders",
        body: [
          "Choose Create Folder to group related work, such as lessons or practice attempts. Open a folder's actions to create a file or another folder inside it.",
          "Use an item's actions to rename it or change its position. Check the file name before choosing Delete and confirming the deletion.",
        ],
      },
    ],
  },
  {
    slug: "debugging-errors",
    unit: "pseudoeditor",
    title: "Debugging compiler errors",
    description:
      "Use diagnostics, line numbers, and generated output to fix pseudocode syntax and logic problems.",
    updated: "2026-11-01",
    sections: [
      {
        heading: "Read the first error first",
        body: [
          "Choose Run and read the diagnostics below the editor. Syntax problems often cascade. Fix the earliest error, run again, and then move to the next diagnostic.",
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
    title: "Saving your workspace",
    description: "Save your files to your account, set up autosave, and keep a copy of signed-out work.",
    updated: "2026-11-01",
    sections: [
      {
        heading: "Save to your account",
        body: [
          "On the website, sign in and choose Save workspace. This saves the files and folders in your workspace to your account so you can return to them on another device.",
          "Wait for Saved before closing the page. If saving fails, keep the tab open, check the message shown by the editor, and try again.",
        ],
      },
      {
        heading: "Autosave and signed-out work",
        body: [
          "Open Settings to set the Autosave interval. You can still choose Save workspace whenever you want to save immediately.",
          "Signed-out editing on the website keeps work in the current session. Sign in to save, or copy your code somewhere safe before you refresh or close the tab. Local development uses browser storage on that device.",
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
