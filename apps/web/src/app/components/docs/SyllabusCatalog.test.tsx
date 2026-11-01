import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getCourseLessons, getLessonCatalog, getLessonCourse } from "@/lib/lesson-syllabi";
import { LocaleProvider } from "@/i18n/context";
import { SyllabusCatalog } from "./SyllabusCatalog";
import { CourseArticle } from "./CourseArticle";

afterEach(cleanup);

describe("course selection", () => {
  it.each(getLessonCatalog("en"))("puts $title lessons before the source PDFs", (course) => {
    render(<SyllabusCatalog locale="en" courses={getLessonCatalog("en")} />);
    const choice = screen.getByRole("radio", { name: course.title });
    fireEvent.click(choice);
    expect(choice).toBeChecked();
    expect(screen.getByRole("heading", { name: course.title })).toBeInTheDocument();
    const firstLesson = course.units[0].lessons[0];
    const lessonLink = screen.getByRole("link", { name: new RegExp(firstLesson.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    expect(lessonLink).toHaveAttribute("href", firstLesson.href);
    const reference = screen.getByRole("heading", { name: "References used to build these lessons" });
    expect(lessonLink.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: /PDF/ })).toHaveAttribute("href", course.file);
    expect(screen.getByRole("link", { name: "Official source" })).toHaveAttribute("href", course.source);
  });

  it("returns to the selected course and keeps Chinese links localized", () => {
    render(<SyllabusCatalog locale="zh" courses={getLessonCatalog("zh")} initialCourse="ib-sl" />);
    expect(screen.getByRole("radio", { name: "IB Computer Science SL" })).toBeChecked();
    expect(screen.getByRole("link", { name: /编写并测试 Python 程序/ })).toHaveAttribute("href", "/zh/lessons/ib-sl/programming");
    expect(screen.getByRole("link", { name: /下载学科简介/ })).toHaveAttribute("href", "/syllabi/ib-computer-science-hl-sl-2027-subject-brief.pdf");
    expect(screen.queryByRole("link", { name: /实现栈与队列/ })).not.toBeInTheDocument();
  });

  it("puts references after teaching content and self checks on a lesson page", () => {
    const course = getLessonCourse("en", "ap-csa");
    render(<LocaleProvider locale="en"><CourseArticle locale="en" course={course} lesson={getCourseLessons("en", "ap-csa")[0]} /></LocaleProvider>);
    const check = screen.getByRole("heading", { name: "Check yourself" });
    const references = screen.getByRole("heading", { name: "References used to build these lessons" });
    expect(check.compareDocumentPosition(references) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/public class Demo/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Try it in the editor" })).not.toBeInTheDocument();
  });
});
