import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FlowchartEditor from "@/app/components/flowchart/FlowchartEditor";
import { FLOWCHART_PALETTE_ITEMS, serializePaletteItem } from "@/app/components/flowchart/model";

// jsdom has no DOMMatrixReadOnly; React Flow only reads the zoom level from it.
if (typeof window.DOMMatrixReadOnly === "undefined") {
  Object.defineProperty(window, "DOMMatrixReadOnly", {
    configurable: true,
    value: class {
      m22 = 1;
    },
  });
}

describe("FlowchartEditor", () => {
  it("does not publish the hidden flowchart's code when only the exam syntax changes", () => {
    const onCodeChange = vi.fn();
    const source = 'DECLARE A : INTEGER\nOUTPUT "A"';
    const { container, rerender } = render(
      <FlowchartEditor source={source} syntaxId="cambridge-igcse" onCodeChange={onCodeChange} />,
    );

    const output = FLOWCHART_PALETTE_ITEMS.find((item) => item.id === "output");
    const canvas = container.querySelector(".react-flow");
    if (!output || !canvas) {
      throw new Error("Palette item or canvas not found.");
    }
    act(() => {
      fireEvent.drop(canvas, { dataTransfer: { getData: () => serializePaletteItem(output) } });
    });

    expect(onCodeChange).toHaveBeenCalledTimes(1);
    const published = onCodeChange.mock.calls[0][0] as string;
    expect(published).toBe(`${source}\nOUTPUT "Result"`);

    // The page feeds the published code back while the flowchart is visible, then hides it
    // when the user switches files; the hidden flowchart keeps that file's source.
    rerender(<FlowchartEditor source={published} syntaxId="cambridge-igcse" onCodeChange={onCodeChange} />);
    rerender(
      <FlowchartEditor source={published} isVisible={false} syntaxId="ocr-gcse" onCodeChange={onCodeChange} />,
    );

    expect(onCodeChange).toHaveBeenCalledTimes(1);
  });

  it("replays a run block by block and steps through it", () => {
    vi.useFakeTimers();
    const source = "DECLARE A : INTEGER\nA <- 1\nIF A > 0 THEN\n    OUTPUT \"yes\"\nENDIF";
    const runTrace = {
      id: 1,
      documentId: "doc",
      source,
      steps: [
        { line: 1, output: 0 },
        { line: 2, output: 0 },
        { line: 3, test: true, output: 0 },
        { line: 4, output: 0 },
      ],
      truncated: false,
      output: ["yes"],
      completed: true,
    };
    const { container } = render(<FlowchartEditor source={source} syntaxId="cambridge-igcse" runTrace={runTrace} />);

    // Start, the process block, the decision, the output, then End.
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    for (let step = 0; step < 2; step += 1) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
    }
    expect(screen.getByText("Step 3 of 5")).toBeTruthy();
    expect(screen.getByTestId("flowchart-run-description").textContent).toBe("A > 0 → Yes");
    expect(container.querySelector(".react-flow__node.flowchart-run-current")?.textContent).toContain("A > 0");

    fireEvent.click(screen.getByLabelText("Last step"));
    expect(screen.getByText("Step 5 of 5")).toBeTruthy();
    expect(screen.getByTestId("flowchart-run-output").textContent).toBe("yes");
    fireEvent.click(screen.getByLabelText("Previous step"));
    expect(screen.getByText("Step 4 of 5")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Close the run"));
    expect(screen.queryByText(/^Step \d/)).toBeNull();
    vi.useRealTimers();
  });
});
