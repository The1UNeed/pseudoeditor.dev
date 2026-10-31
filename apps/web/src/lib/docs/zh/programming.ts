import type { Doc } from "../types";

export const programmingZh: Doc[] = [
  {
    slug: "variables-input-output",
    unit: "programming",
    title: "变量、常量、数据类型与输入输出",
    description: "用变量和常量存储值，选择合适的数据类型，并使用 INPUT 和 OUTPUT。",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "变量就是贴了标签的盒子",
        body: [
          "**变量**是内存中一个有名字的位置，用来存储一个值。程序运行时这个值可以改变。可以把它想象成一个贴了标签的盒子：名字写在标签上，值放在盒子里。",
          "在伪代码中，先用数据类型声明每个变量，再用 `<-` 把值放进去。赋值会替换盒子里原来的内容。",
        ],
        example: `DECLARE Score : INTEGER
Score <- 10
Score <- Score + 5
OUTPUT Score`,
        callout: { tone: "key", text: "`Score <- Score + 5` 的意思是：取出 Score 中的值，加上 5，再把结果放回 Score。它不是一个方程。" },
      },
      {
        heading: "常量",
        body: [
          "**常量**是程序运行期间不能改变的有名字的值。使用常量意味着这个值只写在一个地方，修改起来很方便，也不可能被意外改掉。",
        ],
        example: `CONSTANT VatRate <- 0.2
DECLARE Price : REAL
INPUT Price
OUTPUT "Price with VAT: ", Price * (1 + VatRate)`,
      },
      {
        heading: "数据类型",
        body: ["每个变量都有一种数据类型，决定它能存放什么："],
        visual: {
          kind: "table",
          columns: ["类型", "存放", "例子"],
          rows: [
            ["`INTEGER`", "整数", "`42`、`-7`、`0`"],
            ["`REAL`", "带小数部分的数", "`3.14`、`-0.5`、`19.99`"],
            ["`CHAR`", "单个字符", "`'A'`、`'7'`、`'?'`"],
            ["`STRING`", "文本：零个或多个字符", "`\"Hello\"`、`\"07700 900123\"`"],
            ["`BOOLEAN`", "TRUE 或 FALSE", "`TRUE`、`FALSE`"],
          ],
        },
        callout: { tone: "tip", text: "电话号码要存成 STRING 而不是 INTEGER：它可能以 0 开头、含有空格，而且你从不对它做数学运算。" },
      },
      {
        heading: "输入与输出",
        body: [
          "`INPUT` 等待用户输入一个值并把它存进变量。`OUTPUT` 显示值，多个值之间用逗号分隔。",
          "在 PseudoEditor 中，程序运行时终端会为每个 `INPUT` 询问输入，所以你可以在浏览器里测试交互式程序。",
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
        heading: "顺序",
        body: [
          "**顺序**是指语句从上到下一条接一条地按顺序执行。改变顺序就会改变结果：在上面的程序中，年龄必须先输入才能使用。",
        ],
      },
    ],
    keyTerms: [
      { term: "变量", definition: "程序运行时值可以改变的有名字的内存位置。" },
      { term: "常量", definition: "程序运行时不能改变的有名字的值。" },
      { term: "数据类型", definition: "变量所存数据的种类，例如 INTEGER 或 STRING。" },
      { term: "顺序", definition: "指令按先后顺序逐条执行。" },
    ],
    quiz: [
      { question: "门是否上锁应该用什么数据类型存储？", answer: "`BOOLEAN`，因为它不是 TRUE 就是 FALSE。" },
      { question: "`X <- 4`、`X <- X * 3`、`OUTPUT X` 输出什么？", answer: "**12**。" },
      { question: "说出用常量代替每次直接写数值的一个理由。", answer: "如果值要变，只需改一个地方，而且程序运行时它不会被误改。" },
    ],
  },
  {
    slug: "selection",
    unit: "programming",
    title: "用 IF 和 CASE 进行选择",
    description: "用 IF、ELSE、嵌套 IF 和 CASE OF 做决定，配合比较运算符和布尔运算符。",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "IF ... THEN ... ELSE",
        body: [
          "**选择**让程序决定执行哪些语句。`IF` 语句检查一个条件：如果为 TRUE，就执行 `THEN` 块；如果为 FALSE，就改为执行可选的 `ELSE` 块。",
        ],
        visualTitle: "走哪条路？",
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
        caption: "50 是边界值：`>=` 包含它，`>` 则不包含。",
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
        heading: "比较运算符",
        body: ["条件由比较构成，比较的结果总是 TRUE 或 FALSE："],
        visual: {
          kind: "table",
          columns: ["运算符", "含义", "结果为 TRUE 的例子"],
          rows: [
            ["`=`", "等于", "`5 = 5`"],
            ["`<>`", "不等于", "`5 <> 3`"],
            ["`<`", "小于", "`3 < 5`"],
            ["`<=`", "小于或等于", "`5 <= 5`"],
            ["`>`", "大于", "`7 > 2`"],
            ["`>=`", "大于或等于", "`7 >= 7`"],
          ],
        },
      },
      {
        heading: "AND、OR、NOT",
        body: [
          "布尔运算符把条件组合起来。`AND` 只有两边都为 TRUE 时才为 TRUE。`OR` 只要至少一边为 TRUE 就为 TRUE。`NOT` 把 TRUE 和 FALSE 互换。",
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
        heading: "嵌套 IF",
        body: [
          "一个 `IF` 可以放在另一个 `IF` 里面。只有外层条件为 TRUE 时，才会检查内层条件。每一层都要缩进，这样才能看清哪个 `ENDIF` 结束哪个 `IF`。",
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
          "当一个变量要和几个固定值逐一比较时，`CASE OF` 比一堆嵌套 IF 更短、更清楚。`OTHERWISE` 处理所有没有列出的值。",
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
      { term: "选择", definition: "根据条件决定执行哪些语句。" },
      { term: "条件", definition: "结果为 TRUE 或 FALSE 的表达式。" },
      { term: "嵌套语句", definition: "放在另一个选择或循环内部的选择或循环。" },
      { term: "CASE", definition: "把一个值与一组选项逐一比较的选择结构。" },
    ],
    quiz: [
      { question: "在嵌套 IF 的例子中，`Mark` 为 50 时输出什么？", answer: "`Grade B`。第一个判断（`>= 70`）为 FALSE，第二个（`>= 50`）为 TRUE。" },
      { question: "`NOT (5 > 3) OR 2 = 2` 是 TRUE 还是 FALSE？", answer: "`NOT TRUE` 为 FALSE，`2 = 2` 为 TRUE，FALSE OR TRUE 为 **TRUE**。" },
      { question: "什么时候用 CASE 比用 IF 更好？", answer: "当一个变量要和几个特定值比较时，例如菜单选项。" },
    ],
  },
  {
    slug: "loops",
    unit: "programming",
    title: "用 FOR、WHILE 和 REPEAT 进行循环",
    description: "计数控制循环、前置条件循环和后置条件循环，各自何时使用，以及如何避免死循环。",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "三种循环",
        body: ["**循环（迭代）**重复执行一段语句。根据开始前你知道什么来选择循环："],
        visual: {
          kind: "table",
          columns: ["循环", "类型", "适用于", "至少执行一次？"],
          rows: [
            ["`FOR ... NEXT`", "计数控制", "你知道要重复多少次", "取决于范围"],
            ["`WHILE ... ENDWHILE`", "前置条件", "条件为 TRUE 时重复，**每次执行前**检查", "否：可能一次都不执行"],
            ["`REPEAT ... UNTIL`", "后置条件", "重复直到条件为 TRUE，**每次执行后**检查", "是"],
          ],
        },
      },
      {
        heading: "FOR 循环",
        body: ["`FOR` 循环让计数变量依次取从起始值到终止值的每个值。加上 `STEP` 可以按不同的步长计数，包括倒着数。"],
        example: `DECLARE Count : INTEGER
FOR Count <- 1 TO 5
    OUTPUT Count * Count
NEXT Count`,
        visualTitle: "追踪：1 到 5 的平方",
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
        heading: "用 STEP 倒数",
        body: [],
        example: `DECLARE Seconds : INTEGER
FOR Seconds <- 10 TO 0 STEP -2
    OUTPUT Seconds
NEXT Seconds
OUTPUT "Lift off!"`,
      },
      {
        heading: "WHILE 循环",
        body: ["`WHILE` 循环先检查条件。如果一开始条件就为 FALSE，循环体一次也不会执行。当你可能根本不需要重复时，就用它。"],
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
        heading: "REPEAT ... UNTIL 循环",
        body: ["`REPEAT` 循环先执行循环体，之后再检查条件，所以它至少执行一次。这非常适合请求输入，因为你得先问，才能检查。"],
        example: `DECLARE Guess : INTEGER
REPEAT
    OUTPUT "Guess the number"
    INPUT Guess
UNTIL Guess = 7
OUTPUT "Correct!"`,
        callout: {
          tone: "warn",
          text: "条件循环里必须改变条件所依赖的东西。如果循环内没有任何东西能让条件改变，循环就永远不会结束。",
        },
      },
      {
        heading: "嵌套循环",
        body: ["循环中的循环：外层循环每执行一次，内层循环都会完整地执行一遍。下面的程序打印一个乘法表网格。"],
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
      { term: "迭代", definition: "重复执行一组语句。" },
      { term: "计数控制循环", definition: "重复固定次数的循环（FOR）。" },
      { term: "前置条件循环", definition: "每次执行前检查条件的循环（WHILE）。" },
      { term: "后置条件循环", definition: "每次执行后检查条件的循环（REPEAT ... UNTIL）。" },
    ],
    quiz: [
      { question: "反复询问密码直到正确，应该用哪种循环？", answer: "`REPEAT ... UNTIL`：必须先至少询问一次密码，才能检查它。" },
      { question: "嵌套循环例子中，内层语句执行了几次？", answer: "3 × 3 = **9** 次。" },
      { question: "`FOR I <- 2 TO 10 STEP 4` 会让 I 取哪些值？", answer: "**2、6、10**。" },
    ],
  },
  {
    slug: "operators-and-strings",
    unit: "programming",
    title: "运算符、库例程与字符串",
    description: "算术运算符、MOD 和 DIV、ROUND 和 RANDOM，以及用 LENGTH、SUBSTRING、UCASE 和 LCASE 处理字符串。",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "算术运算符",
        visual: {
          kind: "table",
          columns: ["运算符", "含义", "例子", "结果"],
          rows: [
            ["`+`", "加", "`7 + 2`", "9"],
            ["`-`", "减", "`7 - 2`", "5"],
            ["`*`", "乘", "`7 * 2`", "14"],
            ["`/`", "除", "`7 / 2`", "3.5"],
            ["`^`", "乘方", "`7 ^ 2`", "49"],
            ["`MOD(7, 2)`", "除法的余数", "`MOD(7, 2)`", "1"],
            ["`DIV(7, 2)`", "整数除法", "`DIV(7, 2)`", "3"],
          ],
        },
        body: [],
      },
      {
        heading: "MOD 与 DIV",
        body: [
          "`DIV` 给出一个数能被另一个数整除多少次，`MOD` 给出剩下的余数。两者结合可以把一个数拆开。",
          "常见用法：当 `MOD(Number, 2) = 0` 时，这个数是偶数。另一个用法：把分钟换算成小时和分钟。",
        ],
        example: `DECLARE TotalMinutes : INTEGER
INPUT TotalMinutes
OUTPUT DIV(TotalMinutes, 60), " hours and ", MOD(TotalMinutes, 60), " minutes"`,
      },
      {
        heading: "ROUND 与 RANDOM",
        body: ["`ROUND(Value, Places)` 把实数四舍五入到指定的小数位数。`RANDOM()` 返回 0 到 1 之间的随机数，你可以把它放大。"],
        example: `DECLARE Price : REAL
Price <- 19.987
OUTPUT ROUND(Price, 2)
OUTPUT "Random whole number from 0 to 100: ", ROUND(RANDOM() * 100, 0)`,
      },
      {
        heading: "字符串是带编号的字符",
        body: ["字符串是一串字符。在剑桥伪代码中，第一个字符的位置是 **1**。点击某个字符查看它的位置。"],
        visualTitle: "\"COMPUTER\" 中的位置",
        visual: { kind: "array", name: "Word", values: [["C", "O", "M", "P", "U", "T", "E", "R"]], highlight: [0, 3] },
      },
      {
        heading: "字符串处理",
        visual: {
          kind: "table",
          columns: ["例程", "返回", "以 \"Computer\" 为例", "结果"],
          rows: [
            ["`LENGTH(S)`", "字符个数", "`LENGTH(Word)`", "8"],
            ["`SUBSTRING(S, Start, Length)`", "字符串的一部分", "`SUBSTRING(Word, 4, 3)`", "\"put\""],
            ["`UCASE(S)`", "转换为大写", "`UCASE(Word)`", "\"COMPUTER\""],
            ["`LCASE(S)`", "转换为小写", "`LCASE(Word)`", "\"computer\""],
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
        callout: { tone: "tip", text: "`&` 把两个字符串连接起来：`\"Ada\" & \"Lovelace\"` 得到 `\"AdaLovelace\"`。" },
      },
    ],
    keyTerms: [
      { term: "MOD", definition: "给出整数除法的余数。" },
      { term: "DIV", definition: "给出除法结果的整数部分。" },
      { term: "库例程", definition: "语言自带的现成子程序，例如 ROUND 或 RANDOM。" },
      { term: "连接", definition: "把字符串拼接在一起。" },
    ],
    quiz: [
      { question: "`MOD(23, 5)` 和 `DIV(23, 5)` 分别是多少？", answer: "`MOD` = **3**，`DIV` = **4**（23 = 4 × 5 + 3）。" },
      { question: "`SUBSTRING(\"Keyboard\", 4, 5)` 是什么？", answer: "**\"board\"**。" },
      { question: "写一个当 `N` 是 3 的倍数时为 TRUE 的条件。", answer: "`MOD(N, 3) = 0`。" },
    ],
  },
  {
    slug: "procedures-and-functions",
    unit: "programming",
    title: "过程、函数与可维护的代码",
    description: "编写带参数的可复用子程序，从函数返回值，理解局部变量和全局变量，并让代码易于维护。",
    updated: "2026-10-31",
    syllabus: "8.1",
    sections: [
      {
        heading: "为什么要用子程序？",
        body: [
          "**子程序**是一段有名字、只做一件事、可以在程序任何地方调用的代码。写一次、调用多次，让程序更短、更容易测试，也更容易修改。",
          "子程序有两种。**过程**完成一项任务。**函数**完成一项任务并把一个**值返回**到调用它的地方。",
        ],
      },
      {
        heading: "过程",
        body: ["用 `PROCEDURE ... ENDPROCEDURE` 定义过程，用 `CALL` 运行它。传入的值叫作**参数**。"],
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
        heading: "函数",
        body: [
          "函数用 `RETURNS` 说明它返回的值的类型，并用 `RETURN` 把值送回去。因为它会返回一个值，所以函数要写在表达式中使用，而不是用 `CALL`。",
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
            { label: "调用", detail: "执行到 `Area(4.5, 3)`。" },
            { label: "参数", detail: "`Width` 得到 4.5，`Height` 得到 3。" },
            { label: "运行", detail: "函数体计算出 13.5。" },
            { label: "返回", detail: "13.5 替换这次调用，并存入 `RoomArea`。" },
          ],
        },
      },
      {
        heading: "局部变量与全局变量",
        body: [
          "**局部变量**在子程序内部声明。它只在子程序运行时存在，不能在子程序外使用。`DrawLine` 中的 `Count` 和 `Line` 就是局部变量。",
          "**全局变量**在主程序中声明，可以在任何地方使用，包括子程序内部。",
        ],
        callout: {
          tone: "tip",
          text: "优先使用局部变量和参数。只使用自己变量的子程序更容易测试和复用，也不会意外改动程序的其他部分。",
        },
      },
      {
        heading: "编写可维护的程序",
        body: ["程序被阅读的次数远多于被编写的次数。让别人（或下个月的你）能轻松读懂和修改你的程序："],
        bullets: [
          "使用**有意义的标识符**：用 `TotalScore` 而不是 `T`。",
          "用 `//` 添加**注释**，解释代码为什么这样做。",
          "使用**过程和函数**，让每一部分只做一件清楚的事。",
          "对固定的值使用**常量**，并保持一致的缩进。",
        ],
        example: `// Works out the cost of a cinema trip
CONSTANT TicketPrice <- 8.5
DECLARE People : INTEGER
INPUT People
OUTPUT "Total cost: ", People * TicketPrice // before any discount`,
      },
    ],
    keyTerms: [
      { term: "过程", definition: "完成一项任务、不返回值的子程序。" },
      { term: "函数", definition: "返回一个值的子程序。" },
      { term: "参数", definition: "调用子程序时传入的值。" },
      { term: "局部变量", definition: "在子程序内声明、只能在其中使用的变量。" },
      { term: "全局变量", definition: "在主程序中声明、任何地方都能使用的变量。" },
    ],
    quiz: [
      { question: "过程和函数有什么区别？", answer: "函数返回一个值，过程不返回。" },
      { question: "写出函数 `IsEven` 的首行：它接收一个整数并返回布尔值。", answer: "`FUNCTION IsEven(Number : INTEGER) RETURNS BOOLEAN`。" },
      { question: "说出让程序易于维护的两个特点。", answer: "例如：有意义的标识符、注释、子程序、常量、一致的缩进。" },
    ],
  },
  {
    slug: "arrays",
    unit: "programming",
    title: "一维数组与二维数组",
    description: "用数组存储列表和表格数据，使用下标，并用循环和嵌套循环处理数组。",
    updated: "2026-10-31",
    syllabus: "8.2",
    sections: [
      {
        heading: "一维数组",
        body: [
          "**数组**用一个名字存储许多相同数据类型的值。每个值是一个**元素**，通过方括号中的**下标**找到。创建数组时要声明最小和最大下标。",
        ],
        visualTitle: "Scores : ARRAY[1:6] OF INTEGER",
        visual: { kind: "array", name: "Scores", values: [["72", "45", "88", "91", "60", "53"]], highlight: [0, 2] },
        example: `DECLARE Scores : ARRAY[1:6] OF INTEGER
Scores[1] <- 72
Scores[3] <- 88
OUTPUT Scores[3]`,
      },
      {
        heading: "数组与循环",
        body: ["数组和 FOR 循环是天生一对：循环计数器就是下标，同一段代码就能处理每个元素。"],
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
        heading: "二维数组",
        body: ["**二维数组**是一个有行和列的表格。它需要两个下标：先写**行**，再写**列**。点击下面任意一格。"],
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
        caption: "每一行可以是一名学生，每一列是一次测验。`Marks[2, 3]` 是第 2 名学生第 3 次测验的分数。",
      },
      {
        heading: "用嵌套循环处理二维数组",
        body: ["要访问每个元素，用一个循环遍历行，在它里面再用一个循环遍历列。"],
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
      { term: "数组", definition: "用一个标识符存放许多同类型值的数据结构。" },
      { term: "元素", definition: "数组中存放的一个值。" },
      { term: "下标", definition: "用来访问元素的位置编号。" },
      { term: "二维数组", definition: "有行和列、用两个下标访问的数组。" },
    ],
    quiz: [
      { question: "声明一个存放 30 名学生姓名的数组。", answer: "`DECLARE Names : ARRAY[1:30] OF STRING`。" },
      { question: "在上面的 Marks 表中，`Marks[3, 2]` 是多少？", answer: "**19**（第 3 行，第 2 列）。" },
      { question: "为什么用数组而不用 30 个单独的变量？", answer: "一个名字就能存放所有值，用循环和几行相同的代码就能处理每个元素。" },
    ],
  },
  {
    slug: "file-handling",
    unit: "programming",
    title: "文件处理",
    description: "程序为什么要把数据存进文件，以及如何在伪代码中打开、写入、读取和关闭文本文件。",
    updated: "2026-10-31",
    syllabus: "8.3",
    sections: [
      {
        heading: "为什么要使用文件？",
        body: [
          "变量存放在 RAM 中，所以程序结束时它们的值就消失了。把数据存进**文件**可以永久保存，下次运行程序时再读取，或者给其他程序使用。",
        ],
      },
      {
        heading: "打开、使用、关闭",
        body: ["每次文件操作都遵循同样的模式："],
        visual: {
          kind: "flow",
          nodes: [
            { label: "打开", detail: "`OPENFILE \"scores.txt\" FOR WRITE` 或 `FOR READ`" },
            { label: "写入或读取", detail: "`WRITEFILE` 把一行写入文件；`READFILE` 把下一行读入变量。" },
            { label: "关闭", detail: "`CLOSEFILE` 保存文件，并把它释放给其他程序。" },
          ],
        },
        callout: { tone: "warn", text: "以 FOR WRITE 打开文件会覆盖其中原有的全部内容。" },
      },
      {
        heading: "写入文件",
        body: [],
        example: `DECLARE Name : STRING
OPENFILE "names.txt" FOR WRITE
INPUT Name
WRITEFILE "names.txt", Name
CLOSEFILE "names.txt"`,
      },
      {
        heading: "读取文件",
        body: ["每执行一次 `READFILE`，就把文件的下一行读入一个变量。"],
        example: `DECLARE FirstLine : STRING
OPENFILE "names.txt" FOR READ
READFILE "names.txt", FirstLine
OUTPUT "The first name is ", FirstLine
CLOSEFILE "names.txt"`,
      },
    ],
    keyTerms: [
      { term: "文件", definition: "永久存放在辅助存储器上的有名字的数据集合。" },
      { term: "OPENFILE", definition: "打开文件以便读取或写入。" },
      { term: "READFILE / WRITEFILE", definition: "从打开的文件读取一行，或向其写入一行。" },
      { term: "CLOSEFILE", definition: "程序用完文件后关闭它。" },
    ],
    quiz: [
      { question: "为什么游戏要把最高分保存到文件而不是变量中？", answer: "程序关闭时变量会丢失；文件能永久保存分数，下次还能用。" },
      { question: "程序读取文件前必须做什么？", answer: "必须先用 `OPENFILE ... FOR READ` 打开文件。" },
    ],
  },
];
