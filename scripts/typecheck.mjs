import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const useTsc = process.argv.includes("--tsc");
const compiler = useTsc
  ? require.resolve("typescript/bin/tsc")
  : path.join(path.dirname(require.resolve("tsrs/package.json")), "bin/tsrs");
const projects = ["packages/compiler", "packages/workspace", "apps/web", "convex"];

// Check independent projects together, without starting a pnpm process per package.
// Disable incremental state so tsc and tsrs never reuse each other's build info.
const results = await Promise.all(projects.map((project) => new Promise((resolve) => {
  const child = spawn(process.execPath, [
    compiler, "--project", path.join(project, "tsconfig.json"),
    "--noEmit", "--incremental", "false", ...(useTsc ? [] : ["--fast"]),
  ], { cwd: root, stdio: "inherit" });
  child.on("error", (error) => {
    console.error(error);
    resolve(1);
  });
  child.on("exit", (code) => resolve(code ?? 1));
})));
process.exitCode = results.some((code) => code !== 0) ? 1 : 0;
