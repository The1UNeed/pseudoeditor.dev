import { describe, expect, it } from "vitest";
import { tokenize } from "./tokenizer";

describe("tokenize", () => {
  it("preserves sliced lexemes and positions across literals and identifiers", () => {
    const { tokens, diagnostics } = tokenize('Name12 <- 12.34\nOUTPUT "two words", ꞌéꞌ');
    expect(diagnostics).toEqual([]);
    expect(tokens.map(({ type, lexeme, span }) => [type, lexeme, span])).toEqual([
      ["IDENTIFIER", "Name12", { startLine: 1, startColumn: 1, endLine: 1, endColumn: 6 }],
      ["ASSIGN", "<-", { startLine: 1, startColumn: 8, endLine: 1, endColumn: 9 }],
      ["REAL_LITERAL", "12.34", { startLine: 1, startColumn: 11, endLine: 1, endColumn: 15 }],
      ["NEWLINE", "\\n", { startLine: 1, startColumn: 16, endLine: 1, endColumn: 16 }],
      ["KEYWORD", "OUTPUT", { startLine: 2, startColumn: 1, endLine: 2, endColumn: 6 }],
      ["STRING_LITERAL", '"two words"', { startLine: 2, startColumn: 8, endLine: 2, endColumn: 18 }],
      ["COMMA", ",", { startLine: 2, startColumn: 19, endLine: 2, endColumn: 19 }],
      ["CHAR_LITERAL", "ꞌéꞌ", { startLine: 2, startColumn: 21, endLine: 2, endColumn: 23 }],
      ["EOF", "", { startLine: 2, startColumn: 24, endLine: 2, endColumn: 24 }],
    ]);
  });

  it("preserves unterminated literal diagnostics and recovers on the next line", () => {
    const { tokens, diagnostics } = tokenize('"open\n\'open\nOUTPUT 1');
    expect(diagnostics.map(({ code, line, column, endColumn }) => ({ code, line, column, endColumn }))).toEqual([
      { code: "SYN008", line: 1, column: 1, endColumn: 6 },
      { code: "SYN009", line: 2, column: 1, endColumn: 6 },
    ]);
    expect(tokens.filter(({ type }) => type.endsWith("LITERAL")).map(({ lexeme }) => lexeme)).toEqual([
      '"open', "'open", "1",
    ]);
  });

  it("keeps underscore rules specific to the selected exam syntax", () => {
    expect(tokenize("my_var").tokens.map(({ lexeme }) => lexeme)).toEqual(["my", "_var", ""]);
    expect(tokenize("my_var", "ocr-gcse").tokens.map(({ lexeme }) => lexeme)).toEqual(["my_var", ""]);
  });
});
