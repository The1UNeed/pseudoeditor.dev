import type { Locale } from "@/i18n/config";
import { getLessons, getUnit, getUnits } from "./docs";
import { aLevel } from "./course-lessons/a-level";
import { apCsa } from "./course-lessons/ap-csa";
import { apCsp } from "./course-lessons/ap-csp";
import { apCybersecurity } from "./course-lessons/ap-cybersecurity";
import { ibCore, ibHl } from "./course-lessons/ib";
import { localizeLessons, type CourseLesson, type Text } from "./course-lessons/types";

export const syllabusReferences = [
  {
    id: "igcse", title: "IGCSE Computer Science", publisher: "Cambridge International",
    edition: { en: "0478 · Exams 2026–2028", zh: "0478 · 2026–2028 年考试" }, document: "syllabus",
    file: "/syllabi/cambridge-igcse-computer-science-0478-2026-2028.pdf",
    source: "https://www.cambridgeinternational.org/Images/697167-2026-2028-syllabus.pdf",
  },
  {
    id: "o-level", title: "O Level Computer Science", publisher: "Cambridge International",
    edition: { en: "2210 · Exams 2026–2028", zh: "2210 · 2026–2028 年考试" }, document: "syllabus",
    file: "https://www.cambridgeinternational.org/Images/697287-2026-2028-syllabus.pdf",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-computer-science-2210/",
  },
  {
    id: "as-a-level", title: "AS & A Level Computer Science", publisher: "Cambridge International",
    edition: { en: "9618 · Exams 2027–2029", zh: "9618 · 2027–2029 年考试" }, document: "syllabus",
    file: "https://www.cambridgeinternational.org/Images/721397-2027-2029-syllabus.pdf",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-computer-science-9618/",
  },
  {
    id: "ap-csp", title: "AP Computer Science Principles", publisher: "College Board",
    edition: { en: "Effective fall 2023", zh: "2023 年秋季起适用" }, document: "course-and-exam-description",
    file: "/syllabi/ap-computer-science-principles-2023.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf",
  },
  {
    id: "ap-cybersecurity", title: "AP Cybersecurity", publisher: "College Board",
    edition: { en: "Effective fall 2026", zh: "2026 年秋季起适用" }, document: "course-and-exam-description",
    file: "/syllabi/ap-cybersecurity-2026.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-cybersecurity-course-and-exam-description.pdf",
  },
  {
    id: "ap-csa", title: "AP Computer Science A", publisher: "College Board",
    edition: { en: "Effective fall 2025", zh: "2025 年秋季起适用" }, document: "course-and-exam-description",
    file: "/syllabi/ap-computer-science-a-2025.pdf",
    source: "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-a-course-and-exam-description.pdf",
  },
  {
    id: "ib", title: "IB Computer Science", publisher: "International Baccalaureate",
    edition: { en: "First assessment 2027", zh: "2027 年首次评估" }, document: "subject-brief",
    file: "/syllabi/ib-computer-science-hl-sl-2027-subject-brief.pdf",
    source: "https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp_comp_sci_subjectbrief_en.pdf",
  },
] as const;

