import type { Doc } from "../types";

export const pseudocodeReferenceEn: Doc[] = [
  {
    slug: "writing-workflow",
    unit: "pseudocode-reference",
    title: "Writing an exam-style answer",
    description:
      "A step-by-step routine for Cambridge-style pseudocode answers: plan inputs and outputs, lay out the program, read command words, and check your work.",
    updated: "2026-11-02",
    sections: [
      {
        heading: "Where these conventions come from",
        body: [
          "The pseudocode reference follows the Cambridge IGCSE Computer Science (0478) conventions for 2026 to 2028, from the assessment details in the syllabus (pages 35 to 49). Choose another exam syntax in Settings and the compiler, highlighting, and autocomplete follow that board instead.",
        ],
        callout: {
          tone: "key",
          text: "Cambridge's printed examples use a left arrow `←` for assignment. In the editor, type `<-`.",
        },
      },
      {
        heading: "Seven steps for every question",
        body: ["Work through the same steps each time. Most logic errors come from skipping one of them."],
        bullets: [
          "Read the question and list the inputs and outputs it asks for.",
          "Declare every variable and array with the right data type.",
          "Set counters, totals, and flags before any loop uses them.",
          "Choose selection and loop types from the conditions in the question.",
          "Write the processing in small, readable blocks.",
          "Output the results after processing.",
          "Dry-run the program with normal values and edge cases.",
        ],
      },
      {
        heading: "Lay out the program",
        body: [
          "A clear answer has four parts in order: declarations and constants, initial values, input and processing, then output. Comments that label each part help the examiner follow your logic.",
        ],
        example: `// 1) Declarations and constants
DECLARE Index : INTEGER
DECLARE Value : INTEGER
DECLARE Total : INTEGER
CONSTANT MaxItems <- 5

// 2) Initialisation
Total <- 0

// 3) Input and processing
FOR Index <- 1 TO MaxItems
    INPUT Value
    Total <- Total + Value
NEXT Index

// 4) Output
OUTPUT "Total = ", Total`,
      },
      {
        heading: "Exam command words",
        body: ["The command word tells you what kind of answer earns the marks."],
        visual: {
          kind: "table",
          columns: ["Command word", "What your answer needs"],
          rows: [
            ["Calculate", "Work out a result from the facts, figures, or information given."],
            ["Compare", "Identify similarities and differences, and comment on them."],
            ["Define", "Give the precise meaning."],
            ["Demonstrate", "Show how, or give an example."],
            ["Describe", "State the points, characteristics, and main features."],
            ["Evaluate", "Judge the quality, importance, amount, or value."],
            ["Explain", "Give reasons, show relationships, and support them with evidence."],
            ["Give", "Produce an answer from source material or recall."],
            ["Identify", "Name, select, or recognise."],
            ["Outline", "Set out the main points."],
            ["Show (that)", "Provide structured evidence that leads to a result."],
            ["State", "Express in clear terms."],
            ["Suggest", "Apply your knowledge to give valid proposals or considerations."],
          ],
        },
      },
      {
        heading: "Check before you submit",
        body: ["Run the program, then go through this list."],
        bullets: [
          "Every variable and array is declared with the correct data type.",
          "Counters, totals, and flags have initial values.",
          "The loop type fits the question: `FOR`, `WHILE`, or `REPEAT ... UNTIL`.",
          "Every `IF`, `CASE`, and loop block has its closing keyword.",
          "Procedures are called with `CALL`; function calls appear inside expressions.",
          "The output matches what the question asks for, word for word.",
          "Library routines such as `ROUND` and `RANDOM` use the correct syntax.",
          "You have dry-run the program with normal and edge-case inputs.",
        ],
      },
    ],
  },
  {
    slug: "syntax",
    unit: "pseudocode-reference",
    title: "Pseudocode syntax reference",
    description:
      "Statements, names, data types, constants, operators, library routines, and block endings supported by the browser compiler.",
    updated: "2026-11-02",
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
        heading: "Names, comments, and layout",
        body: ["Consistent names and layout make a program easier to mark and easier to debug."],
        bullets: [
          "Write keywords in upper case: `IF`, `FOR`, `WHILE`, `PROCEDURE`.",
          "Write identifiers in PascalCase, starting with a capital letter, such as `RowTotal`.",
          "Don't use underscores in identifiers.",
          "Start a comment with `//`.",
          "Indent the body of every block by four spaces.",
        ],
      },
      {
        heading: "Data types and constants",
        body: [
          "Declare a variable with `DECLARE Name : TYPE` before you use it. Declare a constant with `CONSTANT Name <- value`. A constant's value must be a literal, not an expression.",
        ],
        visual: {
          kind: "table",
          columns: ["Type", "Holds", "Example"],
          rows: [
            ["`INTEGER`", "A whole number", "`42`"],
            ["`REAL`", "A number with a fractional part", "`3.142`"],
            ["`CHAR`", "A single character", "`'M'`"],
            ["`STRING`", "Text of any length", "`\"Mai\"`"],
            ["`BOOLEAN`", "A truth value", "`TRUE` or `FALSE`"],
          ],
        },
        example: `CONSTANT Pi <- 3.142
DECLARE Radius : REAL
DECLARE Initial : CHAR
DECLARE Name : STRING
DECLARE Passed : BOOLEAN
Radius <- 2.5
Initial <- 'M'
Name <- "Mai"
Passed <- TRUE
OUTPUT Name, " ", Initial, " ", Pi * Radius ^ 2, " ", Passed`,
      },
      {
        heading: "Operators",
        body: ["Comparisons and logical operators produce a `BOOLEAN`, so you can use them directly in `IF`, `WHILE`, and `UNTIL` conditions."],
        visual: {
          kind: "table",
          columns: ["Kind", "Operators"],
          rows: [
            ["Arithmetic", "`+` `-` `*` `/` `^`"],
            ["Integer division", "`DIV(a, b)` gives the whole-number quotient; `MOD(a, b)` gives the remainder"],
            ["Comparison", "`=` `<` `<=` `>` `>=` `<>`"],
            ["Logical", "`AND` `OR` `NOT`"],
          ],
        },
      },
      {
        heading: "Library routines",
        body: [
          "These routines are built in and appear in autocomplete. `ROUND` returns a `REAL`, so store its result in a `REAL` variable.",
        ],
        visual: {
          kind: "table",
          columns: ["Routine", "Returns"],
          rows: [
            ["`LENGTH(Text)`", "The number of characters in a string"],
            ["`LCASE(Text)`, `UCASE(Text)`", "The string in lower or upper case"],
            ["`SUBSTRING(Text, Start, Length)`", "Part of a string; the first character is position 1"],
            ["`ROUND(Value, Places)`", "A real number rounded to that many decimal places"],
            ["`RANDOM()`", "A random real number from 0 to 1 inclusive"],
          ],
        },
        example: `DECLARE Phrase : STRING
DECLARE Roll : REAL
Phrase <- "Happy Days"
OUTPUT LENGTH(Phrase)
OUTPUT LCASE(Phrase), " ", UCASE(Phrase)
OUTPUT SUBSTRING(Phrase, 1, 5)
OUTPUT ROUND(15.6789, 2)
OUTPUT DIV(17, 5), " ", MOD(17, 5)
Roll <- ROUND(RANDOM() * 5, 0) + 1
OUTPUT Roll`,
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
    slug: "choosing-a-loop",
    unit: "pseudocode-reference",
    title: "Choosing a loop",
    description: "When to use FOR, WHILE, or REPEAT UNTIL, how nested loops work, and how to make sure every loop ends.",
    updated: "2026-11-02",
    sections: [
      {
        heading: "Which loop to use",
        body: [
          "Choosing the wrong loop, or writing one that never stops, is a common way to lose marks. The difference is when the condition is checked.",
        ],
        visual: {
          kind: "table",
          columns: ["Loop", "Condition checked", "Runs at least once?", "Use it when"],
          rows: [
            ["`FOR`", "Never: it counts through a range", "Yes, unless the range is empty", "You know how many times to repeat"],
            ["`WHILE`", "Before each pass", "No", "The loop might not need to run at all"],
            ["`REPEAT ... UNTIL`", "After each pass", "Yes", "The body must run once, such as asking for input"],
          ],
        },
      },
      {
        heading: "Count with FOR",
        body: [
          "Both bounds are included, so `FOR Count <- 1 TO 5` runs five times. Add `STEP` to count in a different step, including backwards: `FOR Count <- 10 TO 0 STEP -2`.",
        ],
        example: `DECLARE Count : INTEGER
DECLARE Total : INTEGER
Total <- 0

FOR Count <- 1 TO 5
    Total <- Total + Count
NEXT Count

OUTPUT "Total = ", Total`,
        visual: { kind: "trace", columns: ["Count", "Total"], rows: [["–", "0"], ["1", "1"], ["2", "3"], ["3", "6"], ["4", "10"], ["5", "15"]], stepper: true },
        visualTitle: "Trace: Total after each pass",
        exampleFirst: true,
      },
      {
        heading: "Repeat while a condition holds with WHILE",
        body: [
          "The condition is checked before every pass. If it is `FALSE` at the start, the body never runs. Something inside the body must change so the condition can become `FALSE`.",
        ],
        example: `DECLARE Number : INTEGER
INPUT Number

WHILE Number > 9 DO
    Number <- Number - 9
ENDWHILE

OUTPUT Number`,
        visual: {
          kind: "trace",
          columns: ["Number", "Number > 9", "What happens"],
          rows: [
            ["28", "TRUE", "Subtract 9"],
            ["19", "TRUE", "Subtract 9"],
            ["10", "TRUE", "Subtract 9"],
            ["1", "FALSE", "Exit and output 1"],
          ],
          stepper: true,
        },
        visualTitle: "Trace with input 28",
        exampleFirst: true,
      },
      {
        heading: "Validate input with REPEAT UNTIL",
        body: [
          "The body runs first and the condition is tested afterwards, so the user is always asked at least once. Write the `UNTIL` condition as the valid or finished state, not the invalid one.",
          "If the first entry is wrong, the loop asks again. If it is right, the loop ends after one pass.",
        ],
        example: `DECLARE Password : STRING

REPEAT
    OUTPUT "Enter password"
    INPUT Password
UNTIL Password = "Secret"`,
      },
      {
        heading: "Nested loops for tables and grids",
        body: [
          "Use one loop inside another to process rows and columns, such as a 2D array. The inner loop finishes all its passes for each pass of the outer loop. Reset per-row totals before the inner loop starts.",
        ],
        example: `DECLARE Row : INTEGER
DECLARE Column : INTEGER
DECLARE RowTotal : INTEGER
DECLARE GrandTotal : INTEGER
DECLARE Amount : ARRAY[1:3, 1:4] OF INTEGER

FOR Row <- 1 TO 3
    FOR Column <- 1 TO 4
        Amount[Row, Column] <- Row * Column
    NEXT Column
NEXT Row

GrandTotal <- 0
FOR Row <- 1 TO 3
    RowTotal <- 0
    FOR Column <- 1 TO 4
        RowTotal <- RowTotal + Amount[Row, Column]
    NEXT Column
    OUTPUT "Row ", Row, " total = ", RowTotal
    GrandTotal <- GrandTotal + RowTotal
NEXT Row

OUTPUT "Grand total = ", GrandTotal`,
        callout: { tone: "tip", text: "Run it: the rows total 10, 20, and 30, and the grand total is 60." },
      },
      {
        heading: "Make sure every loop ends",
        body: ["Before you run a loop, check it against these questions."],
        bullets: [
          "Does each pass change something the condition depends on?",
          "Can the condition eventually become `FALSE` for `WHILE`, or `TRUE` for `UNTIL`?",
          "Are the bounds right, with no off-by-one mistakes?",
          "Did you set counters and totals before the loop?",
        ],
        callout: {
          tone: "warn",
          text: "If a program never finishes, it is usually stuck in a loop. Stop it, then trace the loop's condition through two or three passes.",
        },
      },
    ],
  },
  {
    slug: "worked-programs",
    unit: "pseudocode-reference",
    title: "Worked programs",
    description: "Four complete exam-style programs with explanations and sample runs: counting marks, validating a menu, searching an array, and using subroutines.",
    updated: "2026-11-02",
    sections: [
      {
        heading: "Program A: count passes and find the average",
        body: ["Read 5 marks, count how many are passes (50 or more), and output the average."],
        example: `DECLARE Index : INTEGER
DECLARE Mark : INTEGER
DECLARE Total : INTEGER
DECLARE PassCount : INTEGER
DECLARE Average : REAL

Total <- 0
PassCount <- 0

FOR Index <- 1 TO 5
    OUTPUT "Enter mark ", Index
    INPUT Mark
    Total <- Total + Mark

    IF Mark >= 50
      THEN
        PassCount <- PassCount + 1
    ENDIF
NEXT Index

Average <- Total / 5
OUTPUT "Passes = ", PassCount
OUTPUT "Average = ", Average`,
        exampleFirst: true,
        bullets: [
          "There are exactly 5 marks, so a count-controlled `FOR` loop fits.",
          "`Total` adds up every mark; `PassCount` only goes up when the `IF` condition is true.",
          "The average is worked out once, after the loop ends.",
        ],
        visual: {
          kind: "trace",
          columns: ["Mark", "Total", "PassCount"],
          rows: [
            ["42", "42", "0"],
            ["50", "92", "1"],
            ["74", "166", "2"],
            ["21", "187", "2"],
            ["90", "277", "3"],
          ],
          stepper: true,
        },
        visualTitle: "Sample run",
        caption: "Output: Passes = 3, Average = 55.4",
      },
      {
        heading: "Program B: accept only a valid menu choice",
        body: ["Keep asking until the user enters a choice from 1 to 4."],
        example: `DECLARE Choice : INTEGER

REPEAT
    OUTPUT "1.View 2.Add 3.Delete 4.Exit"
    INPUT Choice
UNTIL Choice >= 1 AND Choice <= 4

OUTPUT "Accepted choice: ", Choice`,
        exampleFirst: true,
        bullets: [
          "`REPEAT ... UNTIL` fits because the user must see the menu at least once.",
          "The condition says what a valid choice is, not what an invalid one is.",
          "`AND` checks the lower and upper bounds together.",
        ],
        visual: {
          kind: "table",
          columns: ["Input", "Valid?", "What happens"],
          rows: [
            ["8", "No", "Asks again"],
            ["0", "No", "Asks again"],
            ["3", "Yes", "Outputs `Accepted choice: 3`"],
          ],
        },
        visualTitle: "Sample run",
      },
      {
        heading: "Program C: search an array with a flag",
        body: ["Find out whether a name the user enters is in the array `StudentNames`."],
        example: `DECLARE StudentNames : ARRAY[1:5] OF STRING
DECLARE Index : INTEGER
DECLARE Target : STRING
DECLARE Found : BOOLEAN

StudentNames[1] <- "Mia"
StudentNames[2] <- "Tom"
StudentNames[3] <- "Ali"
StudentNames[4] <- "Zoe"
StudentNames[5] <- "Sam"

INPUT Target
Found <- FALSE
FOR Index <- 1 TO 5
    IF StudentNames[Index] = Target
      THEN
        Found <- TRUE
    ENDIF
NEXT Index

IF Found = TRUE
  THEN
    OUTPUT "Found"
  ELSE
    OUTPUT "Not found"
ENDIF`,
        bullets: [
          "`Found` starts as `FALSE` and becomes `TRUE` when a name matches.",
          "This version checks every item. Examiners usually accept it because it is clear.",
          "The final `IF` uses the flag to output one message. Enter `Ali` and the output is `Found`.",
        ],
      },
      {
        heading: "Program D: a procedure and a function together",
        body: ["Use a procedure to display a line and a function to do a calculation."],
        example: `PROCEDURE PrintLine(Count : INTEGER)
    DECLARE Index : INTEGER
    FOR Index <- 1 TO Count
        OUTPUT "-"
    NEXT Index
ENDPROCEDURE

FUNCTION SumSquare(A : INTEGER, B : INTEGER) RETURNS INTEGER
    RETURN A * A + B * B
ENDFUNCTION

DECLARE Answer : INTEGER
CALL PrintLine(10)
Answer <- SumSquare(3, 4)
OUTPUT "Answer = ", Answer`,
        bullets: [
          "A procedure call is a statement on its own, so it starts with `CALL`.",
          "A function returns a value, so its call goes inside an expression.",
          "`PrintLine(10)` outputs 10 dashes, and `SumSquare(3, 4)` returns 25, so the last line is `Answer = 25`.",
        ],
      },
    ],
  },
  {
    slug: "trace-tables",
    unit: "pseudocode-reference",
    title: "Trace tables and dry runs",
    description: "Track how variables change, pass by pass, to catch logic errors before the examiner does.",
    updated: "2026-11-02",
    sections: [
      {
        heading: "Why dry-run a program",
        body: [
          "A program can compile and still give the wrong answer. A dry run means following the program by hand with sample values and writing down each variable after it changes. In an exam, a quick trace catches most logic mistakes.",
        ],
      },
      {
        heading: "Trace a factorial loop",
        body: ["This program works out N factorial. Give each changing variable its own column and add a row for every pass of the loop."],
        example: `DECLARE N : INTEGER
DECLARE Fact : INTEGER
DECLARE I : INTEGER

INPUT N
Fact <- 1
FOR I <- 1 TO N
    Fact <- Fact * I
NEXT I
OUTPUT Fact`,
        exampleFirst: true,
        visual: {
          kind: "trace",
          columns: ["I", "Fact before", "Fact after Fact <- Fact * I"],
          rows: [
            ["1", "1", "1"],
            ["2", "1", "2"],
            ["3", "2", "6"],
            ["4", "6", "24"],
            ["5", "24", "120"],
          ],
          stepper: true,
        },
        visualTitle: "Trace with N = 5",
        caption: "The expected output is 120.",
      },
      {
        heading: "When the trace and the output disagree",
        body: [
          "Run the program with the same input you traced. If the output is different, check the loop bounds and the starting values first: starting `Fact` at 0, or looping from 0, are the usual causes.",
          "On a desktop or laptop, flowchart mode replays the run block by block, which lets you compare each step with your table.",
        ],
      },
    ],
  },
  {
    slug: "reading-writing-files",
    unit: "pseudocode-reference",
    title: "Reading and writing files",
    description: "Open, read, write, and close text files in Cambridge-style pseudocode.",
    updated: "2026-11-02",
    sections: [
      {
        heading: "Four steps",
        body: ["Every file operation follows the same pattern."],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Declare", detail: "The file name and data variables" },
            { label: "Open", detail: "`OPENFILE` with `FOR READ` or `FOR WRITE`" },
            { label: "Read or write", detail: "`READFILE` or `WRITEFILE`" },
            { label: "Close", detail: "`CLOSEFILE` when you finish" },
          ],
        },
      },
      {
        heading: "Read a line",
        body: ["`READFILE` reads the next line of the file into a string variable."],
        example: `DECLARE FileName : STRING
DECLARE LineText : STRING

FileName <- "Scores.txt"
OPENFILE FileName FOR READ
READFILE FileName, LineText
OUTPUT "First line: ", LineText
CLOSEFILE FileName`,
      },
      {
        heading: "Write a line",
        body: ["`WRITEFILE` writes a line to a file opened `FOR WRITE`."],
        example: `DECLARE FileName : STRING

FileName <- "Scores.txt"
OPENFILE FileName FOR WRITE
WRITEFILE FileName, "Mai,42"
CLOSEFILE FileName`,
        callout: {
          tone: "warn",
          text: "Don't open the same file for `READ` and `WRITE` at the same time, and always close a file, even in a short algorithm.",
        },
      },
    ],
  },
];
