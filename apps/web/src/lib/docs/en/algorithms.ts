import type { Doc } from "../types";

export const algorithmsEn: Doc[] = [
  {
    slug: "program-development-life-cycle",
    unit: "algorithms",
    title: "The program development life cycle",
    description: "Analysis, design, coding, and testing, and how decomposition and structure diagrams break a big problem into small ones.",
    updated: "2026-10-31",
    syllabus: "7.1–7.3",
    sections: [
      {
        heading: "Four stages",
        body: ["Programs are built in stages. Each stage feeds the next, and testing often sends you back to fix the design or code."],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Analysis", detail: "Understand the problem: abstraction, decomposition, and a list of requirements." },
            { label: "Design", detail: "Plan the solution with structure diagrams, flowcharts, and pseudocode." },
            { label: "Coding", detail: "Write the program, testing each part as you go (iterative testing)." },
            { label: "Testing", detail: "Run the finished program with test data to check it works as required." },
          ],
        },
      },
      {
        heading: "Abstraction and decomposition",
        body: [
          "**Abstraction** means keeping only the details that matter and ignoring the rest. A train map shows the stations and the order of stops, not the exact bends of the track.",
          "**Decomposition** means breaking a problem into smaller sub-problems that are easier to solve, until each one is simple enough to code. Every computer system is made of sub-systems, which are made of further sub-systems.",
          "When you decompose a problem, identify its **inputs**, **processes**, **outputs**, and **storage**.",
        ],
      },
      {
        heading: "Structure diagrams",
        body: [
          "A **structure diagram** shows decomposition as a tree. The whole system sits at the top, and each level below breaks a box into smaller parts.",
        ],
        visualTitle: "Structure diagram for an alarm clock app",
        visual: {
          kind: "structure",
          root: {
            label: "Alarm clock",
            children: [
              { label: "Set alarm", children: [{ label: "Input time" }, { label: "Save time" }] },
              { label: "Check time", children: [{ label: "Read clock" }, { label: "Compare" }] },
              { label: "Ring alarm", children: [{ label: "Play sound" }, { label: "Snooze" }] },
            ],
          },
        },
      },
      {
        heading: "Ways to design an algorithm",
        body: ["An **algorithm** is a set of steps that solves a problem. You can write the same algorithm in three ways:"],
        bullets: [
          "**Structure diagram:** shows how the problem is broken down, but not the order of steps.",
          "**Flowchart:** shows the steps and decisions as connected shapes.",
          "**Pseudocode:** a structured, language-neutral way to write the steps, close to real code.",
        ],
        callout: { tone: "tip", text: "Next: the flowcharts lesson shows every flowchart symbol. The programming topic covers pseudocode in detail." },
      },
    ],
    keyTerms: [
      { term: "Abstraction", definition: "Removing unnecessary details to focus on what matters." },
      { term: "Decomposition", definition: "Breaking a problem into smaller sub-problems." },
      { term: "Structure diagram", definition: "A tree diagram showing how a system is broken into sub-systems." },
      { term: "Algorithm", definition: "A sequence of steps to solve a problem." },
    ],
    quiz: [
      { question: "Name the four stages of the program development life cycle.", answer: "Analysis, design, coding, testing." },
      { question: "In which stage are structure diagrams and flowcharts produced?", answer: "**Design.**" },
      { question: "What is the difference between abstraction and decomposition?", answer: "Abstraction removes unnecessary detail. Decomposition breaks the problem into smaller parts." },
    ],
  },
  {
    slug: "flowcharts",
    unit: "algorithms",
    title: "Flowcharts",
    description: "The standard flowchart symbols, how to draw selection and loops, and how a flowchart becomes pseudocode.",
    updated: "2026-10-31",
    syllabus: "7.3",
    sections: [
      {
        heading: "The symbols",
        body: ["Each shape has one meaning. Arrows (flow lines) show the order the steps run in."],
        visual: {
          kind: "table",
          columns: ["Shape", "Name", "Used for"],
          rows: [
            ["Rounded rectangle", "Terminator", "`START` and `STOP`"],
            ["Rectangle", "Process", "Calculations and assignments, such as `Total ← Total + Mark`"],
            ["Parallelogram", "Input / output", "`INPUT Mark`, `OUTPUT Total`"],
            ["Diamond", "Decision", "A yes/no question, such as `Mark >= 50?`, with two exits"],
            ["Rectangle with side bars", "Subroutine", "Calling a procedure or function defined elsewhere"],
          ],
        },
      },
      {
        heading: "A loop in a flowchart",
        body: [
          "This flowchart adds up five marks. The decision checks whether five marks have been entered. If not, the **No** arrow loops back to input another mark.",
        ],
        visualTitle: "Total of five marks",
        visual: {
          kind: "flowchart",
          nodes: [
            { shape: "terminator", label: "START" },
            { shape: "process", label: "Total ← 0\nCount ← 0" },
            { shape: "io", label: "INPUT Mark" },
            { shape: "process", label: "Total ← Total + Mark\nCount ← Count + 1" },
            { shape: "decision", label: "Count = 5?" },
            { shape: "io", label: "OUTPUT Total" },
            { shape: "terminator", label: "STOP" },
          ],
          loop: { from: 4, to: 2, label: "No", exitLabel: "Yes" },
        },
      },
      {
        heading: "The same algorithm in pseudocode",
        body: [
          "Each shape becomes a line of pseudocode. The loop that repeats until a condition is true becomes `REPEAT ... UNTIL`.",
        ],
        example: `DECLARE Total : INTEGER
DECLARE Count : INTEGER
DECLARE Mark : INTEGER
Total <- 0
Count <- 0
REPEAT
    INPUT Mark
    Total <- Total + Mark
    Count <- Count + 1
UNTIL Count = 5
OUTPUT Total`,
        callout: { tone: "tip", text: "PseudoEditor's flowchart mode draws any program as a flowchart and turns your edits back into pseudocode. Press Run and it lights up each block as the program reaches it; see the flowchart mode lesson." },
      },
    ],
    keyTerms: [
      { term: "Terminator", definition: "The flowchart symbol for START and STOP." },
      { term: "Decision", definition: "A diamond symbol with a yes/no question and two exits." },
      { term: "Flow line", definition: "An arrow showing the order of steps." },
    ],
    quiz: [
      { question: "Which flowchart symbol is used for `INPUT Age`?", answer: "The **parallelogram** (input / output)." },
      { question: "How many arrows leave a decision symbol?", answer: "**Two**: one for Yes and one for No." },
    ],
  },
  {
    slug: "standard-algorithms",
    unit: "algorithms",
    title: "Searching, sorting, and the standard methods",
    description: "Linear search, bubble sort, totalling, counting, and finding the maximum, minimum, and average, step by step.",
    updated: "2026-10-31",
    syllabus: "7.4",
    sections: [
      {
        heading: "Linear search",
        body: [
          "A **linear search** checks each item in a list in order, from the first to the last, until it finds the target or reaches the end. The list does not need to be sorted.",
        ],
        visualTitle: "Linear search for 23",
        visual: { kind: "search", values: [14, 8, 31, 23, 5, 17, 42], target: 23 },
        example: `DECLARE Numbers : ARRAY[1:7] OF INTEGER
DECLARE Index : INTEGER
DECLARE Target : INTEGER
DECLARE Found : BOOLEAN
FOR Index <- 1 TO 7
    INPUT Numbers[Index]
NEXT Index
INPUT Target
Found <- FALSE
Index <- 1
WHILE Index <= 7 AND NOT Found DO
    IF Numbers[Index] = Target
      THEN
        Found <- TRUE
      ELSE
        Index <- Index + 1
    ENDIF
ENDWHILE
IF Found
  THEN
    OUTPUT "Found at position ", Index
  ELSE
    OUTPUT "Not found"
ENDIF`,
      },
      {
        heading: "Bubble sort",
        body: [
          "A **bubble sort** goes through the list comparing each pair of neighbours and swapping them if they are in the wrong order. After each pass, the largest unsorted item has \"bubbled\" to the end. It stops when a pass makes no swaps.",
          "Press Play and watch the orange pair being compared. Items that are in their final place are filled in.",
        ],
        visualTitle: "Bubble sort",
        visual: { kind: "sort", values: [5, 1, 4, 2, 8, 3] },
        example: `DECLARE Scores : ARRAY[1:6] OF INTEGER
DECLARE Top : INTEGER
DECLARE Index : INTEGER
DECLARE Temp : INTEGER
DECLARE Swap : BOOLEAN
FOR Index <- 1 TO 6
    INPUT Scores[Index]
NEXT Index
Top <- 6
REPEAT
    Swap <- FALSE
    FOR Index <- 1 TO Top - 1
        IF Scores[Index] > Scores[Index + 1]
          THEN
            Temp <- Scores[Index]
            Scores[Index] <- Scores[Index + 1]
            Scores[Index + 1] <- Temp
            Swap <- TRUE
        ENDIF
    NEXT Index
    Top <- Top - 1
UNTIL NOT Swap OR Top = 1`,
        callout: { tone: "tip", text: "Swapping needs a temporary variable. Without `Temp`, the first assignment would overwrite one of the values." },
      },
      {
        heading: "Totalling and counting",
        body: [
          "**Totalling** keeps a running total: start at 0 and add each value. **Counting** adds 1 each time something happens. Both variables must be set to 0 before the loop.",
        ],
        example: `DECLARE Mark : INTEGER
DECLARE Total : INTEGER
DECLARE PassCount : INTEGER
DECLARE Student : INTEGER
Total <- 0
PassCount <- 0
FOR Student <- 1 TO 30
    INPUT Mark
    Total <- Total + Mark
    IF Mark >= 50
      THEN
        PassCount <- PassCount + 1
    ENDIF
NEXT Student
OUTPUT "Total: ", Total
OUTPUT "Passed: ", PassCount`,
      },
      {
        heading: "Maximum, minimum, and average",
        body: [
          "To find the **maximum**, keep the largest value seen so far and replace it whenever a bigger value turns up. The **minimum** works the same way with smaller values. Start both with the first value (or with a value outside the possible range).",
          "The **average** is the total divided by how many values there are.",
        ],
        example: `DECLARE Temps : ARRAY[1:7] OF REAL
DECLARE Day : INTEGER
DECLARE Highest : REAL
DECLARE Lowest : REAL
DECLARE Total : REAL
FOR Day <- 1 TO 7
    INPUT Temps[Day]
NEXT Day
Highest <- Temps[1]
Lowest <- Temps[1]
Total <- 0
FOR Day <- 1 TO 7
    IF Temps[Day] > Highest
      THEN
        Highest <- Temps[Day]
    ENDIF
    IF Temps[Day] < Lowest
      THEN
        Lowest <- Temps[Day]
    ENDIF
    Total <- Total + Temps[Day]
NEXT Day
OUTPUT "Highest: ", Highest
OUTPUT "Lowest: ", Lowest
OUTPUT "Average: ", Total / 7`,
      },
    ],
    keyTerms: [
      { term: "Linear search", definition: "Checking each item in turn until the target is found or the list ends." },
      { term: "Bubble sort", definition: "Repeatedly comparing and swapping neighbouring items until no swaps are needed." },
      { term: "Totalling", definition: "Adding each value to a running total." },
      { term: "Counting", definition: "Adding 1 to a counter each time something happens." },
    ],
    quiz: [
      { question: "What is the most comparisons a linear search makes on a list of 50 items?", answer: "**50**, when the item is last or not in the list." },
      { question: "Why does the bubble sort use a `Swap` flag?", answer: "If a whole pass makes no swaps, the list is already sorted, so the algorithm can stop early." },
      { question: "Why must `Total` be set to 0 before the loop?", answer: "Otherwise it would start with an unknown value and the total would be wrong." },
    ],
  },
  {
    slug: "validation-and-verification",
    unit: "algorithms",
    title: "Validation and verification",
    description: "Range, length, type, presence, format, and check digit checks, plus double entry and visual checks.",
    updated: "2026-10-31",
    syllabus: "7.5",
    sections: [
      {
        heading: "Validation",
        body: [
          "**Validation** is an automatic check by the program that data is **reasonable** and meets set rules before it is accepted. It cannot tell whether the data is correct: an age of 15 passes a range check even if you are 16.",
        ],
        visual: {
          kind: "table",
          columns: ["Check", "Makes sure that...", "Example"],
          rows: [
            ["Range", "A value is between a lower and upper limit", "A percentage is 0 to 100"],
            ["Length", "Data has an exact number, or a minimum/maximum number, of characters", "A password is at least 8 characters"],
            ["Type", "Data is the right data type", "An age is a whole number, not text"],
            ["Presence", "Data has been entered and is not left blank", "An email field is not empty"],
            ["Format", "Data follows a pattern", "A date is DD/MM/YYYY; a code is two letters then four digits"],
            ["Check digit", "A code's final digit matches the one calculated from the others", "ISBNs and barcodes"],
          ],
        },
      },
      {
        heading: "A validation loop",
        body: [
          "A `REPEAT ... UNTIL` loop keeps asking until the input passes. This one does a range check and shows an error message each time the value is rejected.",
        ],
        example: `DECLARE Mark : INTEGER
REPEAT
    OUTPUT "Enter a mark from 0 to 100"
    INPUT Mark
    IF Mark < 0 OR Mark > 100
      THEN
        OUTPUT "Invalid mark, try again"
    ENDIF
UNTIL Mark >= 0 AND Mark <= 100
OUTPUT "Accepted: ", Mark`,
      },
      {
        heading: "A length check",
        body: ["`LENGTH()` returns the number of characters in a string, so it is used for length checks."],
        example: `DECLARE Password : STRING
INPUT Password
WHILE LENGTH(Password) < 8 DO
    OUTPUT "Password must be at least 8 characters"
    INPUT Password
ENDWHILE`,
      },
      {
        heading: "Verification",
        body: [
          "**Verification** checks that data has been **copied or entered accurately**, matching the original.",
        ],
        bullets: [
          "**Double entry:** the data is entered twice and the two entries are compared, as when you type a new password twice.",
          "**Visual check:** the user reads the data on screen and compares it with the original document.",
        ],
        callout: { tone: "key", text: "Validation: is the data sensible? Verification: is the data the same as the original?" },
      },
    ],
    keyTerms: [
      { term: "Validation", definition: "An automated check that data is reasonable before it is accepted." },
      { term: "Verification", definition: "A check that data has been accurately copied or entered." },
      { term: "Range check", definition: "Checks a value lies between set limits." },
      { term: "Double entry", definition: "Entering data twice and comparing the two entries." },
    ],
    quiz: [
      { question: "Which validation check ensures a field is not left blank?", answer: "A **presence check**." },
      { question: "Why can data pass validation and still be wrong?", answer: "Validation only checks data is sensible and follows the rules, not that it is the true value." },
      { question: "Suggest a validation check for a UK postcode such as `CB2 1TN`.", answer: "A **format check** (letters and digits in the right pattern), or a length check." },
    ],
  },
  {
    slug: "testing-and-trace-tables",
    unit: "algorithms",
    title: "Test data and trace tables",
    description: "Normal, abnormal, extreme, and boundary test data, and how to trace an algorithm one line at a time.",
    updated: "2026-10-31",
    syllabus: "7.6–7.8",
    sections: [
      {
        heading: "Types of test data",
        body: ["To test a program properly you need several kinds of data. Take a program that accepts whole-number percentages from 0 to 100:"],
        visual: {
          kind: "table",
          columns: ["Type", "Meaning", "Examples for 0–100", "Expected result"],
          rows: [
            ["Normal", "Ordinary data that should be accepted", "45, 72", "Accepted"],
            ["Abnormal", "Data that should be rejected", "−20, 150, \"abc\"", "Rejected"],
            ["Extreme", "The largest and smallest values that should be accepted", "0, 100", "Accepted"],
            ["Boundary", "The values at each limit and just beyond it", "0 and −1, 100 and 101", "0 and 100 accepted, −1 and 101 rejected"],
          ],
        },
        callout: { tone: "tip", text: "For boundary data, always give a pair: the last accepted value and the first rejected value." },
      },
      {
        heading: "Trace tables",
        body: [
          "A **trace table** records the value of every variable as an algorithm runs, line by line. It lets you check what an algorithm does, find logic errors, and work out its output without a computer.",
          "Here is an algorithm that adds up only the positive numbers it is given. Step through its trace with the inputs 5, −2, 7, 3.",
        ],
        example: `DECLARE Total : INTEGER
DECLARE Count : INTEGER
DECLARE Number : INTEGER
Total <- 0
FOR Count <- 1 TO 4
    INPUT Number
    IF Number > 0
      THEN
        Total <- Total + Number
    ENDIF
NEXT Count
OUTPUT Total`,
        exampleFirst: true,
        visualTitle: "Trace table, inputs 5, −2, 7, 3",
        visual: {
          kind: "trace",
          stepper: true,
          columns: ["Count", "Number", "Total", "OUTPUT"],
          rows: [
            ["", "", "0", ""],
            ["1", "5", "5", ""],
            ["2", "−2", "5", ""],
            ["3", "7", "12", ""],
            ["4", "3", "15", ""],
            ["", "", "", "15"],
          ],
        },
        caption: "When the input is −2 the condition is false, so `Total` stays at 5.",
      },
      {
        heading: "Finding errors",
        body: [
          "A **syntax error** breaks the rules of the language, such as a missing `ENDIF`, and stops the program being translated. A **logic error** lets the program run but gives the wrong result.",
          "This algorithm should output the largest of 10 numbers, but it has a logic error. Can you spot it?",
        ],
        example: `DECLARE Largest : INTEGER
DECLARE Number : INTEGER
DECLARE Count : INTEGER
Largest <- 0
FOR Count <- 1 TO 10
    INPUT Number
    IF Number < Largest
      THEN
        Largest <- Number
    ENDIF
NEXT Count
OUTPUT Largest`,
        callout: {
          tone: "warn",
          text: "The comparison should be `Number > Largest`. Also, starting `Largest` at 0 fails if every number is negative. Starting with the first number input is safer.",
        },
      },
    ],
    keyTerms: [
      { term: "Normal data", definition: "Data within the accepted range that should be accepted." },
      { term: "Abnormal data", definition: "Data that should be rejected." },
      { term: "Extreme data", definition: "The largest and smallest values that should be accepted." },
      { term: "Boundary data", definition: "Values at the edge of the accepted range and just outside it." },
      { term: "Trace table", definition: "A table that records variable values as an algorithm runs." },
      { term: "Logic error", definition: "An error that lets a program run but produces the wrong result." },
    ],
    quiz: [
      { question: "A program accepts ages 11 to 18. Give boundary test data.", answer: "10 and 11 (lower), 18 and 19 (upper). 11 and 18 are accepted, 10 and 19 rejected." },
      { question: "Is \"twelve\" normal, abnormal, extreme, or boundary data for an age field?", answer: "**Abnormal**: it is the wrong data type and should be rejected." },
      { question: "What is the difference between a syntax error and a logic error?", answer: "A syntax error breaks the language rules so the code will not translate. A logic error runs but gives the wrong result." },
    ],
  },
];
