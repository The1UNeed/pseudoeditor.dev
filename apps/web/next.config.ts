import type { NextConfig } from "next";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { POSTHOG_HOST } from "./src/lib/posthogHost";

const monorepoRoot = path.resolve(__dirname, "../..");
const requireFromRoot = createRequire(path.join(monorepoRoot, "package.json"));
const isDev = process.env.NODE_ENV !== "production";

const clerkOrigins = [
  "https://*.clerk.accounts.dev",
  "https://clerk.pseudoeditor.dev",
  "https://*.clerk.com",
  "https://challenges.cloudflare.com",
];
const convexOrigins = ["https://*.convex.cloud", "wss://*.convex.cloud", "https://*.convex.site"];
// The privacy policy promises analytics on the production website only, not previews, local
// builds, or the desktop app. The flag is inlined at build time for client and server code.
const analyticsEnabled =
  process.env.VERCEL_ENV === "production" &&
  process.env.BUILD_TARGET !== "electron" &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
const analyticsOrigins = analyticsEnabled ? [POSTHOG_HOST] : [];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} ${clerkOrigins.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src 'self' ${[...clerkOrigins, ...convexOrigins, ...analyticsOrigins].join(" ")}${isDev ? " ws: http://localhost:*" : ""}`,
  `frame-src ${clerkOrigins.join(" ")}`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  compiler: {
    async runAfterProductionCompile({ projectDir }) {
      const tsrsCli = path.join(path.dirname(requireFromRoot.resolve("tsrs/package.json")), "bin/tsrs");
      // Route validators exist after compilation. Fail the build on TSRS errors,
      // including when invoking `next build` directly instead of the pnpm script.
      console.log("Checking TypeScript with TSRS...");
      execFileSync(process.execPath, [
        tsrsCli, "--project", "tsconfig.json", "--noEmit", "--fast", "--incremental", "false",
      ], { cwd: projectDir, stdio: "inherit" });
    },
  },
  typescript: {
    // TSRS above replaces the duplicate JavaScript checker, with the same config.
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_POSTHOG_ENABLED: analyticsEnabled ? "1" : "",
  },
  experimental: {
    // Inline the stylesheet (about 15 KB compressed) into the HTML, so first paint does not wait for
    // a separate render-blocking CSS request. Client-side navigations still load it as a file.
    inlineCss: true,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async redirects() {
    // The manual's content now lives in the docs as the pseudocode reference.
    const manual = ["/manual", "/app/manual"].flatMap((source) => [
      { source, destination: "/docs", permanent: true },
      { source: `/:locale(en|zh)${source}`, destination: "/:locale/docs", permanent: true },
    ]);
    // English is served at the bare path, so `/en/...` redirects there and every page has one URL.
    const englishPrefix = [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
    return [...manual, ...englishPrefix];
  },
  async rewrites() {
    // English pages live under app/[locale] as `/en/...`; the bare path is rewritten there. These run
    // in Vercel's routing layer, so cached pages are served from the CDN without invoking the proxy
    // (middleware). `afterFiles` runs after public files and static routes (robots.txt, icons,
    // /api, /_next) but before dynamic routes, so `/docs` reaches `/en/docs` rather than
    // `[locale]` = "docs".
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/en" },
        { source: "/:path((?!(?:en|zh|api|_next)(?:/|$)).+)", destination: "/en/:path" },
      ],
      fallback: [],
    };
  },
  async headers() {
    const immutableAssetHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/fonts/:path*", headers: immutableAssetHeaders },
      { source: "/branding/:path*", headers: immutableAssetHeaders },
      { source: "/_next/static/:path*", headers: immutableAssetHeaders },
    ];
  },
  transpilePackages: ["@pseudoeditor/compiler", "@pseudoeditor/workspace"],
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
