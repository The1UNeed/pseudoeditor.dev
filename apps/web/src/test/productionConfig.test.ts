import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("loads production server configuration without the build-only TSRS dependency", () => {
  const output = execFileSync(process.execPath, ["-e", `
    const Module = require('node:module');
    const originalResolve = Module._resolveFilename;
    Module._resolveFilename = function(request, ...args) {
      if (request === 'tsrs/package.json') {
        const error = new Error("Cannot find module 'tsrs/package.json'");
        error.code = 'MODULE_NOT_FOUND';
        throw error;
      }
      return originalResolve.call(this, request, ...args);
    };
    const loadConfig = require('next/dist/server/config').default;
    const { PHASE_PRODUCTION_SERVER } = require('next/constants');
    loadConfig(PHASE_PRODUCTION_SERVER, process.cwd(), { silent: true })
      .then(() => console.log('Production config loaded'))
      .catch((error) => { console.error(error.message); process.exitCode = 1; });
  `], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production" },
    encoding: "utf8",
  });
  expect(output).toContain("Production config loaded");
});
