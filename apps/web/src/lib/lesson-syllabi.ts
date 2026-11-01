import type { Locale } from "@/i18n/config";
import { getLessons, getUnits } from "./docs";

const programming = ["variables-input-output", "selection", "loops", "operators-and-strings", "procedures-and-functions", "arrays"];
const algorithms = ["program-development-life-cycle", "flowcharts", "standard-algorithms", "testing-and-trace-tables"];

// Shared lessons are introductions, not a claim of complete AP or IB coverage.
export const syllabusReferences = [
  {
    id: "igcse",
    title: "IGCSE Computer Science",
    publisher: "Cambridge International",
    edition: { en: "0478 · Exams 2026–2028", zh: "0478 · 2026–2028 年考试" },
    document: "syllabus",
    file: "/syllabi/cambridge-igcse-computer-science-0478-2026-2028.pdf",
    source: "https://www.cambridgeinternational.org/Images/697167-2026-2028-syllabus.pdf",
    note: {
      en: "Follow the Cambridge 0478 course in syllabus order, across both papers. Examples use Cambridge IGCSE pseudocode.",
      zh: "按剑桥 0478 考纲顺序学习两张试卷的课程。示例使用剑桥 IGCSE 伪代码。",
    },
    slugs: null,
  },
  {
    id: "ap-csp",
    title: "AP Computer Science Principles",
    publisher: "College Board",
    edition: { en: "Effective fall 2023", zh: "2023 年秋季起适用" },
    document: "course-and-exam-description",
    file: "/syllabi/ap-computer-science-principles-2023.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf",
    note: {
      en: "Start with data, algorithms, programming, and networks. Examples use Cambridge pseudocode; AP reference notation, the Create performance task, and the full impact-of-computing requirements need additional study.",
      zh: "从数据、算法、编程和网络基础开始。示例使用剑桥伪代码；AP 参考记法、Create 表现任务以及计算影响的完整要求仍需另行学习。",
    },
    slugs: ["number-systems", "text-sound-images", "data-storage-compression", "data-transmission", "network-hardware", "internet-and-web", "cyber-security", ...algorithms, ...programming],
  },
  {
    id: "ap-cybersecurity",
    title: "AP Cybersecurity",
    publisher: "College Board",
    edition: { en: "Effective fall 2026", zh: "2026 年秋季起适用" },
    document: "course-and-exam-description",
    file: "/syllabi/ap-cybersecurity-2026.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-cybersecurity-course-and-exam-description.pdf",
    note: {
      en: "Review encryption, networks, operating systems, and common threats. This is a foundation path; security labs, risk analysis, and the course-specific projects need additional study.",
      zh: "复习加密、网络、操作系统和常见威胁。这是基础学习路径；安全实验、风险分析和本课程的专项项目仍需另行学习。",
    },
    slugs: ["encryption", "network-hardware", "internet-and-web", "cyber-security", "operating-systems"],
  },
  {
    id: "ap-csa",
    title: "AP Computer Science A",
    publisher: "College Board",
    edition: { en: "Effective fall 2025", zh: "2025 年秋季起适用" },
    document: "course-and-exam-description",
    file: "/syllabi/ap-computer-science-a-2025.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-a-course-and-exam-description.pdf",
    note: {
      en: "Practise control flow, arrays, methods, searching, and sorting in Cambridge pseudocode. AP Computer Science A requires Java; Java syntax, classes, objects, and ArrayList need additional study. The editor runs pseudocode.",
      zh: "用剑桥伪代码练习控制流、数组、方法、搜索和排序。AP 计算机科学 A 要求使用 Java；Java 语法、类、对象和 ArrayList 仍需另行学习。编辑器运行的是伪代码。",
    },
    slugs: [...programming, "standard-algorithms", "testing-and-trace-tables"],
  },
  {
    id: "ib",
    title: "IB Computer Science HL and SL",
    publisher: "International Baccalaureate",
    edition: { en: "First assessment 2027 · HL and SL", zh: "2027 年首次评估 · HL 和 SL" },
    document: "subject-brief",
    file: "/syllabi/ib-computer-science-hl-sl-2027-subject-brief.pdf",
    source: "https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp_comp_sci_subjectbrief_en.pdf",
    note: {
      en: "Review shared foundations for HL and SL. Examples use Cambridge pseudocode; Java or Python, object-oriented programming, deeper machine learning, the case study, and the internal assessment need additional study, as do HL abstract data types. The attachment is the public subject brief; the full guide is available through your school or the IB store.",
      zh: "复习 HL 和 SL 的共同基础。示例使用剑桥伪代码；Java 或 Python、面向对象编程、深入机器学习、案例研究、内部评估以及 HL 的抽象数据类型仍需另行学习。附件为公开学科简介；完整指南可通过学校或 IB 商店获取。",
    },
    slugs: ["number-systems", "binary-arithmetic", "text-sound-images", "data-storage-compression", "cpu-and-fde-cycle", "storage", "network-hardware", "operating-systems", "data-transmission", "encryption", "cyber-security", "databases-and-sql", "artificial-intelligence", "logic-gates", "logic-circuits", ...algorithms, "validation-and-verification", ...programming, "file-handling"],
  },
] as const;

export function getLessonCatalog(locale: Locale) {
  const lessons = getLessons(locale);
  return syllabusReferences.map((syllabus) => {
    const selectedLessons = syllabus.slugs === null
      ? lessons
      : lessons.filter((doc) => (syllabus.slugs as readonly string[]).includes(doc.slug));
    return {
      id: syllabus.id,
      title: syllabus.title,
      publisher: syllabus.publisher,
      edition: syllabus.edition[locale],
      document: syllabus.document,
      file: syllabus.file,
      source: syllabus.source,
      note: syllabus.note[locale],
      units: getUnits(locale).flatMap((unit) => {
        const docs = selectedLessons.filter((doc) => doc.unit === unit.id);
        return docs.length ? [{ ...unit, lessons: docs.map(({ slug, title }) => ({ slug, title })) }] : [];
      }),
    };
  });
}

export type LessonCourse = ReturnType<typeof getLessonCatalog>[number];
