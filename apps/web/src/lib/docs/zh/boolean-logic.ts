import type { Doc } from "../types";

export const booleanLogicZh: Doc[] = [
  {
    slug: "logic-gates",
    unit: "boolean-logic",
    title: "逻辑门与真值表",
    description: "六种逻辑门 NOT、AND、OR、NAND、NOR 和 XOR，以及它们的符号和真值表。",
    updated: "2026-10-31",
    syllabus: "10.1, 10.2",
    sections: [
      {
        heading: "逻辑门用 1 和 0 做决定",
        body: [
          "**逻辑门**是一种电子元件，接收一个或两个二进制输入，产生一个二进制输出。1 表示开（TRUE），0 表示关（FALSE）。CPU 的每一次计算都由数以百万计的逻辑门完成。",
          "**真值表**列出所有可能的输入组合以及每种组合的输出。2 个输入有 4 行，3 个输入有 8 行。",
        ],
      },
      {
        heading: "试试每一种门",
        body: ["选择一种门，然后点击输入（或真值表中的一行）。高亮的导线传输的是 1。"],
        visualTitle: "逻辑门探索器",
        visual: { kind: "logicGate", gates: ["NOT", "AND", "OR", "NAND", "NOR", "XOR"] },
      },
      {
        heading: "用文字描述规则",
        visual: {
          kind: "table",
          columns: ["逻辑门", "输出为 1 的条件", "表达式"],
          rows: [
            ["NOT", "输入为 0（把输入取反）", "`X = NOT A`"],
            ["AND", "两个输入**都**为 1", "`X = A AND B`"],
            ["OR", "**至少一个**输入为 1", "`X = A OR B`"],
            ["NAND", "非与：两个输入**不全**为 1", "`X = A NAND B`"],
            ["NOR", "非或：两个输入**都不**为 1", "`X = A NOR B`"],
            ["XOR", "两个输入**不同**", "`X = A XOR B`"],
          ],
        },
        body: [],
        callout: { tone: "tip", text: "门的输出端上的小圆圈表示 NOT。这正是 AND 与 NAND、OR 与 NOR 之间唯一的区别。" },
      },
    ],
    keyTerms: [
      { term: "逻辑门", definition: "对二进制输入执行布尔运算的元件。" },
      { term: "真值表", definition: "列出每种输入组合对应输出的表格。" },
      { term: "XOR", definition: "异或：只有两个输入不同时才输出 1。" },
    ],
    quiz: [
      { question: "哪种门只在两个输入都为 1 时输出 0？", answer: "**NAND**。" },
      { question: "`1 XOR 1` 等于多少？", answer: "**0**：两个输入相同。" },
      { question: "3 个输入的真值表需要几行？", answer: "2³ = **8** 行。" },
    ],
  },
  {
    slug: "logic-circuits",
    unit: "boolean-logic",
    title: "逻辑电路与表达式",
    description: "把逻辑门组合成电路，写出逻辑表达式，完成真值表，并把文字描述的问题转换成电路。",
    updated: "2026-10-31",
    syllabus: "10.3–10.5",
    sections: [
      {
        heading: "组合逻辑门",
        body: [
          "一个门的输出可以作为另一个门的输入。**逻辑电路**从左（输入）画到右（输出），也可以写成**逻辑表达式**，用括号表示哪些门先计算。",
          "切换下面的 A、B 和 C，跟着 1 在电路中走一遍。",
        ],
        visualTitle: "X = (A AND B) OR NOT C",
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "OR", inputs: [{ gate: "AND", inputs: ["A", "B"] }, { gate: "NOT", input: "C" }] },
        },
      },
      {
        heading: "完成真值表",
        body: [
          "对于有多个门的电路，为每个门的输出增加一个中间列。输入列从 000 按二进制数到 111，然后从左到右逐列算出结果。",
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
        callout: { tone: "tip", text: "中间列既能帮你得分，也能帮你发现错误。考试时只需填最后一列，但你可以自己加中间列。" },
      },
      {
        heading: "从文字描述出发",
        body: [
          "考试题常常用文字描述一个情境。把每个条件变成一个输入，再用与“且”“或”“非”对应的门把它们连接起来。",
          "**问题：**安全灯（X）在天黑时（A = 1）亮起，前提是检测到移动（B = 1）或者按下了测试按钮（C = 1）。",
          "这就得到 `X = A AND (B OR C)`。",
        ],
        visualTitle: "安全灯",
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "AND", inputs: ["A", { gate: "OR", inputs: ["B", "C"] }] },
        },
      },
      {
        heading: "再来一个：XOR 电路",
        body: [
          "**问题：**走廊灯（X）的两端各有一个开关（A 和 B）。拨动任一开关都会改变灯的状态，所以恰好有一个开关向上时灯亮，除非总开关 C 关闭（C = 0）。",
          "这就得到 `X = (A XOR B) AND C`。",
        ],
        visual: {
          kind: "logicCircuit",
          label: "X",
          expression: { gate: "AND", inputs: [{ gate: "XOR", inputs: ["A", "B"] }, "C"] },
        },
      },
    ],
    keyTerms: [
      { term: "逻辑电路", definition: "把逻辑门连接起来，让输出成为其他门的输入。" },
      { term: "逻辑表达式", definition: "用门的名称、输入和括号写出的电路，例如 X = A AND (B OR C)。" },
      { term: "中间列", definition: "真值表中记录中间门输出的列。" },
    ],
    quiz: [
      { question: "对于 `X = (A AND B) OR NOT C`，当 A = 0、B = 1、C = 1 时 X 是多少？", answer: "A AND B = 0，NOT C = 0，所以 X = 0 OR 0 = **0**。" },
      { question: "写出表达式：天热（A）且窗户没开（B）时风扇（X）打开。", answer: "`X = A AND NOT B`。" },
      { question: "在安全灯电路中，为什么白天即使检测到移动灯也不亮？", answer: "最后一个门是与 A 相连的 AND。白天 A = 0，所以无论 B 或 C 是什么，输出都是 0。" },
    ],
  },
];
