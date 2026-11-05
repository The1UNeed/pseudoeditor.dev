import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SyntaxColorSchemePicker } from "@/app/components/SyntaxColorSchemePicker";
import { SYNTAX_COLOR_SCHEMES, type SyntaxColorSchemeId } from "@/lib/syntaxColorSchemes";

const NAMES = Object.fromEntries(SYNTAX_COLOR_SCHEMES.map((scheme) => [scheme.id, scheme.id])) as Record<
  SyntaxColorSchemeId,
  string
>;

function TwoPickers() {
  const [value, setValue] = useState<SyntaxColorSchemeId>("classic");
  return (
    <>
      <SyntaxColorSchemePicker value={value} theme="light" label="Phone settings" names={NAMES} onChange={setValue} />
      <SyntaxColorSchemePicker value={value} theme="light" label="Account appearance" names={NAMES} onChange={setValue} />
    </>
  );
}

function checkedIn(label: string) {
  return within(screen.getByRole("radiogroup", { name: label }))
    .getAllByRole("radio")
    .filter((radio) => (radio as HTMLInputElement).checked)
    .map((radio) => (radio as HTMLInputElement).value);
}

describe("SyntaxColorSchemePicker", () => {
  afterEach(() => cleanup());

  it("keeps every mounted picker showing the chosen scheme", () => {
    render(<TwoPickers />);

    fireEvent.click(within(screen.getByRole("radiogroup", { name: "Account appearance" })).getByRole("radio", { name: "forest" }));

    expect(checkedIn("Phone settings")).toEqual(["forest"]);
    expect(checkedIn("Account appearance")).toEqual(["forest"]);
  });
});
