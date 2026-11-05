import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const hasClerkServerConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const isElectronBuild = process.env.BUILD_TARGET === "electron";
const shouldUseClerkProxy = !isElectronBuild && hasClerkServerConfig;

const clerkProxy = shouldUseClerkProxy ? clerkMiddleware() : null;

/**
 * Runs for API routes only: `auth()` in api/workspace reads the session Clerk's middleware sets up.
 * Pages authenticate in the browser through ClerkProvider, and their locale routing is a rewrite in
 * next.config.ts, so page requests never invoke this function and are served straight from the CDN
 * cache. (Running Clerk on pages also cost a handshake redirect whenever a returning visitor's
 * session token had expired.)
 */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkProxy) {
    return NextResponse.next();
  }

  return clerkProxy(request, event);
}

export const config = {
  matcher: ["/(api|trpc)(.*)"],
};
