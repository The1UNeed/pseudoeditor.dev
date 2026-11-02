import type { Doc } from "../types";

export const pseudocodeReferenceZh: Doc[] = [
  {
    slug: "writing-workflow",
    unit: "pseudocode-reference",
    title: "如何写出考试风格的答案",
    description: "按步骤写出 Cambridge 风格的伪代码答案：先规划输入和输出，再组织程序结构、理解指令词，最后检查答案。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "这些规范的来源",
        body: [
          "伪代码参考依据 Cambridge IGCSE Computer Science（0478）2026–2028 年考纲中“评估详情”部分（第 35–49 页）的伪代码规范编写。在设置中选择其他考试语法后，编译器、语法高亮和自动补全会改为遵循该考试局的写法。",
        ],
        callout: {
          tone: "key",
          text: "Cambridge 印刷的示例用向左箭头 `←` 表示赋值。在编辑器中请输入 `<-`。",
        },
      },
      {
        heading: "每道题都用的七个步骤",
        body: ["每次都按相同的步骤作答。大多数逻辑错误都来自跳过了其中某一步。"],
        bullets: [
          "阅读题目，列出题目要求的输入和输出。",
          "用正确的数据类型声明每个变量和数组。",
          "在循环使用之前，先设置计数器、累加值和标志的初始值。",
          "根据题目条件选择合适的选择结构和循环类型。",
          "把处理逻辑写成简短、易读的代码块。",
          "处理完成后再输出结果。",
          "用普通值和边界情况手动运行程序。",
        ],
      },
      {
        heading: "组织程序结构",
        body: [
          "清晰的答案按顺序分为四个部分：声明和常量、初始值、输入和处理、输出。用注释标出每个部分，可以帮助阅卷员理解你的逻辑。",
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
        heading: "考试指令词",
        body: ["指令词告诉你，什么样的答案才能得分。"],
        visual: {
          kind: "table",
          columns: ["指令词", "答题要求"],
          rows: [
            ["Calculate（计算）", "根据给出的事实、数据或信息得出结果。"],
            ["Compare（比较）", "找出相同点和不同点，并作出说明。"],
            ["Define（定义）", "给出准确含义。"],
            ["Demonstrate（演示）", "说明做法或给出示例。"],
            ["Describe（描述）", "陈述要点、特性和主要特征。"],
            ["Evaluate（评价）", "判断质量、重要性、数量或价值。"],
            ["Explain（解释）", "给出原因，说明关系，并用证据支持。"],
            ["Give（给出）", "根据材料或记忆写出答案。"],
            ["Identify（识别）", "说出、选择或辨认。"],
            ["Outline（概述）", "列出主要要点。"],
            ["Show (that)（证明）", "提供有条理的证据并推导出结果。"],
            ["State（陈述）", "用清楚明确的语言表达。"],
            ["Suggest（建议）", "运用知识提出合理的方案或考虑因素。"],
          ],
        },
      },
      {
        heading: "提交前检查",
        body: ["先运行程序，再逐项检查下面的清单。"],
        bullets: [
          "所有变量和数组都已用正确的数据类型声明。",
          "计数器、累加值和标志都有初始值。",
          "循环类型符合题意：`FOR`、`WHILE` 或 `REPEAT ... UNTIL`。",
          "每个 `IF`、`CASE` 和循环代码块都有对应的结束关键字。",
          "调用过程时使用 `CALL`；函数调用出现在表达式中。",
          "输出与题目要求逐字一致。",
          "`ROUND` 和 `RANDOM` 等库函数使用了正确的语法。",
          "已用普通输入和边界输入手动运行过程序。",
        ],
      },
    ],
  },
  {
    slug: "syntax",
    unit: "pseudocode-reference",
    title: "伪代码语法参考",
    description: "浏览器编译器支持的语句、命名、数据类型、常量、运算符、库函数和代码块结束关键字。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "核心语句",
        body: [
          "用 `DECLARE` 声明变量，用 `<-` 赋值，用 `INPUT` 读取用户输入，用 `OUTPUT` 显示值。",
          "在设置中选择剑桥 IGCSE、剑桥 A Level、IB、OCR 或 AQA，编译器就会按照该考试局的写法检查程序。",
        ],
        example: `DECLARE Total : INTEGER
Total <- 0
OUTPUT Total`,
      },
      {
        heading: "命名、注释与排版",
        body: ["命名和排版保持一致，程序更容易批改，也更容易调试。"],
        bullets: [
          "关键字使用大写：`IF`、`FOR`、`WHILE`、`PROCEDURE`。",
          "标识符使用 PascalCase，并以大写字母开头，例如 `RowTotal`。",
          "标识符中不要使用下划线。",
          "注释以 `//` 开头。",
          "每个代码块的内容缩进四个空格。",
        ],
      },
      {
        heading: "数据类型与常量",
        body: [
          "使用变量前，先用 `DECLARE Name : TYPE` 声明。常量用 `CONSTANT Name <- value` 声明。常量的值必须是字面量，不能是表达式。",
        ],
        visual: {
          kind: "table",
          columns: ["类型", "存储内容", "示例"],
          rows: [
            ["`INTEGER`", "整数", "`42`"],
            ["`REAL`", "带小数部分的数", "`3.142`"],
            ["`CHAR`", "单个字符", "`'M'`"],
            ["`STRING`", "任意长度的文本", "`\"Mai\"`"],
            ["`BOOLEAN`", "真值", "`TRUE` 或 `FALSE`"],
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
        heading: "运算符",
        body: ["比较运算和逻辑运算的结果是 `BOOLEAN`，可以直接用在 `IF`、`WHILE` 和 `UNTIL` 的条件中。"],
        visual: {
          kind: "table",
          columns: ["类别", "运算符"],
          rows: [
            ["算术", "`+` `-` `*` `/` `^`"],
            ["整数除法", "`DIV(a, b)` 返回整数商；`MOD(a, b)` 返回余数"],
            ["比较", "`=` `<` `<=` `>` `>=` `<>`"],
            ["逻辑", "`AND` `OR` `NOT`"],
          ],
        },
      },
      {
        heading: "库函数",
        body: ["这些函数是内置的，会出现在自动补全中。`ROUND` 返回 `REAL`，所以要把结果存入 `REAL` 变量。"],
        visual: {
          kind: "table",
          columns: ["函数", "返回值"],
          rows: [
            ["`LENGTH(Text)`", "字符串中的字符数"],
            ["`LCASE(Text)`、`UCASE(Text)`", "转换为小写或大写的字符串"],
            ["`SUBSTRING(Text, Start, Length)`", "字符串的一部分；第一个字符的位置是 1"],
            ["`ROUND(Value, Places)`", "四舍五入到指定小数位数的实数"],
            ["`RANDOM()`", "0 到 1 之间的随机实数，包括 0 和 1"],
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
        heading: "速查表",
        body: ["每个代码块都有对应的结束关键字。块的开头和结尾一一对应，程序就更容易追踪和调试。"],
        visual: {
          kind: "table",
          columns: ["结构", "开始", "结束"],
          rows: [
            ["选择", "`IF ... THEN`", "`ENDIF`"],
            ["多路选择", "`CASE OF ...`", "`ENDCASE`"],
            ["计数控制循环", "`FOR ... TO ...`", "`NEXT ...`"],
            ["前置条件循环", "`WHILE ... DO`", "`ENDWHILE`"],
            ["后置条件循环", "`REPEAT`", "`UNTIL ...`"],
            ["过程", "`PROCEDURE ...`", "`ENDPROCEDURE`"],
            ["函数", "`FUNCTION ... RETURNS ...`", "`ENDFUNCTION`"],
          ],
        },
      },
    ],
  },
  {
    slug: "choosing-a-loop",
    unit: "pseudocode-reference",
    title: "选择合适的循环",
    description: "何时使用 FOR、WHILE 或 REPEAT UNTIL，嵌套循环如何工作，以及如何确保每个循环都能结束。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "该用哪种循环",
        body: ["选错循环类型，或写出无法停止的循环，都是常见的失分原因。几种循环的区别在于何时检查条件。"],
        visual: {
          kind: "table",
          columns: ["循环", "何时检查条件", "至少执行一次？", "适用场景"],
          rows: [
            ["`FOR`", "不检查条件：按范围计数", "是，除非范围为空", "已知重复次数"],
            ["`WHILE`", "每轮开始前", "否", "循环可能一次都不需要执行"],
            ["`REPEAT ... UNTIL`", "每轮结束后", "是", "循环体必须执行一次，例如请求输入"],
          ],
        },
      },
      {
        heading: "用 FOR 计数",
        body: [
          "上下界都包括在内，所以 `FOR Count <- 1 TO 5` 会运行五次。加上 `STEP` 可以改变步长，也可以倒数：`FOR Count <- 10 TO 0 STEP -2`。",
        ],
        example: `DECLARE Count : INTEGER
DECLARE Total : INTEGER
Total <- 0

FOR Count <- 1 TO 5
    Total <- Total + Count
NEXT Count

OUTPUT "Total = ", Total`,
        visual: { kind: "trace", columns: ["Count", "Total"], rows: [["–", "0"], ["1", "1"], ["2", "3"], ["3", "6"], ["4", "10"], ["5", "15"]], stepper: true },
        visualTitle: "跟踪：每轮之后的 Total",
        exampleFirst: true,
      },
      {
        heading: "用 WHILE 在条件成立时重复",
        body: [
          "每轮开始前都会检查条件。如果开始时条件为 `FALSE`，循环体一次也不执行。循环体内必须有内容发生变化，条件才可能变为 `FALSE`。",
        ],
        example: `DECLARE Number : INTEGER
INPUT Number

WHILE Number > 9 DO
    Number <- Number - 9
ENDWHILE

OUTPUT Number`,
        visual: {
          kind: "trace",
          columns: ["Number", "Number > 9", "执行结果"],
          rows: [
            ["28", "TRUE", "减去 9"],
            ["19", "TRUE", "减去 9"],
            ["10", "TRUE", "减去 9"],
            ["1", "FALSE", "退出并输出 1"],
          ],
          stepper: true,
        },
        visualTitle: "输入 28 时的跟踪",
        exampleFirst: true,
      },
      {
        heading: "用 REPEAT UNTIL 校验输入",
        body: [
          "先执行循环体，再测试条件，所以用户至少会被询问一次。把 `UNTIL` 后的条件写成“有效”或“已完成”的状态，而不是无效的状态。",
          "如果第一次输入错误，循环会再次询问；如果输入正确，循环执行一轮后就结束。",
        ],
        example: `DECLARE Password : STRING

REPEAT
    OUTPUT "Enter password"
    INPUT Password
UNTIL Password = "Secret"`,
      },
      {
        heading: "用嵌套循环处理表格和网格",
        body: [
          "在一个循环中放入另一个循环，可以处理行和列，例如二维数组。外层循环每执行一轮，内层循环都会完整执行一遍。在内层循环开始前，重置每行的累加值。",
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
        callout: { tone: "tip", text: "运行一下：三行的总和分别是 10、20 和 30，总计为 60。" },
      },
      {
        heading: "确保每个循环都能结束",
        body: ["运行循环之前，先用下面的问题检查一遍。"],
        bullets: [
          "每轮循环是否都会改变条件所依赖的值？",
          "条件最终能否变为 `FALSE`（`WHILE`）或 `TRUE`（`UNTIL`）？",
          "循环边界是否正确，没有差一错误？",
          "是否在循环前设置了计数器和累加值？",
        ],
        callout: {
          tone: "warn",
          text: "如果程序一直不结束，通常是卡在了某个循环里。先停止程序，再跟踪该循环两三轮内条件的变化。",
        },
      },
    ],
  },
  {
    slug: "worked-programs",
    unit: "pseudocode-reference",
    title: "完整示例程序",
    description: "四个完整的考试风格程序，附讲解和示例运行：统计分数、校验菜单输入、搜索数组，以及使用子程序。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "程序 A：统计及格人数并求平均分",
        body: ["读取 5 个分数，统计及格（50 分及以上）的人数，并输出平均分。"],
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
          "恰好有 5 个分数，所以适合使用计数控制的 `FOR` 循环。",
          "`Total` 累加每个分数；只有 `IF` 条件成立时，`PassCount` 才会增加。",
          "平均分在循环结束后只计算一次。",
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
        visualTitle: "示例运行",
        caption: "输出：Passes = 3，Average = 55.4",
      },
      {
        heading: "程序 B：只接受有效的菜单选项",
        body: ["一直询问，直到用户输入 1 到 4 之间的选项。"],
        example: `DECLARE Choice : INTEGER

REPEAT
    OUTPUT "1.View 2.Add 3.Delete 4.Exit"
    INPUT Choice
UNTIL Choice >= 1 AND Choice <= 4

OUTPUT "Accepted choice: ", Choice`,
        exampleFirst: true,
        bullets: [
          "用户至少要看到一次菜单，所以适合使用 `REPEAT ... UNTIL`。",
          "条件说明什么是有效选项，而不是什么是无效选项。",
          "`AND` 同时检查下限和上限。",
        ],
        visual: {
          kind: "table",
          columns: ["输入", "有效？", "执行结果"],
          rows: [
            ["8", "否", "再次询问"],
            ["0", "否", "再次询问"],
            ["3", "是", "输出 `Accepted choice: 3`"],
          ],
        },
        visualTitle: "示例运行",
      },
      {
        heading: "程序 C：使用标志搜索数组",
        body: ["判断用户输入的姓名是否在数组 `StudentNames` 中。"],
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
          "`Found` 初始为 `FALSE`，找到匹配的姓名时变为 `TRUE`。",
          "这个写法会检查每个元素。它清晰易懂，阅卷员通常会接受。",
          "最后的 `IF` 根据标志输出一条消息。输入 `Ali`，输出为 `Found`。",
        ],
      },
      {
        heading: "程序 D：结合使用过程与函数",
        body: ["用过程显示一条横线，用函数完成计算。"],
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
          "调用过程本身就是一条语句，所以以 `CALL` 开头。",
          "函数会返回值，所以函数调用写在表达式中。",
          "`PrintLine(10)` 输出 10 条短横线，`SumSquare(3, 4)` 返回 25，所以最后一行是 `Answer = 25`。",
        ],
      },
    ],
  },
  {
    slug: "trace-tables",
    unit: "pseudocode-reference",
    title: "跟踪表与手动运行",
    description: "逐轮记录变量的变化，在阅卷员发现之前找出逻辑错误。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "为什么要手动运行程序",
        body: [
          "程序能通过编译，也可能给出错误的答案。手动运行是指用示例值逐步跟着程序走，并在每个变量变化后记下它的值。考试中，快速跟踪一遍就能发现大多数逻辑错误。",
        ],
      },
      {
        heading: "跟踪一个阶乘循环",
        body: ["这个程序计算 N 的阶乘。给每个会变化的变量单独一列，循环每执行一轮就加一行。"],
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
          columns: ["I", "执行前的 Fact", "执行 Fact <- Fact * I 后的 Fact"],
          rows: [
            ["1", "1", "1"],
            ["2", "1", "2"],
            ["3", "2", "6"],
            ["4", "6", "24"],
            ["5", "24", "120"],
          ],
          stepper: true,
        },
        visualTitle: "N = 5 时的跟踪",
        caption: "预期输出为 120。",
      },
      {
        heading: "跟踪表与输出不一致时",
        body: [
          "用跟踪时相同的输入运行程序。如果输出不同，先检查循环边界和初始值：把 `Fact` 初始化为 0，或从 0 开始循环，是最常见的原因。",
          "在台式机或笔记本上，流程图模式可以逐块回放运行过程，方便你把每一步与跟踪表对照。",
        ],
      },
    ],
  },
  {
    slug: "reading-writing-files",
    unit: "pseudocode-reference",
    title: "读写文件",
    description: "用 Cambridge 风格的伪代码打开、读取、写入和关闭文本文件。",
    updated: "2026-11-02",
    sections: [
      {
        heading: "四个步骤",
        body: ["所有文件操作都遵循相同的模式。"],
        visual: {
          kind: "flow",
          nodes: [
            { label: "声明", detail: "文件名和数据变量" },
            { label: "打开", detail: "`OPENFILE` 加 `FOR READ` 或 `FOR WRITE`" },
            { label: "读取或写入", detail: "`READFILE` 或 `WRITEFILE`" },
            { label: "关闭", detail: "完成后使用 `CLOSEFILE`" },
          ],
        },
      },
      {
        heading: "读取一行",
        body: ["`READFILE` 把文件的下一行读入字符串变量。"],
        example: `DECLARE FileName : STRING
DECLARE LineText : STRING

FileName <- "Scores.txt"
OPENFILE FileName FOR READ
READFILE FileName, LineText
OUTPUT "First line: ", LineText
CLOSEFILE FileName`,
      },
      {
        heading: "写入一行",
        body: ["`WRITEFILE` 向以 `FOR WRITE` 打开的文件写入一行。"],
        example: `DECLARE FileName : STRING

FileName <- "Scores.txt"
OPENFILE FileName FOR WRITE
WRITEFILE FileName, "Mai,42"
CLOSEFILE FileName`,
        callout: {
          tone: "warn",
          text: "不要同时以 `READ` 和 `WRITE` 模式打开同一个文件。即使算法很短，也要记得关闭文件。",
        },
      },
    ],
  },
];
