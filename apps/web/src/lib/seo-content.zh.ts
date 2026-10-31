// Simplified Chinese content. Slugs must match the English entries in seo-content.ts
// so /zh/blog/<slug> and /blog/<slug> are translations of the same page.
import type { FaqItem, SeoPost } from "./seo-content";

export const postsZh: SeoPost[] = [
  {
    slug: "igcse-pseudocode-basics",
    title: "IGCSE 伪代码基础：实用的起点",
    description: "一份关于声明、赋值、输入、输出的精简指南，以及让伪代码更容易跟踪的好习惯。",
    date: "2026-05-04",
    readingTime: "5 分钟阅读",
    tags: ["IGCSE", "伪代码", "基础"],
    sections: [
      {
        heading: "从明确的数据开始",
        body: [
          "好的伪代码不只是加了关键字的英语。它给数据起清晰的名字，声明预期的类型，并让每一次改变都清晰可见。",
          "对初学者来说，最好的习惯是写一些能编译、能运行、并且产生一个明确结果的小程序。",
        ],
      },
      {
        heading: "先跟踪，再优化",
        body: [
          "在把程序改短之前，先用几个样例值逐行跟踪。一张清晰的跟踪表能很快暴露漏掉的初始化和循环中的差一错误。",
        ],
      },
    ],
  },
  {
    slug: "how-to-trace-pseudocode",
    title: "如何跟踪伪代码，而不是靠猜",
    description: "用一套可重复的跟踪表流程，逐步跟踪变量、分支和循环更新。",
    date: "2026-05-04",
    readingTime: "6 分钟阅读",
    tags: ["跟踪", "复习", "调试"],
    sections: [
      {
        heading: "把变量写成列",
        body: [
          "跟踪表把看不见的程序状态变成可以检查的东西。每个会变化的变量占一列。",
          "只有在发生赋值、INPUT 或循环计数器变化时才更新表格。",
        ],
      },
      {
        heading: "标出分支判断",
        body: [
          "对于 IF 和 WHILE 的条件，在条件旁边写下 true 或 false。这样能避免最常见的错误：执行了程序本该跳过的块。",
        ],
      },
    ],
  },
  {
    slug: "choosing-the-right-loop",
    title: "FOR、WHILE 和 REPEAT UNTIL 该怎么选",
    description: "学会一条简单的判断规则，选出合适的伪代码循环结构。",
    date: "2026-05-04",
    readingTime: "4 分钟阅读",
    tags: ["循环", "控制流", "语法"],
    sections: [
      {
        heading: "次数已知就用 FOR",
        body: ["当你确切知道需要处理多少个值、多少行或多少次尝试时，FOR 循环能最清楚地表达这个意图。"],
      },
      {
        heading: "次数未知就用条件循环",
        body: [
          "第一次执行前必须检查条件时用 WHILE。提示或动作至少要发生一次时用 REPEAT UNTIL。",
        ],
      },
    ],
  },
  {
    slug: "common-pseudocode-compiler-errors",
    title: "常见伪代码编译错误及修复方法",
    description: "更快地修复未声明变量、缺少块结束语句、非法赋值和类型不匹配。",
    date: "2026-05-04",
    readingTime: "7 分钟阅读",
    tags: ["编译错误", "诊断信息", "练习"],
    sections: [
      {
        heading: "未声明的名字",
        body: [
          "如果某个变量拼错了一次，编译器可能把它当成另一个未声明的名字。把诊断信息里的拼写和声明处对照一下。",
        ],
      },
      {
        heading: "块结束语句",
        body: [
          "漏掉 ENDIF、NEXT、ENDWHILE 或 UNTIL 会改变后面每一行的结构。先修好块结构，再去追后面的错误。",
        ],
      },
    ],
  },
  {
    slug: "why-use-a-browser-pseudocode-editor",
    title: "为什么要用在线伪代码编辑器？",
    description: "基于浏览器的编译器让伪代码练习更快，因为反馈、示例和运行都在同一个地方。",
    date: "2026-05-04",
    readingTime: "5 分钟阅读",
    tags: ["在线编辑器", "学习", "工具"],
    sections: [
      {
        heading: "即时反馈改变练习方式",
        body: [
          "反馈是即时的，学生就能测试更小的改动，并准确理解是哪一行引起了问题。",
          "在线编辑器还省去了安装配置：打开页面，输入，运行，修改。",
        ],
      },
      {
        heading: "把学习资料放在手边",
        body: ["文档、示例和手册应该就在编辑器旁边，让参考资料支持练习，而不是打断练习。"],
      },
    ],
  },
  {
    slug: "random-pseudocode-practice",
    title: "为什么随机题比固定练习单更有用",
    description: "打乱顺序的原创伪代码题更接近没见过的试卷，而不是反复做同一组五个例子。",
    date: "2026-09-19",
    readingTime: "4 分钟阅读",
    tags: ["练习", "IGCSE", "复习"],
    sections: [
      {
        heading: "没见过才是重点",
        body: [
          "试卷不会按上周练习单的顺序再出一遍。随机练习逼你从题面里判断该用循环、条件还是数组遍历，而不是靠记忆。",
        ],
      },
      {
        heading: "让编译器一起参与",
        body: [
          "在编辑器里写答案，对着样例运行，然后再抽一题。漏掉 ENDIF 或未声明名字时，编译器会在你把同样的错误写到纸上之前拦住你。",
        ],
      },
    ],
  },
];