const courses = [
  { id: "igcse", reference: "igcse", title: "IGCSE Computer Science (0478)", note: ["Study computer systems, algorithms, programming, databases, and logic across both papers.", "学习两张试卷中的计算机系统、算法、编程、数据库与逻辑。"], language: ["Examples use Cambridge IGCSE pseudocode.", "示例使用剑桥 IGCSE 伪代码。"] },
  { id: "o-level", reference: "o-level", title: "O Level Computer Science (2210)", note: ["Study the ten 2210 topics with worked examples, diagrams, and checks. Concepts shared with 0478 use the same teaching material in this O Level path.", "通过示例、图解和自我检测学习 2210 的十个主题。本 O Level 路径复用与 0478 共同概念的教学内容。"], language: ["Examples use Cambridge pseudocode for the 2026–2028 syllabus.", "示例使用 2026–2028 考纲中的剑桥伪代码。"] },
  { id: "as-a-level", reference: "as-a-level", title: "AS & A Level Computer Science (9618)", note: ["Begin with AS theory and program design, then study A Level representation, systems, AI, algorithms, and further programming.", "从 AS 理论与程序设计开始，再学习 A Level 的数据表示、系统、AI、算法和进阶编程。"], language: ["Lessons distinguish AS topics 1–12 from A Level topics 13–20. Examples include Cambridge pseudocode and Python.", "课程区分 AS 主题 1–12 与 A Level 主题 13–20。示例包括剑桥伪代码与 Python。"] },
  { id: "ap-csp", reference: "ap-csp", title: "AP Computer Science Principles", note: ["Learn the five big ideas through program design, data, AP algorithms, networks, and the effects of computing.", "通过程序设计、数据、AP 算法、网络与计算影响学习五个大概念。"], language: ["Algorithm examples use AP reference notation, including one-based list indices.", "算法示例使用 AP 参考记法，列表索引从 1 开始。"] },
  { id: "ap-cybersecurity", reference: "ap-cybersecurity", title: "AP Cybersecurity", note: ["Learn to analyze risks, choose controls, and investigate evidence across the course's five security units.", "在五个安全单元中学习分析风险、选择控制措施和调查证据。"], language: ["Work through defensive scenarios and explain the evidence behind each decision.", "通过防御情境练习，并解释每项决定背后的证据。"] },
  { id: "ap-csa", reference: "ap-csa", title: "AP Computer Science A", note: ["Study Java objects and methods, control flow, class design, collections, and recursive algorithms.", "学习 Java 对象与方法、控制流、类设计、集合与递归算法。"], language: ["Examples use Java. Read and trace them here; run them in a Java environment. The studio executes pseudocode.", "示例使用 Java。可在这里阅读和追踪，在 Java 环境中运行；工作室执行的是伪代码。"] },
  { id: "ib-hl", reference: "ib", title: "IB Computer Science HL", note: ["Study both IB themes, then extend them with abstract data types, linked structures, and HL design and analysis.", "学习 IB 的两个主题，再扩展到抽象数据类型、链式结构以及 HL 设计与分析。"], language: ["Examples use Python. HL includes additional lessons beyond the SL path.", "示例使用 Python。HL 路径包含 SL 之外的额外课程。"] },
  { id: "ib-sl", reference: "ib", title: "IB Computer Science SL", note: ["Study computer fundamentals, networks, databases, machine learning, computational thinking, programming, and OOP.", "学习计算机基础、网络、数据库、机器学习、计算思维、编程与面向对象编程。"], language: ["Examples use Python. The current IB course also permits Java.", "示例使用 Python，当前 IB 课程也允许使用 Java。"] },
] as const satisfies ReadonlyArray<{ id: string; reference: string; title: string; note: Text; language: Text }>;

export type CourseId = typeof courses[number]["id"];
export function isCourseId(value: string): value is CourseId {
  return courses.some((course) => course.id === value);
}

export function courseLessonPath(course: CourseId, slug: string): string {
  return course === "igcse" ? `/lessons/${slug}` : `/lessons/${course}/${slug}`;
}

export function getCourseLessons(locale: Locale, course: CourseId): CourseLesson[] {
  if (course === "igcse" || course === "o-level") {
    return getLessons(locale).map((doc) => ({ ...doc, group: getUnit(locale, doc.unit).title }));
  }
  const content = { "as-a-level": aLevel, "ap-csp": apCsp, "ap-cybersecurity": apCybersecurity, "ap-csa": apCsa, "ib-sl": ibCore, "ib-hl": [...ibCore, ...ibHl] };
  return localizeLessons(content[course], locale);
}

export function getLessonCatalog(locale: Locale) {
  const text = (value: Text) => value[locale === "en" ? 0 : 1];
  return courses.map((course) => {
    const reference = syllabusReferences.find((item) => item.id === course.reference)!;
    const lessons = getCourseLessons(locale, course.id);
    const groups = [...new Set(lessons.map((item) => item.group))];
    return {
      ...reference, id: course.id, title: course.title, edition: reference.edition[locale], note: text(course.note), language: text(course.language),
      units: groups.map((title, index) => ({
        id: `${course.id}-${index + 1}`, title,
        paper: course.id === "igcse" || course.id === "o-level" ? getUnits(locale).find((unit) => unit.title === title)?.paper ?? null : null,
        lessons: lessons.filter((item) => item.group === title).map(({ slug, title }) => ({ slug, title, href: courseLessonPath(course.id, slug) })),
      })),
    };
  });
}

export type LessonCourse = ReturnType<typeof getLessonCatalog>[number];
export function getLessonCourse(locale: Locale, id: CourseId): LessonCourse {
  return getLessonCatalog(locale).find((course) => course.id === id)!;
}
