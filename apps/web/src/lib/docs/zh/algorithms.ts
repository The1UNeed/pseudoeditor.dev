import type { Doc } from "../types";

export const algorithmsZh: Doc[] = [
  {
    slug: "program-development-life-cycle",
    unit: "algorithms",
    title: "程序开发生命周期",
    description: "分析、设计、编码和测试，以及分解和结构图如何把大问题拆成小问题。",
    updated: "2026-10-31",
    syllabus: "7.1–7.3",
    sections: [
      {
        heading: "四个阶段",
        body: ["程序是分阶段构建的。每个阶段都为下一阶段提供输入，测试也常常让你回头修改设计或代码。"],
        visual: {
          kind: "flow",
          nodes: [
            { label: "分析", detail: "理解问题：抽象、分解，并列出需求。" },
            { label: "设计", detail: "用结构图、流程图和伪代码规划解决方案。" },
            { label: "编码", detail: "编写程序，边写边测试每个部分（迭代测试）。" },
            { label: "测试", detail: "用测试数据运行完成的程序，检查它是否符合要求。" },
          ],
        },
      },
      {
        heading: "抽象与分解",
        body: [
          "**抽象**是指只保留重要的细节，忽略其余部分。地铁线路图只显示车站和停靠顺序，而不显示轨道的确切弯曲。",
          "**分解**是指把问题拆成更容易解决的子问题，直到每个子问题都简单到可以直接编码。每个计算机系统都由子系统组成，子系统又由更小的子系统组成。",
          "分解问题时，要找出它的**输入**、**处理**、**输出**和**存储**。",
        ],
      },
      {
        heading: "结构图",
        body: ["**结构图**把分解过程画成一棵树。整个系统位于顶端，下面的每一层把一个方框拆成更小的部分。"],
        visualTitle: "闹钟应用的结构图",
        visual: {
          kind: "structure",
          root: {
            label: "闹钟",
            children: [
              { label: "设置闹钟", children: [{ label: "输入时间" }, { label: "保存时间" }] },
              { label: "检查时间", children: [{ label: "读取时钟" }, { label: "比较" }] },
              { label: "响铃", children: [{ label: "播放声音" }, { label: "稍后提醒" }] },
            ],
          },
        },
      },
      {
        heading: "设计算法的方式",
        body: ["**算法**是解决问题的一系列步骤。同一个算法可以用三种方式写出来："],
        bullets: [
          "**结构图：**展示问题如何分解，但不展示步骤的顺序。",
          "**流程图：**用相互连接的图形展示步骤和判断。",
          "**伪代码：**一种结构化、与具体语言无关的书写方式，接近真正的代码。",
        ],
        callout: { tone: "tip", text: "下一课“流程图”会介绍所有流程图符号，“编程”主题会详细讲解伪代码。" },
      },
    ],
    keyTerms: [
      { term: "抽象", definition: "去掉不必要的细节，专注于重要的部分。" },
      { term: "分解", definition: "把问题拆成更小的子问题。" },
      { term: "结构图", definition: "展示系统如何拆分为子系统的树形图。" },
      { term: "算法", definition: "解决问题的一系列步骤。" },
    ],
    quiz: [
      { question: "说出程序开发生命周期的四个阶段。", answer: "分析、设计、编码、测试。" },
      { question: "结构图和流程图在哪个阶段产生？", answer: "**设计**阶段。" },
      { question: "抽象和分解有什么区别？", answer: "抽象去掉不必要的细节；分解把问题拆成更小的部分。" },
    ],
  },
  {
    slug: "flowcharts",
    unit: "algorithms",
    title: "流程图",
    description: "标准流程图符号，如何画出选择和循环，以及流程图如何变成伪代码。",
    updated: "2026-10-31",
    syllabus: "7.3",
    sections: [
      {
        heading: "符号",
        body: ["每种图形只有一种含义。箭头（流程线）表示步骤执行的顺序。"],
        visual: {
          kind: "table",
          columns: ["图形", "名称", "用于"],
          rows: [
            ["圆角矩形", "起止符", "`START` 和 `STOP`"],
            ["矩形", "处理", "计算和赋值，例如 `Total ← Total + Mark`"],
            ["平行四边形", "输入 / 输出", "`INPUT Mark`、`OUTPUT Total`"],
            ["菱形", "判断", "一个是/否问题，例如 `Mark >= 50?`，有两个出口"],
            ["两侧带竖线的矩形", "子程序", "调用在别处定义的过程或函数"],
          ],
        },
      },
      {
        heading: "流程图中的循环",
        body: ["这个流程图把五个分数加起来。判断框检查是否已经输入了五个分数。如果没有，**否**箭头就回到输入下一个分数的地方。"],
        visualTitle: "五个分数的总和",
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
          loop: { from: 4, to: 2, label: "否", exitLabel: "是" },
        },
      },
      {
        heading: "同一个算法的伪代码",
        body: ["每个图形都对应一行伪代码。重复执行直到条件为真的循环，写成 `REPEAT ... UNTIL`。"],
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
        callout: { tone: "tip", text: "PseudoEditor 的流程图模式能把任何程序画成流程图，并把你的修改转换回伪代码。点击“运行”后，程序执行到哪个组件，哪个组件就会亮起；详见“流程图模式”一课。" },
      },
    ],
    keyTerms: [
      { term: "起止符", definition: "表示 START 和 STOP 的流程图符号。" },
      { term: "判断", definition: "带有是/否问题和两个出口的菱形符号。" },
      { term: "流程线", definition: "表示步骤顺序的箭头。" },
    ],
    quiz: [
      { question: "`INPUT Age` 用哪个流程图符号？", answer: "**平行四边形**（输入 / 输出）。" },
      { question: "判断符号有几个箭头出口？", answer: "**两个**：一个表示“是”，一个表示“否”。" },
    ],
  },
  {
    slug: "standard-algorithms",
    unit: "algorithms",
    title: "查找、排序与标准方法",
    description: "逐步讲解线性查找、冒泡排序、求和、计数，以及求最大值、最小值和平均值。",
    updated: "2026-10-31",
    syllabus: "7.4",
    sections: [
      {
        heading: "线性查找",
        body: ["**线性查找**从第一项到最后一项依次检查列表中的每一项，直到找到目标或到达末尾。列表不需要事先排好序。"],
        visualTitle: "线性查找 23",
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
        heading: "冒泡排序",
        body: [
          "**冒泡排序**遍历列表，比较每一对相邻的数据，如果顺序不对就交换。每一轮结束后，未排序部分中最大的数就“冒泡”到了末尾。当某一轮没有发生交换时，排序结束。",
          "按下“播放”，观察被比较的橙色一对。已经到达最终位置的数据会被填充高亮。",
        ],
        visualTitle: "冒泡排序",
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
        callout: { tone: "tip", text: "交换需要一个临时变量。没有 `Temp`，第一次赋值就会覆盖掉其中一个值。" },
      },
      {
        heading: "求和与计数",
        body: ["**求和**维护一个累计总数：从 0 开始，逐个加上每个值。**计数**在某件事发生时加 1。两个变量都必须在循环前设为 0。"],
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
        heading: "最大值、最小值与平均值",
        body: [
          "求**最大值**时，记住目前见过的最大值，遇到更大的就替换它。**最小值**同理，只是换成更小的值。两者都从第一个值开始（或从一个超出可能范围的值开始）。",
          "**平均值**等于总和除以数据的个数。",
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
      { term: "线性查找", definition: "依次检查每一项，直到找到目标或列表结束。" },
      { term: "冒泡排序", definition: "反复比较并交换相邻数据，直到不再需要交换。" },
      { term: "求和", definition: "把每个值加到累计总数上。" },
      { term: "计数", definition: "每当某件事发生时给计数器加 1。" },
    ],
    quiz: [
      { question: "在 50 项的列表上，线性查找最多比较几次？", answer: "**50** 次，当目标在最后或不在列表中时。" },
      { question: "冒泡排序为什么使用 `Swap` 标志？", answer: "如果一整轮都没有交换，列表已经有序，算法就可以提前结束。" },
      { question: "为什么必须在循环前把 `Total` 设为 0？", answer: "否则它会从一个未知的值开始，总和就会出错。" },
    ],
  },
  {
    slug: "validation-and-verification",
    unit: "algorithms",
    title: "验证与核实",
    description: "范围、长度、类型、存在性、格式和校验位检查，以及双重输入和目视检查。",
    updated: "2026-10-31",
    syllabus: "7.5",
    sections: [
      {
        heading: "验证",
        body: [
          "**验证**（validation）是程序在接受数据之前自动检查数据是否**合理**、是否符合规定的规则。它无法判断数据是否正确：即使你其实 16 岁，输入 15 也能通过范围检查。",
        ],
        visual: {
          kind: "table",
          columns: ["检查", "确保……", "例子"],
          rows: [
            ["范围", "值在下限和上限之间", "百分比在 0 到 100 之间"],
            ["长度", "数据的字符数恰好等于、或不少于/不多于某个数", "密码至少 8 个字符"],
            ["类型", "数据是正确的数据类型", "年龄是整数而不是文字"],
            ["存在性", "已经输入了数据，没有留空", "电子邮件栏不为空"],
            ["格式", "数据符合某种模式", "日期为 DD/MM/YYYY；代码为两个字母加四个数字"],
            ["校验位", "编码的最后一位与根据其他位算出的结果一致", "ISBN 和条形码"],
          ],
        },
      },
      {
        heading: "验证循环",
        body: ["`REPEAT ... UNTIL` 循环会一直询问，直到输入通过检查。这个例子做的是范围检查，每次拒绝时都会显示错误提示。"],
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
        heading: "长度检查",
        body: ["`LENGTH()` 返回字符串中的字符个数，因此可用于长度检查。"],
        example: `DECLARE Password : STRING
INPUT Password
WHILE LENGTH(Password) < 8 DO
    OUTPUT "Password must be at least 8 characters"
    INPUT Password
ENDWHILE`,
      },
      {
        heading: "核实",
        body: ["**核实**（verification）检查数据是否被**准确地复制或输入**，与原始数据一致。"],
        bullets: [
          "**双重输入：**数据输入两次，再比较两次输入，就像设置新密码时要输入两遍。",
          "**目视检查：**用户阅读屏幕上的数据，并与原始文件对照。",
        ],
        callout: { tone: "key", text: "验证：数据合理吗？核实：数据和原始数据一样吗？" },
      },
    ],
    keyTerms: [
      { term: "验证", definition: "在接受数据前自动检查数据是否合理。" },
      { term: "核实", definition: "检查数据是否被准确复制或输入。" },
      { term: "范围检查", definition: "检查值是否在规定的界限之内。" },
      { term: "双重输入", definition: "把数据输入两次并比较两次的结果。" },
    ],
    quiz: [
      { question: "哪种验证检查确保某栏没有留空？", answer: "**存在性检查**。" },
      { question: "为什么数据通过了验证仍可能是错的？", answer: "验证只检查数据是否合理、是否符合规则，而不检查它是否是真实的值。" },
      { question: "为英国邮编（如 `CB2 1TN`）建议一种验证检查。", answer: "**格式检查**（字母和数字按正确的模式排列），或长度检查。" },
    ],
  },
  {
    slug: "testing-and-trace-tables",
    unit: "algorithms",
    title: "测试数据与追踪表",
    description: "正常、异常、极端和边界测试数据，以及如何逐行追踪一个算法。",
    updated: "2026-10-31",
    syllabus: "7.6–7.8",
    sections: [
      {
        heading: "测试数据的类型",
        body: ["要充分测试一个程序，你需要几类数据。以一个接受 0 到 100 整数百分比的程序为例："],
        visual: {
          kind: "table",
          columns: ["类型", "含义", "0–100 的例子", "预期结果"],
          rows: [
            ["正常", "应当被接受的普通数据", "45、72", "接受"],
            ["异常", "应当被拒绝的数据", "−20、150、\"abc\"", "拒绝"],
            ["极端", "应当被接受的最大值和最小值", "0、100", "接受"],
            ["边界", "每个界限上的值以及刚好越界的值", "0 和 −1，100 和 101", "接受 0 和 100，拒绝 −1 和 101"],
          ],
        },
        callout: { tone: "tip", text: "给出边界数据时，总要成对给出：最后一个被接受的值和第一个被拒绝的值。" },
      },
      {
        heading: "追踪表",
        body: [
          "**追踪表**逐行记录算法运行时每个变量的值。它能让你在没有计算机的情况下检查算法做了什么、找出逻辑错误、推算出输出。",
          "下面的算法只把输入中的正数加起来。用输入 5、−2、7、3 逐步完成它的追踪表。",
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
        visualTitle: "追踪表，输入 5、−2、7、3",
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
        caption: "输入 −2 时条件为假，所以 `Total` 保持为 5。",
      },
      {
        heading: "找出错误",
        body: [
          "**语法错误**违反了语言规则，例如漏写 `ENDIF`，会导致程序无法被翻译。**逻辑错误**让程序能运行，但结果是错的。",
          "这个算法本应输出 10 个数中的最大值，但它有一个逻辑错误。你能找到吗？",
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
          text: "比较应该是 `Number > Largest`。另外，`Largest` 从 0 开始时，如果所有数都是负数就会出错。用第一个输入的数作为初值更安全。",
        },
      },
    ],
    keyTerms: [
      { term: "正常数据", definition: "在可接受范围内、应当被接受的数据。" },
      { term: "异常数据", definition: "应当被拒绝的数据。" },
      { term: "极端数据", definition: "应当被接受的最大值和最小值。" },
      { term: "边界数据", definition: "处于可接受范围边缘以及刚好超出范围的值。" },
      { term: "追踪表", definition: "记录算法运行过程中变量值的表格。" },
      { term: "逻辑错误", definition: "程序能运行但结果错误的错误。" },
    ],
    quiz: [
      { question: "一个程序接受 11 到 18 岁。给出边界测试数据。", answer: "10 和 11（下界），18 和 19（上界）。接受 11 和 18，拒绝 10 和 19。" },
      { question: "对于年龄栏，\"twelve\" 是正常、异常、极端还是边界数据？", answer: "**异常**数据：数据类型错误，应当被拒绝。" },
      { question: "语法错误和逻辑错误有什么区别？", answer: "语法错误违反语言规则，代码无法翻译；逻辑错误能运行，但结果错误。" },
    ],
  },
];
