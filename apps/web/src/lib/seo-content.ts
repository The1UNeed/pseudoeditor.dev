import type { Locale } from "@/i18n/config";
import { faqZh, postsZh } from "./seo-content.zh";

export const siteUrl = "https://www.pseudoeditor.dev";

export const productName = "PseudoEditor";


export const authorName = "Alex Xin LIU";

export const githubUrl = "https://github.com/The1UNeed/pseudoeditor.dev";

/** Monitored mailbox for privacy, security, and legal requests. */
export const contactEmail = "privacy@pseudoeditor.dev";

export const securityEmail = "security@pseudoeditor.dev";

export const productSlogan = "Free and open-source pseudo code editor and compiler.";

export const productTagline =
  "A free and open-source pseudo code editor and compiler for writing, running, debugging, and learning structured pseudocode in the browser.";

export type SeoPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  tags: string[];
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};

export const posts: SeoPost[] = [
  {
    slug: "igcse-pseudocode-basics",
    title: "IGCSE pseudocode basics: a practical starting point",
    description:
      "A compact guide to declarations, assignment, input, output, and the habits that make pseudocode easier to trace.",
    date: "2026-05-04",
    readingTime: "5 min read",
    tags: ["IGCSE", "Pseudocode", "Basics"],
    sections: [
      {
        heading: "Start with explicit data",
        body: [
          "Good pseudocode is not just English with keywords. It names data clearly, declares the expected type, and makes each change visible.",
          "For beginners, the best habit is to write small programs that compile, run, and produce one obvious result.",
        ],
      },
      {
        heading: "Trace before you optimize",
        body: [
          "Before making a program shorter, trace each line with a few sample values. A clear trace table reveals missing initialization and off-by-one loop mistakes quickly.",
        ],
      },
    ],
  },
  {
    slug: "how-to-trace-pseudocode",
    title: "How to trace pseudocode without guessing",
    description:
      "Use a repeatable trace-table process to follow variables, branches, and loop updates.",
    date: "2026-05-04",
    readingTime: "6 min read",
    tags: ["Tracing", "Revision", "Debugging"],
    sections: [
      {
        heading: "Write the variables as columns",
        body: [
          "A trace table turns invisible program state into something you can inspect. Add one column for each variable that changes.",
          "Update the table only when an assignment, INPUT, or loop counter change happens.",
        ],
      },
      {
        heading: "Mark branch decisions",
        body: [
          "For IF and WHILE conditions, write true or false beside the condition. This prevents the most common mistake: running a block that the program would skip.",
        ],
      },
    ],
  },
  {
    slug: "choosing-the-right-loop",
    title: "Choosing between FOR, WHILE, and REPEAT UNTIL",
    description:
      "Learn a simple decision rule for picking the right pseudocode loop structure.",
    date: "2026-05-04",
    readingTime: "4 min read",
    tags: ["Loops", "Control flow", "Syntax"],
    sections: [
      {
        heading: "Known count means FOR",
        body: [
          "When you know exactly how many values, rows, or attempts you need to process, a FOR loop communicates that intent clearly.",
        ],
      },
      {
        heading: "Unknown count means condition loops",
        body: [
          "Use WHILE when the condition must be checked before the first run. Use REPEAT UNTIL when the prompt or action must happen at least once.",
        ],
      },
    ],
  },
  {
    slug: "common-pseudocode-compiler-errors",
    title: "Common pseudocode compiler errors and how to fix them",
    description:
      "Fix undeclared variables, missing block endings, invalid assignment, and type mismatches faster.",
    date: "2026-05-04",
    readingTime: "7 min read",
    tags: ["Compiler errors", "Diagnostics", "Practice"],
    sections: [
      {
        heading: "Undeclared names",
        body: [
          "If a variable is misspelled once, the compiler may treat it as a different undeclared name. Compare the diagnostic spelling with the declaration.",
        ],
      },
      {
        heading: "Block endings",
        body: [
          "Missing ENDIF, NEXT, ENDWHILE, or UNTIL changes the structure of every line that follows. Fix block structure before chasing later errors.",
        ],
      },
    ],
  },
  {
    slug: "why-use-a-browser-pseudocode-editor",
    title: "Why use a browser pseudocode editor?",
    description:
      "A browser-based compiler makes pseudocode practice faster because feedback, examples, and execution live in one place.",
    date: "2026-05-04",
    readingTime: "5 min read",
    tags: ["Browser editor", "Learning", "Tools"],
    sections: [
      {
        heading: "Feedback changes practice",
        body: [
          "When feedback is immediate, students can test smaller changes and understand the exact line that caused a problem.",
          "A browser editor also removes setup work: open the page, type, run, and revise.",
        ],
      },
      {
        heading: "Keep learning material nearby",
        body: [
          "Docs and examples should sit beside the editor so reference material supports practice instead of interrupting it.",
        ],
      },
    ],
  },
  {
    slug: "random-pseudocode-practice",
    title: "Why random questions beat a fixed worksheet",
    description:
      "A shuffled bank of original pseudocode tasks is closer to an unseen exam paper than repeating the same five examples.",
    date: "2026-09-19",
    readingTime: "4 min read",
    tags: ["Practice", "IGCSE", "Revision"],
    sections: [
      {
        heading: "Unseen is the point",
        body: [
          "Exam papers do not reuse last week's worksheet in the same order. Random practice forces you to choose a loop, a condition, or an array traversal from the problem text instead of from memory.",
        ],
      },
      {
        heading: "Keep the compiler in the loop",
        body: [
          "Write the answer in the editor, run it against the sample, then draw another question. The compiler catches missing ENDIF and undeclared names before you practise the same mistake on paper.",
        ],
      },
    ],
  },
  {
    slug: "free-forever-and-open-source",
    title: "PseudoEditor is open source, and free forever",
    description:
      "The code is on GitHub under the Apache License 2.0, and there is no paid plan coming later.",
    date: "2026-10-27",
    readingTime: "3 min read",
    tags: ["Open source", "Free", "Announcement"],
    sections: [
      {
        heading: "Free, with no catch",
        body: [
          "PseudoEditor has no paid plan, no trial, and no premium tier waiting down the road. The compiler, the runtime, flowchart mode, the docs, and the practice questions are all in the free version, because there is no other version.",
        ],
      },
      {
        heading: "The code is public",
        body: [
          "The source is on GitHub at github.com/The1UNeed/pseudoeditor.dev under the Apache License 2.0. You can read how the compiler checks your program, run your own copy, or send a fix.",
          "Apache 2.0 lets schools and other projects reuse the code in their own tools, as long as they keep the license and copyright notice with it.",
        ],
      },
      {
        heading: "Why it matters before an exam",
        body: [
          "A revision tool should not disappear behind a paywall the term before your exam. Because the code is open, anyone can keep PseudoEditor running, whatever happens to this site.",
        ],
      },
    ],
  },
  {
    slug: "exam-board-pseudocode-syntax",
    title: "Write pseudocode the way your exam board does",
    description:
      "Settings switches the compiler between Cambridge IGCSE, Cambridge A Level, IB, OCR, and AQA notation.",
    date: "2026-10-27",
    readingTime: "4 min read",
    tags: ["Exam boards", "Syntax", "Compiler"],
    sections: [
      {
        heading: "Exam boards don't agree on pseudocode",
        body: [
          "Cambridge declares variables with DECLARE and assigns with <-. IB uses lowercase keywords and =. OCR's exam reference language uses print, = and ==, much like Python. AQA closes its loops with ENDFOR and ENDWHILE. Practising in the wrong notation means unlearning it before the exam.",
        ],
      },
      {
        heading: "Pick yours in Settings",
        body: [
          "Open Settings and choose an exam syntax: Cambridge IGCSE (0478 and 0984), Cambridge AS and A Level (9618), IB Diploma Programme, OCR GCSE (J277), or AQA GCSE (8525).",
          "The compiler, syntax highlighting, and autocomplete all switch together, so the editor checks your program against the notation of the paper you will sit.",
        ],
      },
      {
        heading: "One loop, five ways",
        body: [
          "Adding up 1 to 5 is FOR Number <- 1 TO 5 ... NEXT Number in Cambridge, loop COUNT from 1 to 5 ... end loop in IB, for number = 1 to 5 ... next number in OCR, and FOR number ← 1 TO 5 ... ENDFOR in AQA. Each one compiles and runs in its own syntax.",
        ],
      },
    ],
  },
  {
    slug: "igcse-computer-science-course",
    title: "The docs are now a full IGCSE Computer Science course",
    description:
      "32 visual lessons follow the Cambridge 0478 syllabus across both papers, from binary to Boolean logic, with diagrams you can click.",
    date: "2026-10-31",
    readingTime: "4 min read",
    tags: ["IGCSE", "Course", "Revision"],
    sections: [
      {
        heading: "Both papers, in syllabus order",
        body: [
          "The docs used to cover pseudocode syntax only. They now follow the Cambridge IGCSE Computer Science (0478) syllabus topic by topic.",
          "Paper 1 covers data representation, data transmission, hardware, software, the internet, and emerging technologies. Paper 2 covers algorithm design, programming, databases, and Boolean logic. That is 32 lessons in English and Chinese, plus the guides to PseudoEditor itself.",
        ],
      },
      {
        heading: "Diagrams you can change",
        body: [
          "Lessons explain ideas with visuals you can use: a binary and hex explorer with shifts and two's complement, logic gates and circuits with live wires and truth tables, a fetch-decode-execute stepper, bubble sort and linear search animations, a pixel editor, a sound sampler, parity and ISBN check-digit simulators, and SQL queries that highlight the rows and columns they pick.",
        ],
      },
      {
        heading: "Check yourself as you go",
        body: [
          "Every lesson ends with key terms and quiz questions whose answers you can reveal. Every pseudocode example compiles with the Cambridge IGCSE syntax, so you can copy it into the editor and run it.",
        ],
      },
    ],
  },
  {
    slug: "flowchart-mode-out-of-beta",
    title: "Flowchart mode is out of beta",
    description:
      "Draw any program as a flowchart, edit it in either view, and watch a run move block by block.",
    date: "2026-10-31",
    readingTime: "5 min read",
    tags: ["Flowcharts", "Tracing", "Announcement"],
    sections: [
      {
        heading: "No more beta switch",
        body: [
          "Flowchart mode used to sit behind a beta switch in Settings. The switch is gone: the flowchart button is always in the toolbar on desktop and laptop screens.",
        ],
      },
      {
        heading: "The whole program is drawn",
        body: [
          "REPEAT ... UNTIL, CASE, procedures, and functions used to stay as plain text. Now REPEAT becomes a test that loops back on No, CASE becomes a chain of decisions with OTHERWISE last, and each PROCEDURE or FUNCTION gets a flowchart of its own beside the main one.",
          "This works in all five exam syntaxes, including OCR's do ... until and switch, and IB's loop until.",
        ],
      },
      {
        heading: "Edit either view without breaking the code",
        body: [
          "Opening the flowchart never changes your code. Edit the chart and the code keeps your keywords, comments, blank lines, and indentation. Blocks you add use your exam board's keywords, renaming a FOR counter updates its NEXT, and deleting a block other than a decision joins the blocks on either side.",
        ],
      },
      {
        heading: "Watch your program run",
        body: [
          "Press Run with the flowchart open and the chart replays the run. Each block lights up as the program reaches it, the arrow it took is highlighted, and the bar above the chart shows which way each decision went, such as Count >= 3 → No.",
          "Play the run or step through it, follow a CALL into the procedure's own chart, and see the block that failed outlined in red. The Flowchart mode lesson in the docs walks through every shape.",
        ],
      },
    ],
  },
];

