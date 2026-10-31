import type { Doc } from "../types";

export const pseudoeditorZh: Doc[] = [
  {
    slug: "getting-started",
    unit: "pseudoeditor",
    title: "PseudoEditor 入门：在线编写并运行伪代码",
    description: "打开浏览器编辑器，写下你的第一个伪代码程序，编译它，并直接在浏览器中运行。",
    updated: "2026-05-04",
    sections: [
      {
        heading: "从浏览器开始",
        body: [
          "打开应用，新建或选择一个伪代码文档，直接在编辑器中输入。开发环境下 PseudoEditor 会保存本地工作；在正式站点登录后，还支持工作区的云端同步。",
          "点击“运行”按钮编译当前文件。当编译器发现语法或语义问题时，诊断信息会带着行号和列号一起显示。",
        ],
      },
      {
        heading: "第一个程序",
        body: [
          "一个简单的程序会声明变量，用 `<-` 赋值，再用 `OUTPUT` 输出结果。初学时请保持每行只写一条语句，这样诊断信息更容易对照。",
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
    title: "伪代码语法参考（剑桥 IGCSE 风格）",
    description: "查阅浏览器编译器支持的核心伪代码语法，包括赋值、条件、循环、数组和输出。",
    updated: "2026-10-31",
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
    slug: "debugging-errors",
    unit: "pseudoeditor",
    title: "调试伪代码编译错误",
    description: "利用诊断信息、行号和输出结果，修复伪代码的语法和逻辑问题。",
    updated: "2026-05-04",
    sections: [
      {
        heading: "先看第一条错误",
        body: [
          "语法问题常常会连锁出现。先修复最早的那条错误，再运行一次，然后处理下一条诊断信息。",
          "行号和列号指向编译器首次发现问题的位置，它可能比真正的笔误稍微靠后一点。",
        ],
      },
      {
        heading: "检查声明和块结束语句",
        body: [
          "初学者的很多错误来自使用了未声明的变量、混用了值的类型，或者漏掉了 `ENDIF`、`NEXT`、`ENDWHILE` 或 `UNTIL`。",
        ],
        callout: {
          tone: "tip",
          text: "能通过编译的程序仍然可能是错的。错误清零之后，再像“测试与追踪表”一课那样，用测试数据追踪一遍。",
        },
      },
    ],
  },
  {
    slug: "saving-workspaces",
    unit: "pseudoeditor",
    title: "保存浏览器工作区",
    description: "了解 PseudoEditor 中浏览器本地存储和登录后云端同步的工作方式。",
    updated: "2026-05-04",
    sections: [
      {
        heading: "本地模式与云端模式",
        body: [
          "在 localhost 上，PseudoEditor 会把工作区保存到浏览器存储。在 pseudoeditor.dev 上，登录用户可以通过 Clerk 身份验证和 Convex 云端同步保存工作区。",
          "在正式站点未登录时可以在内存中编辑，但要保存到云端必须先登录。",
        ],
      },
    ],
  },
  {
    slug: "exam-style-practice",
    unit: "pseudoeditor",
    title: "如何练习随机伪代码题目",
    description: "用 PseudoEditor 的随机练习题，在浏览器编辑器里演练 IGCSE、O Level 和 A Level 算法题。",
    updated: "2026-09-19",
    sections: [
      {
        heading: "从一道随机题开始",
        body: [
          "打开练习页，点击“练习一道随机题”。页面会抽取一道原创的考试风格题目，这样你没法按固定顺序背答案。",
          "只想练循环、数组、字符串或过程时，按主题筛选。混合复习试卷 2 时，把筛选留在全部主题。",
        ],
      },
      {
        heading: "在编辑器里写",
        body: [
          "每道题都有起始文件。在编辑器中打开它，补全算法，再用样例输入运行。",
          "把样例输出当作第一次检查，再手算一个边界情况，然后再抽下一题。",
        ],
      },
    ],
  },
];
