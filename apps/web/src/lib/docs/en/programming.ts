import type { Doc } from "../types";

export const programmingEn: Doc[] = [
  {
    slug: "variables-input-output",
    unit: "programming",
    title: "Variables, constants, data types, and input/output",
    description: "Store values in variables and constants, choose the right data type, and use INPUT and OUTPUT.",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "Variables are labelled boxes",
        body: [
          "A **variable** is a named location in memory that stores a value. The value can change while the program runs. Think of it as a labelled box: the name is on the label, the value is inside.",
          "In pseudocode, declare each variable with its data type, then use `<-` to put a value into it. Assignment replaces whatever was in the box before.",
        ],
        example: `DECLARE Score : INTEGER
Score <- 10
Score <- Score + 5
OUTPUT Score`,
        callout: { tone: "key", text: "`Score <- Score + 5` means: take the value in Score, add 5, and put the answer back in Score. It is not an equation." },
      },
      {
        heading: "Constants",
        body: [
          "A **constant** is a named value that cannot change while the program runs. Using a constant means the value is written in one place, so it is easy to update and impossible to change by accident.",
        ],
        example: `CONSTANT VatRate <- 0.2
DECLARE Price : REAL
INPUT Price
OUTPUT "Price with VAT: ", Price * (1 + VatRate)`,
      },
      {
        heading: "Data types",
        body: ["Every variable has a data type that sets what it can hold:"],
        visual: {
          kind: "table",
          columns: ["Type", "Holds", "Examples"],
          rows: [
            ["`INTEGER`", "Whole numbers", "`42`, `-7`, `0`"],
            ["`REAL`", "Numbers with a decimal part", "`3.14`, `-0.5`, `19.99`"],
            ["`CHAR`", "A single character", "`'A'`, `'7'`, `'?'`"],
            ["`STRING`", "Text: zero or more characters", "`\"Hello\"`, `\"07700 900123\"`"],
            ["`BOOLEAN`", "TRUE or FALSE", "`TRUE`, `FALSE`"],
          ],
        },
        callout: { tone: "tip", text: "Phone numbers are stored as STRING, not INTEGER: they can start with 0, contain spaces, and you never do maths with them." },
      },
      {
        heading: "Input and output",
        body: [
          "`INPUT` waits for the user to type a value and stores it in a variable. `OUTPUT` displays values. Separate several values with commas.",
          "In PseudoEditor, the terminal asks for each `INPUT` while the program runs, so you can test interactive programs in the browser.",
        ],
        example: `DECLARE Name : STRING
DECLARE Age : INTEGER
OUTPUT "What is your name?"
INPUT Name
OUTPUT "How old are you?"
INPUT Age
OUTPUT "Hello ", Name, ", next year you will be ", Age + 1`,
      },
      {
        heading: "Sequence",
        body: [
          "**Sequence** means statements run one after another, in order, from top to bottom. Changing the order changes the result: in the program above, the age must be input before it is used.",
        ],
      },
    ],
    keyTerms: [
      { term: "Variable", definition: "A named memory location whose value can change while the program runs." },
      { term: "Constant", definition: "A named value that cannot change while the program runs." },
      { term: "Data type", definition: "The kind of data a variable holds, such as INTEGER or STRING." },
      { term: "Sequence", definition: "Instructions executed one after another in order." },
    ],
    quiz: [
      { question: "What data type should store whether a door is locked?", answer: "`BOOLEAN`, since it is either TRUE or FALSE." },
      { question: "What is output by: `X <- 4`, `X <- X * 3`, `OUTPUT X`?", answer: "**12**." },
      { question: "Give one reason to use a constant instead of typing the value each time.", answer: "If the value changes it only needs updating in one place, and it cannot be changed by mistake while the program runs." },
    ],
  },
  {
    slug: "selection",
    unit: "programming",
    title: "Selection with IF and CASE",
    description: "Make decisions with IF, ELSE, nested IF statements, and CASE OF, using comparison and Boolean operators.",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "IF ... THEN ... ELSE",
        body: [
          "**Selection** lets a program choose which statements to run. An `IF` statement checks a condition. If it is TRUE, the `THEN` block runs. If it is FALSE, the optional `ELSE` block runs instead.",
        ],
        visualTitle: "Which path runs?",
        visual: {
          kind: "trace",
          stepper: true,
          columns: ["Mark", "Mark >= 50", "OUTPUT"],
          rows: [
            ["72", "TRUE", "Pass"],
            ["50", "TRUE", "Pass"],
            ["49", "FALSE", "Try again"],
            ["0", "FALSE", "Try again"],
          ],
        },
        caption: "50 is the boundary: `>=` includes it, `>` would not.",
        exampleFirst: true,
        example: `DECLARE Mark : INTEGER
INPUT Mark
IF Mark >= 50
  THEN
    OUTPUT "Pass"
  ELSE
    OUTPUT "Try again"
ENDIF`,
      },
      {
        heading: "Comparison operators",
        body: ["Conditions are built from comparisons, which always give TRUE or FALSE:"],
        visual: {
          kind: "table",
          columns: ["Operator", "Meaning", "Example that is TRUE"],
          rows: [
            ["`=`", "equal to", "`5 = 5`"],
            ["`<>`", "not equal to", "`5 <> 3`"],
            ["`<`", "less than", "`3 < 5`"],
            ["`<=`", "less than or equal to", "`5 <= 5`"],
            ["`>`", "greater than", "`7 > 2`"],
            ["`>=`", "greater than or equal to", "`7 >= 7`"],
          ],
        },
      },
      {
        heading: "AND, OR, NOT",
        body: [
          "Boolean operators combine conditions. `AND` is TRUE only if both sides are TRUE. `OR` is TRUE if at least one side is TRUE. `NOT` flips TRUE and FALSE.",
        ],
        example: `DECLARE Age : INTEGER
DECLARE Ticket : STRING
INPUT Age
INPUT Ticket
IF Age >= 12 AND Ticket = "Y"
  THEN
    OUTPUT "Enjoy the film"
  ELSE
    OUTPUT "Sorry, you cannot go in"
ENDIF`,
      },
      {
        heading: "Nested IF",
        body: [
          "An `IF` can sit inside another `IF`. The inner condition is only checked when the outer one is TRUE. Indent each level so you can see which `ENDIF` closes which `IF`.",
        ],
        example: `DECLARE Mark : INTEGER
INPUT Mark
IF Mark >= 70
  THEN
    OUTPUT "Grade A"
  ELSE
    IF Mark >= 50
      THEN
        OUTPUT "Grade B"
      ELSE
        OUTPUT "Grade C"
    ENDIF
ENDIF`,
      },
      {
        heading: "CASE OF",
        body: [
          "When one variable is compared against several fixed values, `CASE OF` is shorter and clearer than many nested IFs. `OTHERWISE` catches every value not listed.",
        ],
        example: `DECLARE Choice : INTEGER
OUTPUT "1 Play  2 Settings  3 Quit"
INPUT Choice
CASE OF Choice
    1 : OUTPUT "Starting game"
    2 : OUTPUT "Opening settings"
    3 : OUTPUT "Goodbye"
    OTHERWISE : OUTPUT "Invalid choice"
ENDCASE`,
      },
    ],
    keyTerms: [
      { term: "Selection", definition: "Choosing which statements to run based on a condition." },
      { term: "Condition", definition: "An expression that evaluates to TRUE or FALSE." },
      { term: "Nested statement", definition: "A selection or loop placed inside another one." },
      { term: "CASE", definition: "Selection that compares one value against a list of options." },
    ],
    quiz: [
      { question: "What is output when `Mark` is 50 in the nested IF example?", answer: "`Grade B`. The first test (`>= 70`) is FALSE, the second (`>= 50`) is TRUE." },
      { question: "Is `NOT (5 > 3) OR 2 = 2` TRUE or FALSE?", answer: "`NOT TRUE` is FALSE, `2 = 2` is TRUE, and FALSE OR TRUE is **TRUE**." },
      { question: "When is CASE a better choice than IF?", answer: "When a single variable is compared against several specific values, such as a menu choice." },
    ],
  },
  {
    slug: "loops",
    unit: "programming",
    title: "Iteration with FOR, WHILE, and REPEAT",
    description: "Count-controlled, pre-condition, and post-condition loops, when to use each one, and how to avoid endless loops.",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "Three kinds of loop",
        body: ["**Iteration** repeats a block of statements. Pick the loop by what you know before it starts:"],
        visual: {
          kind: "table",
          columns: ["Loop", "Type", "Use when", "Runs at least once?"],
          rows: [
            ["`FOR ... NEXT`", "Count-controlled", "You know how many times to repeat", "Depends on the range"],
            ["`WHILE ... ENDWHILE`", "Pre-condition", "You repeat while a condition is TRUE, checked **before** each run", "No: may run zero times"],
            ["`REPEAT ... UNTIL`", "Post-condition", "You repeat until a condition is TRUE, checked **after** each run", "Yes"],
          ],
        },
      },
      {
        heading: "FOR loops",
        body: [
          "A `FOR` loop gives a counter variable each value from a start to an end. Add `STEP` to count in different jumps, including backwards.",
        ],
        example: `DECLARE Count : INTEGER
FOR Count <- 1 TO 5
    OUTPUT Count * Count
NEXT Count`,
        visualTitle: "Trace: squares from 1 to 5",
        visual: {
          kind: "trace",
          stepper: true,
          columns: ["Count", "OUTPUT"],
          rows: [
            ["1", "1"],
            ["2", "4"],
            ["3", "9"],
            ["4", "16"],
            ["5", "25"],
          ],
        },
        exampleFirst: true,
      },
      {
        heading: "Counting backwards with STEP",
        body: [],
        example: `DECLARE Seconds : INTEGER
FOR Seconds <- 10 TO 0 STEP -2
    OUTPUT Seconds
NEXT Seconds
OUTPUT "Lift off!"`,
      },
      {
        heading: "WHILE loops",
        body: [
          "A `WHILE` loop checks its condition first. If the condition is FALSE at the start, the body never runs. Use it when you might not need to repeat at all.",
        ],
        example: `DECLARE Balance : REAL
DECLARE Years : INTEGER
Balance <- 100
Years <- 0
WHILE Balance < 200 DO
    Balance <- Balance * 1.05
    Years <- Years + 1
ENDWHILE
OUTPUT "Doubled after ", Years, " years"`,
      },
      {
        heading: "REPEAT ... UNTIL loops",
        body: [
          "A `REPEAT` loop runs its body first and checks the condition afterwards, so it always runs at least once. This is perfect for asking for input, because you have to ask before you can check.",
        ],
        example: `DECLARE Guess : INTEGER
REPEAT
    OUTPUT "Guess the number"
    INPUT Guess
UNTIL Guess = 7
OUTPUT "Correct!"`,
        callout: {
          tone: "warn",
          text: "A condition loop must change something its condition depends on. If nothing inside the loop can make the condition change, the loop never ends.",
        },
      },
      {
        heading: "Nested loops",
        body: ["A loop inside a loop runs the inner loop completely for every pass of the outer loop. This prints a times table grid."],
        example: `DECLARE Row : INTEGER
DECLARE Column : INTEGER
FOR Row <- 1 TO 3
    FOR Column <- 1 TO 3
        OUTPUT Row, " x ", Column, " = ", Row * Column
    NEXT Column
NEXT Row`,
      },
    ],
    keyTerms: [
      { term: "Iteration", definition: "Repeating a set of statements." },
      { term: "Count-controlled loop", definition: "A loop that repeats a set number of times (FOR)." },
      { term: "Pre-condition loop", definition: "A loop that checks its condition before each run (WHILE)." },
      { term: "Post-condition loop", definition: "A loop that checks its condition after each run (REPEAT ... UNTIL)." },
    ],
    quiz: [
      { question: "Which loop should ask for a password until it is correct?", answer: "`REPEAT ... UNTIL`: the password must be asked for at least once before it can be checked." },
      { question: "How many times does the inner statement run in the nested loop example?", answer: "3 × 3 = **9** times." },
      { question: "What is output by `FOR I <- 2 TO 10 STEP 4`?", answer: "**2, 6, 10**." },
    ],
  },
  {
    slug: "operators-and-strings",
    unit: "programming",
    title: "Operators, library routines, and strings",
    description: "Arithmetic operators, MOD and DIV, ROUND and RANDOM, and string handling with LENGTH, SUBSTRING, UCASE, and LCASE.",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "Arithmetic operators",
        visual: {
          kind: "table",
          columns: ["Operator", "Meaning", "Example", "Result"],
          rows: [
            ["`+`", "add", "`7 + 2`", "9"],
            ["`-`", "subtract", "`7 - 2`", "5"],
            ["`*`", "multiply", "`7 * 2`", "14"],
            ["`/`", "divide", "`7 / 2`", "3.5"],
            ["`^`", "raise to the power", "`7 ^ 2`", "49"],
            ["`MOD(7, 2)`", "remainder after division", "`MOD(7, 2)`", "1"],
            ["`DIV(7, 2)`", "whole number division", "`DIV(7, 2)`", "3"],
          ],
        },
        body: [],
      },
      {
        heading: "MOD and DIV",
        body: [
          "`DIV` gives how many whole times one number goes into another, and `MOD` gives what is left over. Together they split a number apart.",
          "A common use: a number is even when `MOD(Number, 2) = 0`. Another: turning minutes into hours and minutes.",
        ],
        example: `DECLARE TotalMinutes : INTEGER
INPUT TotalMinutes
OUTPUT DIV(TotalMinutes, 60), " hours and ", MOD(TotalMinutes, 60), " minutes"`,
      },
      {
        heading: "ROUND and RANDOM",
        body: [
          "`ROUND(Value, Places)` rounds a real number to a number of decimal places. `RANDOM()` returns a random number from 0 to 1, which you can scale up.",
        ],
        example: `DECLARE Price : REAL
Price <- 19.987
OUTPUT ROUND(Price, 2)
OUTPUT "Random whole number from 0 to 100: ", ROUND(RANDOM() * 100, 0)`,
      },
      {
        heading: "Strings are numbered characters",
        body: [
          "A string is a sequence of characters. In Cambridge pseudocode the first character is at position **1**. Click a character to see its position.",
        ],
        visualTitle: "Positions in \"COMPUTER\"",
        visual: { kind: "array", name: "Word", values: [["C", "O", "M", "P", "U", "T", "E", "R"]], highlight: [0, 3] },
      },
      {
        heading: "String handling",
        visual: {
          kind: "table",
          columns: ["Routine", "Returns", "Example with \"Computer\"", "Result"],
          rows: [
            ["`LENGTH(S)`", "The number of characters", "`LENGTH(Word)`", "8"],
            ["`SUBSTRING(S, Start, Length)`", "Part of the string", "`SUBSTRING(Word, 4, 3)`", "\"put\""],
            ["`UCASE(S)`", "The string in upper case", "`UCASE(Word)`", "\"COMPUTER\""],
            ["`LCASE(S)`", "The string in lower case", "`LCASE(Word)`", "\"computer\""],
          ],
        },
        body: [],
        example: `DECLARE FirstName : STRING
DECLARE LastName : STRING
DECLARE Username : STRING
INPUT FirstName
INPUT LastName
Username <- LCASE(SUBSTRING(FirstName, 1, 1)) & LCASE(LastName)
OUTPUT "Your username is ", Username
OUTPUT "It has ", LENGTH(Username), " characters"`,
        callout: { tone: "tip", text: "`&` joins (concatenates) two strings: `\"Ada\" & \"Lovelace\"` gives `\"AdaLovelace\"`." },
      },
    ],
    keyTerms: [
      { term: "MOD", definition: "Gives the remainder after integer division." },
      { term: "DIV", definition: "Gives the whole-number result of a division." },
      { term: "Library routine", definition: "A ready-made subroutine provided by the language, such as ROUND or RANDOM." },
      { term: "Concatenation", definition: "Joining strings together." },
    ],
    quiz: [
      { question: "What are `MOD(23, 5)` and `DIV(23, 5)`?", answer: "`MOD` = **3**, `DIV` = **4** (23 = 4 × 5 + 3)." },
      { question: "What is `SUBSTRING(\"Keyboard\", 4, 5)`?", answer: "**\"board\"**." },
      { question: "Write a condition that is TRUE when `N` is a multiple of 3.", answer: "`MOD(N, 3) = 0`." },
    ],
  },
  {
    slug: "procedures-and-functions",
    unit: "programming",
    title: "Procedures, functions, and maintainable code",
    description: "Write reusable subroutines with parameters, return values from functions, understand local and global variables, and keep code maintainable.",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "Why subroutines?",
        body: [
          "A **subroutine** is a named block of code that does one job and can be called from anywhere in the program. Writing it once and calling it many times makes programs shorter, easier to test, and easier to change.",
          "There are two kinds. A **procedure** does a task. A **function** does a task and **returns a value** to where it was called.",
        ],
      },
      {
        heading: "Procedures",
        body: [
          "Define a procedure with `PROCEDURE ... ENDPROCEDURE` and run it with `CALL`. Values passed in are **parameters**.",
        ],
        example: `PROCEDURE DrawLine(Size : INTEGER)
    DECLARE Count : INTEGER
    DECLARE Line : STRING
    Line <- ""
    FOR Count <- 1 TO Size
        Line <- Line & "-"
    NEXT Count
    OUTPUT Line
ENDPROCEDURE

CALL DrawLine(10)
OUTPUT "Menu"
CALL DrawLine(10)`,
      },
      {
        heading: "Functions",
        body: [
          "A function states the type of value it returns with `RETURNS`, and sends the value back with `RETURN`. Because it gives back a value, you use a function inside an expression instead of with `CALL`.",
        ],
        example: `FUNCTION Area(Width : REAL, Height : REAL) RETURNS REAL
    RETURN Width * Height
ENDFUNCTION

DECLARE RoomArea : REAL
RoomArea <- Area(4.5, 3)
OUTPUT "Carpet needed: ", RoomArea, " square metres"`,
        visual: {
          kind: "flow",
          nodes: [
            { label: "Call", detail: "`Area(4.5, 3)` is reached." },
            { label: "Parameters", detail: "`Width` gets 4.5, `Height` gets 3." },
            { label: "Run", detail: "The function body calculates 13.5." },
            { label: "Return", detail: "13.5 replaces the call and is stored in `RoomArea`." },
          ],
        },
      },
      {
        heading: "Local and global variables",
        body: [
          "A **local variable** is declared inside a subroutine. It exists only while the subroutine runs and cannot be used outside it. `Count` and `Line` in `DrawLine` are local.",
          "A **global variable** is declared in the main program and can be used anywhere, including inside subroutines.",
        ],
        callout: {
          tone: "tip",
          text: "Prefer local variables and parameters. Subroutines that only use their own variables are easier to test and reuse, and cannot accidentally change other parts of the program.",
        },
      },
      {
        heading: "Writing maintainable programs",
        body: ["Programs are read far more often than they are written. Make yours easy for someone else (or you, next month) to understand and change:"],
        bullets: [
          "Use **meaningful identifiers**: `TotalScore` instead of `T`.",
          "Add **comments** with `//` to explain why the code does something.",
          "Use **procedures and functions** so each part does one clear job.",
          "Use **constants** for fixed values, and indent blocks consistently.",
        ],
        example: `// Works out the cost of a cinema trip
CONSTANT TicketPrice <- 8.5
DECLARE People : INTEGER
INPUT People
OUTPUT "Total cost: ", People * TicketPrice // before any discount`,
      },
    ],
    keyTerms: [
      { term: "Procedure", definition: "A subroutine that performs a task and does not return a value." },
      { term: "Function", definition: "A subroutine that returns a value." },
      { term: "Parameter", definition: "A value passed into a subroutine when it is called." },
      { term: "Local variable", definition: "A variable declared inside a subroutine and only usable there." },
      { term: "Global variable", definition: "A variable declared in the main program and usable anywhere." },
    ],
    quiz: [
      { question: "What is the difference between a procedure and a function?", answer: "A function returns a value; a procedure does not." },
      { question: "Write the header of a function `IsEven` that takes an integer and returns a Boolean.", answer: "`FUNCTION IsEven(Number : INTEGER) RETURNS BOOLEAN`." },
      { question: "Give two features that make a program maintainable.", answer: "For example: meaningful identifiers, comments, subroutines, constants, consistent indentation." },
    ],
  },
  {
    slug: "arrays",
    unit: "programming",
    title: "One-dimensional and two-dimensional arrays",
    description: "Store lists and tables of data in arrays, use indexes, and process them with loops and nested loops.",
    updated: "2026-10-31",
    syllabus: "8.2",
    sections: [
      {
        heading: "One-dimensional arrays",
        body: [
          "An **array** stores many values of the same data type under one name. Each value is an **element**, found by its **index** in square brackets. Declare the lowest and highest index when you create the array.",
        ],
        visualTitle: "Scores : ARRAY[1:6] OF INTEGER",
        visual: { kind: "array", name: "Scores", values: [["72", "45", "88", "91", "60", "53"]], highlight: [0, 2] },
        example: `DECLARE Scores : ARRAY[1:6] OF INTEGER
Scores[1] <- 72
Scores[3] <- 88
OUTPUT Scores[3]`,
      },
      {
        heading: "Arrays and loops",
        body: [
          "Arrays and FOR loops belong together: the loop counter becomes the index, so the same code processes every element.",
        ],
        example: `DECLARE Scores : ARRAY[1:6] OF INTEGER
DECLARE Index : INTEGER
DECLARE Total : INTEGER
Total <- 0
FOR Index <- 1 TO 6
    INPUT Scores[Index]
    Total <- Total + Scores[Index]
NEXT Index
OUTPUT "Average: ", Total / 6`,
      },
      {
        heading: "Two-dimensional arrays",
        body: [
          "A **2D array** is a table with rows and columns. It needs two indexes: the **row** first, then the **column**. Click any cell below.",
        ],
        visualTitle: "Marks : ARRAY[1:3, 1:4] OF INTEGER",
        visual: {
          kind: "array",
          name: "Marks",
          values: [
            ["12", "15", "9", "18"],
            ["20", "11", "14", "16"],
            ["8", "19", "17", "13"],
          ],
          highlight: [1, 2],
        },
        caption: "Each row could be a student and each column a test. `Marks[2, 3]` is student 2's mark on test 3.",
      },
      {
        heading: "Nested loops for 2D arrays",
        body: ["To visit every element, use one loop for the rows and another inside it for the columns."],
        example: `DECLARE Marks : ARRAY[1:3, 1:4] OF INTEGER
DECLARE Student : INTEGER
DECLARE Test : INTEGER
DECLARE Total : INTEGER
FOR Student <- 1 TO 3
    FOR Test <- 1 TO 4
        INPUT Marks[Student, Test]
    NEXT Test
NEXT Student
FOR Student <- 1 TO 3
    Total <- 0
    FOR Test <- 1 TO 4
        Total <- Total + Marks[Student, Test]
    NEXT Test
    OUTPUT "Student ", Student, " total: ", Total
NEXT Student`,
      },
    ],
    keyTerms: [
      { term: "Array", definition: "A data structure holding many values of the same type under one identifier." },
      { term: "Element", definition: "One value stored in an array." },
      { term: "Index", definition: "The position number used to access an element." },
      { term: "2D array", definition: "An array with rows and columns, accessed with two indexes." },
    ],
    quiz: [
      { question: "Declare an array to hold the names of 30 students.", answer: "`DECLARE Names : ARRAY[1:30] OF STRING`." },
      { question: "In the Marks table above, what is `Marks[3, 2]`?", answer: "**19** (row 3, column 2)." },
      { question: "Why use an array instead of 30 separate variables?", answer: "One name holds all the values, and a loop can process every element with the same few lines of code." },
    ],
  },
  {
    slug: "file-handling",
    unit: "programming",
    title: "File handling",
    description: "Why programs store data in files, and how to open, write, read, and close a text file in pseudocode.",
    updated: "2026-10-31",
    syllabus: "8.3",
    sections: [
      {
        heading: "Why use files?",
        body: [
          "Variables live in RAM, so their values disappear when the program ends. Storing data in a **file** keeps it permanently, so it can be loaded the next time the program runs, or used by another program.",
        ],
      },
      {
        heading: "Open, use, close",
        body: ["Every file operation follows the same pattern:"],
        visual: {
          kind: "flow",
          nodes: [
            { label: "Open", detail: "`OPENFILE \"scores.txt\" FOR WRITE` or `FOR READ`" },
            { label: "Write or read", detail: "`WRITEFILE` sends a line to the file; `READFILE` reads the next line into a variable." },
            { label: "Close", detail: "`CLOSEFILE` saves the file and frees it for other programs." },
          ],
        },
        callout: { tone: "warn", text: "Opening a file FOR WRITE replaces anything already in it." },
      },
      {
        heading: "Writing to a file",
        body: [],
        example: `DECLARE Name : STRING
OPENFILE "names.txt" FOR WRITE
INPUT Name
WRITEFILE "names.txt", Name
CLOSEFILE "names.txt"`,
      },
      {
        heading: "Reading from a file",
        body: ["Each `READFILE` reads the next line of the file into a variable."],
        example: `DECLARE FirstLine : STRING
OPENFILE "names.txt" FOR READ
READFILE "names.txt", FirstLine
OUTPUT "The first name is ", FirstLine
CLOSEFILE "names.txt"`,
      },
    ],
    keyTerms: [
      { term: "File", definition: "A named collection of data stored permanently on secondary storage." },
      { term: "OPENFILE", definition: "Opens a file for reading or writing." },
      { term: "READFILE / WRITEFILE", definition: "Reads one line from, or writes one line to, an open file." },
      { term: "CLOSEFILE", definition: "Closes a file when the program has finished with it." },
    ],
    quiz: [
      { question: "Why might a game save high scores to a file instead of a variable?", answer: "Variables are lost when the program closes; a file keeps the scores permanently for next time." },
      { question: "What must happen before a program can read a file?", answer: "The file must be opened with `OPENFILE ... FOR READ`." },
    ],
  },
];
