import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";

// PostHog US Cloud ingestion, the same origin apps/web/src/lib/posthogHost.ts uses.
const POSTHOG_CAPTURE_URL = "https://us.i.posthog.com/i/v0/e/";
// Shared with the web server's error reports: one fixed ID, so no event names an account.
const SERVER_DISTINCT_ID = "pseudoeditor-server";
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_WINDOWS = { active_accounts_1d: 1, active_accounts_7d: 7, active_accounts_30d: 30 } as const;
const ACCOUNTS_PAGE_SIZE = 1000;
// Retries 30 s, 2 min, 8 min, and 32 min after a failed send.
const CAPTURE_RETRIES = 4;

type AccountStats = { accounts_total: number } & Record<keyof typeof ACTIVE_WINDOWS, number>;

/**
 * Sends one anonymous event to PostHog. Events carry counts only, never a Clerk user ID, email,
 * or name. Does nothing unless POSTHOG_PROJECT_KEY is set, which only the production deployment has.
 */
async function capture(
  event: string,
  properties: Record<string, number>,
  options: { uuid?: string; timestamp?: number } = {},
) {
  const apiKey = process.env.POSTHOG_PROJECT_KEY;
  if (!apiKey) {
    return;
  }
  const response = await fetch(POSTHOG_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: SERVER_DISTINCT_ID,
      uuid: options.uuid,
      timestamp: new Date(options.timestamp ?? Date.now()).toISOString(),
      properties: { ...properties, $process_person_profile: false, $geoip_disable: true },
    }),
  });
  if (!response.ok) {
    throw new Error(`PostHog rejected ${event} with status ${response.status}.`);
  }
}

/**
 * Derives a stable UUID from the webhook's Svix message ID, so a redelivered webhook carries the
 * same event UUID and PostHog keeps a single copy.
 */
export async function eventUuidFromMessageId(messageId: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(messageId)));
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // UUID version 8 (custom).
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 9562 variant.
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Records that an account was created or deleted. Scheduled from the Clerk webhook. */
export const captureAccountEvent = internalAction({
  args: {
    event: v.union(v.literal("account_created"), v.literal("account_deleted")),
    uuid: v.string(),
    timestamp: v.number(),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      await capture(args.event, {}, { uuid: args.uuid, timestamp: args.timestamp });
    } catch (error) {
      // Clerk already got its 200, so retry here. The stable UUID keeps a retry from double counting.
      const attempt = args.attempt ?? 0;
      if (attempt >= CAPTURE_RETRIES) {
        throw error;
      }
      await ctx.scheduler.runAfter(30_000 * 4 ** attempt, internal.analytics.captureAccountEvent, {
        ...args,
        attempt: attempt + 1,
      });
    }
    return null;
  },
});

/**
 * Counts one page of synced accounts, bucketed by how recently each one saved its workspace.
 * `users.updatedAt` moves on every cloud save, so "active" means edited while signed in.
 */
export const countAccountsPage = internalQuery({
  args: { now: v.number(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { now, paginationOpts }) => {
    // Creation order never changes, so a save during the scan cannot move a row past the cursor.
    const result = await ctx.db.query("users").paginate(paginationOpts);
    const counts: AccountStats = { accounts_total: 0, active_accounts_1d: 0, active_accounts_7d: 0, active_accounts_30d: 0 };
    for (const user of result.page) {
      counts.accounts_total += 1;
      for (const [key, days] of Object.entries(ACTIVE_WINDOWS) as Array<[keyof typeof ACTIVE_WINDOWS, number]>) {
        if (user.updatedAt >= now - days * DAY_MS) {
          counts[key] += 1;
        }
      }
    }
    return { counts, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/** Daily totals of synced accounts and of those active in the last 1, 7, and 30 days. */
export const reportAccountStats = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const totals: AccountStats = { accounts_total: 0, active_accounts_1d: 0, active_accounts_7d: 0, active_accounts_30d: 0 };
    let cursor: string | null = null;
    for (;;) {
      const page: { counts: AccountStats; isDone: boolean; continueCursor: string } = await ctx.runQuery(
        internal.analytics.countAccountsPage,
        { now, paginationOpts: { numItems: ACCOUNTS_PAGE_SIZE, cursor } },
      );
      for (const key of Object.keys(totals) as Array<keyof AccountStats>) {
        totals[key] += page.counts[key];
      }
      if (page.isDone) {
        break;
      }
      cursor = page.continueCursor;
    }
    await capture("account_stats", totals, { timestamp: now });
    return totals;
  },
});