export type FaqItem = { question: string; answer: string };

export const faqItems: FaqItem[] = [
  {
    question: "What is PseudoEditor?",
    answer:
      "PseudoEditor is a free and open-source pseudo code editor and compiler. The editor, compiler, runner, flowchart view, docs, and workspace tools all run in the browser app.",
  },
  {
    question: "Can I run pseudocode in the browser?",
    answer:
      "Yes. PseudoEditor compiles supported pseudocode to an AST and runs it in the browser runtime, including interactive INPUT prompts.",
  },
  {
    question: "What is a pseudocode compiler or pseudo emulator?",
    answer:
      "A pseudocode compiler checks a defined pseudocode syntax before execution. A pseudocode runner, sometimes called a pseudo emulator, executes those instructions so you can test an algorithm. PseudoEditor includes both, with error diagnostics, interactive input, and program output. Select your exam board in Settings because pseudocode has no single universal syntax.",
  },
  {
    question: "Do I need Visual Studio Code to run pseudocode?",
    answer:
      "No. PseudoEditor is a standalone browser app with its own pseudocode compiler and runtime. Open the editor, create a file, select your exam syntax, and choose Run. You do not need to install Visual Studio Code or an extension.",
  },
  {
    question: "Does the browser version save my work?",
    answer:
      "Local development saves to browser storage. On pseudoeditor.dev, signed-in users can save workspaces with Clerk authentication and Convex cloud sync.",
  },
  {
    question: "Is this only for IGCSE Computer Science?",
    answer:
      "No. Settings lets you switch between Cambridge IGCSE, Cambridge AS and A Level, IB Diploma Programme, OCR GCSE, and AQA GCSE notation. The compiler, highlighter, and completions follow the syntax you pick.",
  },
  {
    question: "Which exam boards does the pseudocode follow?",
    answer:
      "The syntax follows the Cambridge International pseudocode guide used in IGCSE Computer Science (0478 and 0984), O Level Computer Science (2210), and AS and A Level Computer Science (9618). PseudoEditor is an independent project and is not affiliated with or endorsed by Cambridge.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. The editor, compiler, and runtime load in any modern browser on a laptop, Chromebook, or tablet. Nothing is installed and nothing needs to be approved by school IT.",
  },
  {
    question: "Is PseudoEditor really free? Will it stay free?",
    answer:
      "Yes, and it always will be. There is no paid plan, no trial, and no premium tier waiting down the road. PseudoEditor is also open source: the code is published under the Apache License 2.0 on GitHub, so you can read it, run it yourself, and contribute.",
  },
  {
    question: "Can I practise random exam-style questions?",
    answer:
      "Yes. The practice page draws an original IGCSE, O Level, or A Level style task at random. You can filter by topic, open a starter file in the editor, and run your answer in the browser.",
  },
];

const postsByLocale: Record<Locale, SeoPost[]> = { en: posts, zh: postsZh };
const faqByLocale: Record<Locale, FaqItem[]> = { en: faqItems, zh: faqZh };

/** Newest first; posts from the same day keep the newest-added one on top. */
export function getPosts(locale: Locale): SeoPost[] {
  return [...postsByLocale[locale]].reverse().sort((a, b) => b.date.localeCompare(a.date));
}

export function getFaq(locale: Locale): FaqItem[] {
  return faqByLocale[locale];
}

export function getPost(locale: Locale, slug: string) {
  return getPosts(locale).find((post) => post.slug === slug);
}
