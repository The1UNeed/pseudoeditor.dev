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
    slug: "flowchart-mode",
    unit: "pseudoeditor",
    title: "流程图模式",
    description:
      "把程序转换成流程图再转回代码，逐个组件跟随程序运行，并在任一视图中编辑。",
    updated: "2026-10-31",
    sections: [
      {
        heading: "打开流程图模式",
        body: [
          "打开一个文件，然后点击工具栏中的流程图按钮。再次点击即可回到代码。流程图就是同一个程序：在任一视图中修改，另一个都会随之更新，你的关键字、注释、空行和缩进都会保持原样。",
          "流程图模式需要鼠标或触控板，因此可在台式机和笔记本电脑上使用，手机和平板上不提供。画布控件中的“适应视图”会缩小画面，直到整个流程都显示在屏幕上。",
        ],
      },
      {
        heading: "代码如何变成形状",
        body: [
          "每条语句都会被画出来。IB 的 `loop until` 在循环体之前判断，条件为“否”时执行循环体；OCR 的 `do ... until` 和 `switch` 的画法与 `REPEAT` 和 `CASE` 相同。",
        ],
        visual: {
          kind: "table",
          columns: ["代码", "画成"],
          rows: [
            ["`INPUT`、`OUTPUT`", "输入 / 输出平行四边形"],
            ["`IF`、`ELSEIF`、`WHILE`、`FOR`", "判断框；“是”从右侧引出，“否”从底部引出，循环体有一条箭头回到判断框"],
            ["`REPEAT ... UNTIL`", "先画循环体，再画判断框：“否”回到开头，“是”继续向下"],
            ["`CASE`", "一串判断框，例如 `Choice = 1`，每个选项一个，`OTHERWISE` 在最后"],
            ["`PROCEDURE`、`FUNCTION`", "在主流程图旁边单独画成一张流程图，从首行画到 Return"],
            ["`CALL`", "子程序框"],
            ["赋值、`DECLARE`、`RETURN`、注释", "处理框，原样保留"],
          ],
        },
      },
      {
        heading: "示例",
        body: [
          "在流程图模式中打开这个程序。`REPEAT` 和 `CASE` 会变成主流程中的判断框，`Greet` 会在右侧单独画成一张流程图。",
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
        heading: "跟随程序运行",
        body: [
          "在流程图打开时点击“运行”。程序会照常运行，需要 `INPUT` 时在终端中输入，随后流程图会回放这次运行：程序执行到哪个组件，哪个组件就会亮起，经过的箭头会被突出显示，尚未执行到的组件会变淡。",
          "流程图上方的控制条可以自动播放，也可以一次前进或后退一个组件。它会显示每个判断走了哪条分支，例如 `Count >= 3 → No`，以及最新的一行输出。`CALL` 会跳到该过程自己的流程图，执行到 Return 后再回来。",
          "如果程序因错误而停止，回放会停在出错的组件上，并以红色标出。运行步骤很多时只显示前 5,000 步。修改流程图后回放会结束；再次点击“运行”即可跟随新版本。",
        ],
      },
      {
        heading: "在任一视图中编辑",
        body: [
          "从组件栏把组件拖到画布上，把每个组件底部的连接点连到下一个组件的顶部，选中组件后可在检查器中编辑其文字。新加的组件会使用设置中所选考试语法的关键字。",
          "删除判断框以外的组件时，它前后的组件会自动连起来。“清空画布”会清空整个文件，因此需要再点击一次确认。",
          "每个 `CASE` 选项只能有一条语句。如果在某个选项中再加一个组件，或把它的条件改成判断别的内容，这串判断框就会改写成 `IF` 和 `ELSEIF`，以确保代码仍能编译。修改过程的首行会重命名该过程，记得同时修改它的 `CALL` 组件。",
          "即使文件无法编译，流程图也能打开。这时它会逐行读取文件，无法放进流程图的行（例如还没有 `ENDIF` 的 `IF`）会原样显示在处理框中。",
        ],
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
