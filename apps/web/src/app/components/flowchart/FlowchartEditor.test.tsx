import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
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
});
