import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getLessonCatalog } from "@/lib/lesson-syllabi";
import { SyllabusCatalog } from "./SyllabusCatalog";

afterEach(cleanup);

describe("syllabus selection", () => {
  it("switches the reference download and relevant lessons for all five syllabi", () => {
    const courses = getLessonCatalog("en");
    render(<SyllabusCatalog locale="en" courses={courses} />);
    expect(screen.getByRole("heading", { name: "Computer systems" })).toBeInTheDocument();

    for (const course of courses) {
      fireEvent.click(screen.getByRole("radio", { name: course.title }));
      expect(screen.getByRole("radio", { name: course.title })).toBeChecked();
      expect(screen.getByRole("heading", { name: course.title })).toBeInTheDocument();
      const download = screen.getByRole("link", { name: /Download.*PDF/ });
      expect(download).toHaveAttribute("href", course.file);
      expect(download).toHaveAttribute("download");
      expect(screen.getByRole("link", { name: "Official source" })).toHaveAttribute("href", course.source);
    }

    fireEvent.click(screen.getByRole("radio", { name: "AP Computer Science A" }));
    expect(screen.getByRole("link", { name: /Iteration with FOR/ })).toHaveAttribute("href", "/lessons/loops");
    expect(screen.queryByRole("link", { name: /File handling/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Paper 1/)).not.toBeInTheDocument();
    expect(screen.getByText(/requires Java/)).toBeInTheDocument();
  });

  it("keeps Chinese lesson links localized and labels the IB brief accurately", () => {
    render(<SyllabusCatalog locale="zh" courses={getLessonCatalog("zh")} />);
    fireEvent.click(screen.getByRole("radio", { name: "IB Computer Science HL and SL" }));
    expect(screen.getByRole("link", { name: /下载学科简介/ })).toHaveAttribute("href", "/syllabi/ib-computer-science-hl-sl-2027-subject-brief.pdf");
    expect(screen.getByRole("link", { name: /用 FOR、WHILE 和 REPEAT/ })).toHaveAttribute("href", "/zh/lessons/loops");
    expect(screen.getByText(/HL 的抽象数据类型/)).toBeInTheDocument();
  });
});
