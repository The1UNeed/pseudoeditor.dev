import { describe, expect, it } from "vitest";
import { compilePseudocode, SYNTAX_OPTIONS } from "./index";

describe("compilePseudocode", () => {
  it("compiles valid IGCSE pseudocode into AST JSON", () => {
    const source = `DECLARE Total : INTEGER
DECLARE Index : INTEGER
FOR Index <- 1 TO 3
    Total <- Total + Index
NEXT Index
OUTPUT Total`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(true);
    expect(result.astJson).toContain('"kind":"for"');
    expect(result.astJson).toContain('"kind":"output"');
  });

  it("keeps parsing OUTPUT values after a parenthesized first value", () => {
    const cambridge = compilePseudocode({ source: "OUTPUT (1 + 2), 3", filename: "main.pseudo", strict: true });
    expect(cambridge.success).toBe(true);
    expect(JSON.parse(cambridge.astJson ?? "{}").body[0].values).toHaveLength(2);

    const ocr = compilePseudocode({ source: 'print("Total")', filename: "main.pseudo", strict: true, syntaxId: "ocr-gcse" });
    expect(ocr.diagnostics).toEqual([]);
  });

  it("returns syntax diagnostics for malformed IF blocks", () => {
    const source = `DECLARE Score : INTEGER
IF Score > 10 THEN
    OUTPUT \"High\"`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "SYN018")).toBe(true);
  });

  it("returns semantic diagnostics for undeclared identifiers", () => {
    const source = `Value <- 7`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "SEM019")).toBe(true);
  });

  it("returns semantic diagnostics for array index dimension mismatch", () => {
    const source = `DECLARE Grid : ARRAY[1:3, 1:3] OF INTEGER
DECLARE Value : INTEGER
Value <- Grid[1]`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "SEM027")).toBe(true);
  });

  it("returns semantic diagnostics for READFILE on WRITE mode", () => {
    const source = `DECLARE Line : STRING
OPENFILE \"FileA.txt\" FOR WRITE
READFILE \"FileA.txt\", Line`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "SEM015")).toBe(true);
  });

  it("compiles ELSE IF chains that share one ENDIF", () => {
    const source = `DECLARE Score : INTEGER
IF Score > 10 THEN
    OUTPUT "High"
ELSE IF Score > 5 THEN
    OUTPUT "Mid"
ELSE
    OUTPUT "Low"
ENDIF`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });
    expect(result.success).toBe(true);
  });

  it("compiles Cambridge A Level concatenation, RAND, and APPEND", () => {
    const source = `DECLARE Label : STRING
DECLARE Sample : INTEGER
Label <- "N=" & 3
Sample <- RAND(10)
OPENFILE "log.txt" FOR APPEND
WRITEFILE "log.txt", Label
CLOSEFILE "log.txt"
OUTPUT Label`;

    const result = compilePseudocode({
      source,
      filename: "main.pseudo",
      strict: true,
      syntaxId: "cambridge-alevel",
    });
    expect(result.success).toBe(true);
  });

  it("compiles IB Diploma Programme loop and assignment syntax", () => {
    const source = `N = 0
loop COUNT from 1 to 5
    N = N + COUNT
end loop
if N = 15 then
    output "ok"
else
    output "no"
end if`;

    const result = compilePseudocode({
      source,
      filename: "main.pseudo",
      strict: true,
      syntaxId: "ib-dp",
    });
    expect(result.success).toBe(true);
  });

  it("compiles OCR exam reference language", () => {
    const source = `total = 0
for number = 1 to 5
    total = total + number
next number
if total == 15 then
    print("ok")
else
    print("no")
endif`;

    const result = compilePseudocode({
      source,
      filename: "main.pseudo",
      strict: true,
      syntaxId: "ocr-gcse",
    });
    expect(result.success).toBe(true);
  });

  it("compiles AQA GCSE pseudo-code", () => {
    const source = `total ← 0
FOR number ← 1 TO 5
    total ← total + number
ENDFOR
IF total = 15 THEN
    OUTPUT "ok"
ELSE
    OUTPUT "no"
ENDIF`;

    const result = compilePseudocode({
      source,
      filename: "main.pseudo",
      strict: true,
      syntaxId: "aqa-gcse",
    });
    expect(result.success).toBe(true);
  });

  it("exposes every supported exam syntax", () => {
    expect(SYNTAX_OPTIONS.map((option) => option.id)).toEqual([
      "cambridge-igcse",
      "cambridge-alevel",
      "ib-dp",
      "ocr-gcse",
      "aqa-gcse",
    ]);
  });
  it("isolates file modes changed or closed inside branches", () => {
    const result = compilePseudocode({
      source: `DECLARE Line : STRING
OPENFILE "data.txt" FOR WRITE
IF TRUE THEN
    CLOSEFILE "data.txt"
    READFILE "data.txt", Line
    OPENFILE "data.txt" FOR READ
    IF TRUE THEN
        WRITEFILE "data.txt", "wrong mode"
    ENDIF
ELSE
    READFILE "data.txt", Line
ENDIF
WRITEFILE "data.txt", "parent still writable"
READFILE "data.txt", Line`,
      filename: "files.pseudo",
      strict: true,
    });
    expect(result.diagnostics.map(({ code, line }) => ({ code, line }))).toEqual([
      { code: "SEM016", line: 8 },
      { code: "SEM015", line: 11 },
      { code: "SEM015", line: 14 },
    ]);
  });

  it("reports SYN099 for thousands of consecutive unary MINUS tokens instead of a RangeError", () => {
    const source = `DECLARE Value : INTEGER\nValue <- ${"-".repeat(5000)}1`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "SYN099")).toBe(true);
  });

  it("rejects valid CJK sources whose UTF-8 size exceeds the cap even when .length is under it", () => {
    // Each CJK character is 3 UTF-8 bytes but 1 UTF-16 code unit, so ~90,000
    // characters stay under the 262,144-unit .length while passing 256 KB encoded.
    // The source must stay semantically valid: on the old .length check this
    // program compiled successfully, which was the actual bypass.
    const oversized = `OUTPUT 1\n// ${"汉".repeat(90_000)}`;
    const result = compilePseudocode({ source: oversized, filename: "main.pseudo", strict: true });

    expect(result.success).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "CMP413")).toBe(true);
  });

  it("still compiles ASCII sources up to the cap", () => {
    const source = `DECLARE Value : INTEGER\nValue <- 1\nOUTPUT "${"a".repeat(256 * 1024 - 60)}"`;

    const result = compilePseudocode({ source, filename: "main.pseudo", strict: true });

    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "CMP413")).toBe(false);
  });
});
