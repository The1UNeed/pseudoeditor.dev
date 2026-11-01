import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPracticeQuestions } from "@/lib/practice-questions";
import { PracticeCatalog } from "./PracticeCatalog";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { cleanup(); push.mockReset(); });

describe("practice skills", () => {
  it("starts with the lesson's skill and uses it for random questions", () => {
    render(<PracticeCatalog locale="en" questions={getPracticeQuestions("en")} initialTopic="selection" />);
    expect(screen.getByRole("button", { name: "Selection" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Pass or fail from a mark" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Greet the user by name" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Practice a random question" }));
    expect(push.mock.calls[0]?.[0]).toMatch(/^\/practice\/(pass-or-fail|letter-grade)$/);
  });

  it("filters the question list when the user changes skills", () => {
    render(<PracticeCatalog locale="en" questions={getPracticeQuestions("en")} initialTopic="any" />);
    fireEvent.click(screen.getByRole("button", { name: "Input and output" }));
    expect(screen.getByRole("heading", { name: "Greet the user by name" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pass or fail from a mark" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Any topic" }));
    expect(screen.getByRole("heading", { name: "Pass or fail from a mark" })).toBeInTheDocument();
  });
});
