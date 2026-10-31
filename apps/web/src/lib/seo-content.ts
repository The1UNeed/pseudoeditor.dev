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
          "Docs, examples, and the manual should sit beside the editor so reference material supports practice instead of interrupting it.",
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
];

export type FaqItem = { question: string; answer: string };

export const faqItems: FaqItem[] = [
  {
    question: "What is PseudoEditor?",
    answer:
      "PseudoEditor is a free and open-source pseudo code editor and compiler. The editor, compiler, runner, flowchart view, manual, and workspace tools all run in the browser app.",
  },
  {
    question: "Can I run pseudocode in the browser?",
    answer:
      "Yes. PseudoEditor compiles supported pseudocode to an AST and runs it in the browser runtime, including interactive INPUT prompts.",
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

export function getPosts(locale: Locale): SeoPost[] {
  return postsByLocale[locale];
}

export function getFaq(locale: Locale): FaqItem[] {
  return faqByLocale[locale];
}

export function getPost(locale: Locale, slug: string) {
  return getPosts(locale).find((post) => post.slug === slug);
}