export const faqZh: FaqItem[] = [
  {
    question: "PseudoEditor 是什么？",
    answer:
      "PseudoEditor 是一个免费开源的伪代码编辑器和编译器。编辑器、编译器、运行器、流程图视图、手册和工作区工具全部在浏览器应用中运行。",
  },
  {
    question: "可以在浏览器里运行伪代码吗？",
    answer: "可以。PseudoEditor 会把支持的伪代码编译成 AST，并在浏览器运行时中执行，包括交互式的 INPUT 输入提示。",
  },
  {
    question: "浏览器版本会保存我的工作吗？",
    answer:
      "本地开发环境会保存到浏览器存储。在 pseudoeditor.dev 上，登录用户可以通过 Clerk 身份验证和 Convex 云端同步保存工作区。",
  },
  {
    question: "这只适用于 IGCSE 计算机科学吗？",
    answer:
      "不是。设置里可以在剑桥 IGCSE、剑桥 AS 和 A Level、IB 文凭课程、OCR GCSE 和 AQA GCSE 记法之间切换。编译器、高亮和自动补全会跟随你选择的语法。",
  },
  {
    question: "伪代码遵循哪个考试局的规范？",
    answer:
      "语法遵循剑桥国际的伪代码指南，该指南用于 IGCSE 计算机科学（0478 和 0984）、O Level 计算机科学（2210）以及 AS 和 A Level 计算机科学（9618）。PseudoEditor 是独立项目，与剑桥无隶属关系，也未获其认可。",
  },
  {
    question: "需要安装什么吗？",
    answer:
      "不需要。编辑器、编译器和运行时可以在笔记本电脑、Chromebook 或平板上的任何现代浏览器中加载。什么都不用安装，也不需要学校 IT 部门审批。",
  },
  {
    question: "PseudoEditor 真的免费吗？以后会一直免费吗？",
    answer:
      "是的，而且会一直免费。没有付费套餐，没有试用期，以后也不会推出收费的高级版。PseudoEditor 同时是开源的：源代码基于 Apache License 2.0 发布在 GitHub 上，你可以阅读它、自己运行它，也可以参与贡献。",
  },
  {
    question: "可以练习随机的考试风格题目吗？",
    answer:
      "可以。练习页会随机抽取一道原创的 IGCSE、O Level 或 A Level 风格题目。你可以按主题筛选，在编辑器中打开起始文件，并在浏览器里运行你的答案。",
  },
];
