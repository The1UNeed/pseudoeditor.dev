import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/context";
import { getDictionary } from "@/i18n/messages";
import { SortStepper } from "./AlgorithmSteppers";

afterEach(cleanup);

describe("sorting completion feedback", () => {
  it.each(["en", "zh"] as const)("explains completion after a final swapping pass in %s", (locale) => {
    const { container } = render(<LocaleProvider locale={locale}><SortStepper values={[7, 2, 5, 1]} /></LocaleProvider>);
    const next = screen.getByRole("button", { name: getDictionary(locale).docs.visual.next });
    const notes: string[] = [];
    for (let step = 0; step < 20 && !next.hasAttribute("disabled"); step++) {
      fireEvent.click(next);
      notes.push(container.querySelector('[aria-live="polite"]')!.textContent!);
    }
    expect(next).toBeDisabled();
    expect(notes.at(-2)).toBe(locale === "en" ? "2 > 1, so swap them." : "2 > 1，交换它们。");
    expect(notes.at(-1)).toBe(locale === "en" ? "Sorting completed after pass 3." : "第 3 轮后排序完成。");
  });
});
