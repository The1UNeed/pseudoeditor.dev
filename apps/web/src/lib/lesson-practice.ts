import type { PracticeTopic } from "./practice-questions";

/** The course lesson that teaches each skill in the practice bank. */
export const practiceLessonSlugs: Record<PracticeTopic, string> = {
  io: "variables-input-output",
  selection: "selection",
  loops: "loops",
  arrays: "arrays",
  strings: "operators-and-strings",
  procedures: "procedures-and-functions",
};

export function getLessonPracticeTopics(slug: string): PracticeTopic[] {
  return (Object.keys(practiceLessonSlugs) as PracticeTopic[]).filter(
    (topic) => practiceLessonSlugs[topic] === slug,
  );
}
