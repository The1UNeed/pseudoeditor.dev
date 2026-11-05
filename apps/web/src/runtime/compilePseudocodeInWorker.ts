import type { CompileRequest, CompileResult, Diagnostic } from "@/compiler/types";
import type { CompilerWorkerResponseMessage } from "@/workers/compiler.worker";

interface PendingCompile {
  resolve: (result: CompileResult) => void;
  reject: (error: Error) => void;
}

export interface CompilerRunResult {
  result: CompileResult;
  requestId: number;
  stale: boolean;
  cached: boolean;
}

const COMPILE_TIMEOUT_MS = 10_000;
const MAX_COMPILE_CACHE_ENTRIES = 40;

function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function compilerErrorResult(message: string): CompileResult {
  const diagnostic: Diagnostic = {
    code: "CMP500",
    message,
    severity: "error",
    line: 1,
    column: 1,
    endLine: 1,
    endColumn: 1,
  };

  return {
    success: false,
    diagnostics: [diagnostic],
    astJson: "",
  };
}

class CompilerRunner {
  private worker: Worker | null = null;
  private nextId = 1;
  private latestRequestId = 0;
  private pending = new Map<number, PendingCompile>();
  private cache = new Map<string, CompileResult>();
  private inFlight = new Map<string, Promise<CompileResult>>();

  private ensureWorker(): Worker | null {
    if (typeof Worker === "undefined") {
      return null;
    }

    if (this.worker) {
      return this.worker;
    }

    this.worker = new Worker(new URL("../workers/compiler.worker.ts", import.meta.url));
    this.worker.onmessage = (event: MessageEvent<CompilerWorkerResponseMessage>) => {
      const { id } = event.data;
      const pending = this.pending.get(id);
      if (!pending) {
        return;
      }

      this.pending.delete(id);

      if (event.data.kind === "error") {
        pending.reject(new Error(event.data.message));
        return;
      }

      pending.resolve(event.data.result);
    };

    this.worker.onerror = (event) => {
      this.abandonWorker(new Error(event.message || "Compiler worker crashed."));
    };

    return this.worker;
  }

  /** Every pending request went to this worker, so they all fail with it; the next compile starts a new one. */
  private abandonWorker(error: Error) {
    const pending = [...this.pending.values()];
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    for (const entry of pending) {
      entry.reject(error);
    }
  }

  private setCachedResult(cacheKey: string, result: CompileResult) {
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
    }

    this.cache.set(cacheKey, result);

    while (this.cache.size > MAX_COMPILE_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) {
        break;
      }
      this.cache.delete(oldestKey);
    }
  }

  /**
   * `background` compiles (live diagnostics while typing) never mark a foreground compile, such as Run,
   * as stale; their own callers check freshness against the current source instead.
   */
  async compile(
    request: CompileRequest,
    cacheKey: string | null = null,
    options: { background?: boolean } = {},
  ): Promise<CompilerRunResult> {
    const id = this.nextId++;
    const background = options.background === true;
    if (!background) this.latestRequestId = id;
    // The caller's key is a namespace, not proof that two sources are identical.
    const identity = cacheKey === null ? null : JSON.stringify([
      cacheKey, request.source, request.filename, request.syntaxId, request.strict,
    ]);
    const cached = identity === null ? undefined : this.cache.get(identity);
    if (cached && identity !== null) {
      this.setCachedResult(identity, cached);
      return { result: cached, requestId: id, stale: false, cached: true };
    }

    let compilation = identity === null ? undefined : this.inFlight.get(identity);
    if (!compilation) {
      compilation = this.execute(request, id).then((result) => {
        if (identity !== null) this.setCachedResult(identity, result);
        return result;
      });
      if (identity !== null) {
        this.inFlight.set(identity, compilation);
        const cleanup = () => {
          if (this.inFlight.get(identity) === compilation) this.inFlight.delete(identity);
        };
        void compilation.then(cleanup, cleanup);
      }
    }

    let result: CompileResult;
    try {
      result = await compilation;
    } catch (error) {
      result = compilerErrorResult(error instanceof Error ? error.message : "Unknown compiler error");
    }
    return { result, requestId: id, stale: !background && id !== this.latestRequestId, cached: false };
  }

  private async execute(request: CompileRequest, id: number): Promise<CompileResult> {
    const worker = this.ensureWorker();
    if (!worker) {
      // Keep parser and semantic analysis out of the editor's initial client bundle.
      const { compilePseudocode } = await import("@/compiler");
      return compilePseudocode(request);
    }

    return new Promise<CompileResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) this.abandonWorker(new Error("Compiler timed out."));
      }, COMPILE_TIMEOUT_MS);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      try {
        worker.postMessage({ kind: "compile", id, request });
      } catch (error) {
        this.abandonWorker(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  preload(): void {
    void this.ensureWorker();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export function getCompileCacheKey(
  documentId: string,
  filename: string,
  source: string,
  syntaxId = "cambridge-igcse",
): string {
  return `${documentId}:${filename}:${syntaxId}:${hashString(source)}`;
}

export const pseudocodeCompilerRunner = new CompilerRunner();

export function compilePseudocodeInWorker(
  request: CompileRequest,
  cacheKey?: string | null,
  options?: { background?: boolean },
): Promise<CompilerRunResult> {
  return pseudocodeCompilerRunner.compile(request, cacheKey ?? null, options);
}

export function preloadPseudocodeCompiler(): void {
  pseudocodeCompilerRunner.preload();
}
