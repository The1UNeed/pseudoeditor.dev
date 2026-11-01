import { analyzeProgram } from "./semantics";
import { parseSource } from "./parser";
import { resolveSyntax } from "./syntax";
import { CompileRequest, CompileResult } from "./types";

export { parseSource } from "./parser";
export {
  DEFAULT_SYNTAX_ID,
  SYNTAX_CATALOG,
  SYNTAX_OPTIONS,
  displayKeyword,
  isSyntaxId,
  resolveSyntax,
  type KeywordCase,
  type SyntaxDefinition,
  type SyntaxId,
} from "./syntax";

export const MAX_SOURCE_BYTES = 256 * 1024;

/** UTF-8 encoded size of a string, so byte limits are not bypassed with non-ASCII text. */
export function getUtf8ByteLength(value: string) {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint < 0x80) {
      bytes += 1;
    } else if (codePoint < 0x800) {
      bytes += 2;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < value.length) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export function compilePseudocode(request: CompileRequest): CompileResult {
  if (getUtf8ByteLength(request.source) > MAX_SOURCE_BYTES) {
    return {
      success: false,
      diagnostics: [
        {
          code: "CMP413",
          message: `Source is too large to compile (limit ${MAX_SOURCE_BYTES / 1024} KB).`,
          severity: "error",
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 1,
          hint: "Split the program into smaller files.",
        },
      ],
      astJson: "",
    };
  }

  const syntax = resolveSyntax(request.syntaxId);
  const { ast, diagnostics: parseDiagnostics } = parseSource(request.source, syntax);
  let semanticResult: ReturnType<typeof analyzeProgram>;
  try {
    semanticResult = analyzeProgram(ast, syntax);
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }
    semanticResult = {
      diagnostics: [
        {
          code: "SEM099",
          message: "Program is too deeply nested to analyze.",
          severity: "error",
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 1,
        },
      ],
      symbolTypes: {},
      functionSignatures: {},
      procedureSignatures: {},
    };
  }

  const diagnostics = [...parseDiagnostics, ...semanticResult.diagnostics].sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.code.localeCompare(b.code);
  });

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return {
      success: false,
      diagnostics,
      astJson: JSON.stringify(ast),
    };
  }

  return {
    success: true,
    diagnostics,
    astJson: JSON.stringify(ast),
  };
}
