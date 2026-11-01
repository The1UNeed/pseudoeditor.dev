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
  {
    slug: "free-forever-and-open-source",
    title: "PseudoEditor 开源了，而且永远免费",
    description: "源代码基于 Apache License 2.0 发布在 GitHub 上，以后也不会推出付费套餐。",
    date: "2026-10-27",
    readingTime: "3 分钟阅读",
    tags: ["开源", "免费", "公告"],
    sections: [
      {
        heading: "免费，没有附加条件",
        body: [
          "PseudoEditor 没有付费套餐，没有试用期，以后也不会推出收费的高级版。编译器、运行时、流程图模式、文档和练习题全都在免费版里，因为根本没有别的版本。",
        ],
      },
      {
        heading: "代码公开",
        body: [
          "源代码基于 Apache License 2.0 发布在 GitHub 上：github.com/The1UNeed/pseudoeditor.dev。你可以看看编译器是怎样检查程序的，自己运行一份，或者提交修复。",
          "Apache 2.0 允许学校和其他项目在自己的工具里复用这些代码，只要保留许可证和版权声明即可。",
        ],
      },
      {
        heading: "为什么这对备考很重要",
        body: [
          "复习工具不应该在你考试前的那个学期突然收费。代码是公开的，所以无论这个网站以后怎样，任何人都能让 PseudoEditor 继续运行。",
        ],
      },
    ],
  },
  {
    slug: "exam-board-pseudocode-syntax",
    title: "按你的考试局的写法写伪代码",
    description: "在设置里，编译器可以在剑桥 IGCSE、剑桥 A Level、IB、OCR 和 AQA 的记法之间切换。",
    date: "2026-10-27",
    readingTime: "4 分钟阅读",
    tags: ["考试局", "语法", "编译器"],
    sections: [
      {
        heading: "各个考试局的伪代码并不一样",
        body: [
          "剑桥用 DECLARE 声明变量，用 <- 赋值。IB 使用小写关键字和 =。OCR 的考试参考语言使用 print、= 和 ==，很像 Python。AQA 用 ENDFOR 和 ENDWHILE 结束循环。用错记法练习，考前还得再改掉。",
        ],
      },
      {
        heading: "在设置里选择你的考试局",
        body: [
          "打开设置，选择考试语法：剑桥 IGCSE（0478 和 0984）、剑桥 AS 和 A Level（9618）、IB 文凭课程、OCR GCSE（J277）或 AQA GCSE（8525）。",
          "编译器、语法高亮和自动补全会一起切换，所以编辑器会按你要参加的那张试卷的记法检查程序。",
        ],
      },
      {
        heading: "同一个循环，五种写法",
        body: [
          "把 1 到 5 加起来，剑桥写作 FOR Number <- 1 TO 5 ... NEXT Number，IB 写作 loop COUNT from 1 to 5 ... end loop，OCR 写作 for number = 1 to 5 ... next number，AQA 写作 FOR number ← 1 TO 5 ... ENDFOR。每一种都能在对应的语法下编译和运行。",
        ],
      },
    ],
  },
  {
    slug: "igcse-computer-science-course",
    title: "文档现在是一门完整的 IGCSE 计算机科学课程",
    description: "32 节图解课程按剑桥 0478 考纲覆盖两张试卷，从二进制讲到布尔逻辑，图示都可以动手操作。",
    date: "2026-10-31",
    readingTime: "4 分钟阅读",
    tags: ["IGCSE", "课程", "复习"],
    sections: [
      {
        heading: "两张试卷，按考纲顺序",
        body: [
          "文档以前只讲伪代码语法。现在它按剑桥 IGCSE 计算机科学（0478）考纲逐个主题展开。",
          "试卷 1 包括数据表示、数据传输、硬件、软件、互联网和新兴技术。试卷 2 包括算法设计、编程、数据库和布尔逻辑。一共 32 节课，有中文和英文版本，另外还有 PseudoEditor 本身的使用指南。",
        ],
      },
      {
        heading: "可以动手改的图示",
        body: [
          "课程用可以操作的图示来讲解：支持移位和补码的二进制与十六进制探索器、带实时连线和真值表的逻辑门与电路、取指-译码-执行步进演示、冒泡排序和线性查找动画、像素编辑器、声音采样器、奇偶校验和 ISBN 校验位模拟器，以及会高亮所选行和列的 SQL 查询。",
        ],
      },
      {
        heading: "边学边自测",
        body: [
          "每节课最后都有关键术语和可以显示答案的小测验。所有伪代码示例都能用剑桥 IGCSE 语法编译，你可以把它复制到编辑器里直接运行。",
        ],
      },
    ],
  },
  {
    slug: "flowchart-mode-out-of-beta",
    title: "流程图模式结束测试，正式上线",
    description: "任何程序都能画成流程图，在任一视图中编辑都不会丢掉一个字符，运行后还能看着它一个组件一个组件地执行。",
    date: "2026-10-31",
    readingTime: "5 分钟阅读",
    tags: ["流程图", "跟踪", "公告"],
    sections: [
      {
        heading: "不再需要测试开关",
        body: [
          "流程图模式以前藏在设置里的测试版开关后面。现在开关去掉了：在台式机和笔记本电脑上，流程图按钮一直在工具栏里。",
        ],
      },
      {
        heading: "整个程序都能画出来",
        body: [
          "REPEAT ... UNTIL、CASE、过程和函数以前只能保留为文字。现在 REPEAT 会变成一个在“否”时回到循环开头的判断，CASE 会变成一串判断框，OTHERWISE 在最后，每个 PROCEDURE 或 FUNCTION 都会在主流程图旁边单独画成一张流程图。",
          "五种考试语法都支持，包括 OCR 的 do ... until 和 switch，以及 IB 的 loop until。",
        ],
      },
      {
        heading: "在任一视图中编辑，代码不会坏",
        body: [
          "打开流程图永远不会改动你的代码。编辑流程图后，代码会保留你的关键字、注释、空行和缩进。新加的组件使用你所选考试局的关键字，重命名 FOR 计数变量会同时更新它的 NEXT，删除一个组件会把它前后的组件连起来。",
        ],
      },
      {
        heading: "看着程序运行",
        body: [
          "在流程图打开时点击“运行”，流程图会回放这次运行。程序执行到哪个组件，哪个组件就会亮起，经过的箭头会被突出显示，流程图上方的控制条会显示每个判断走了哪条分支，例如 Count >= 3 → No。",
          "你可以自动播放，也可以逐步查看，跟随 CALL 进入过程自己的流程图，出错的组件会以红色标出。文档中的“流程图模式”一课会逐一讲解每种形状。",
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
