import type { NextConfig } from "next";
import path from "node:path";
import { POSTHOG_HOST } from "./src/lib/posthogHost";

const monorepoRoot = path.resolve(__dirname, "../..");
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
  env: {
    NEXT_PUBLIC_POSTHOG_ENABLED: analyticsEnabled ? "1" : "",
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
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
