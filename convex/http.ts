import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { eventUuidFromMessageId } from "./analytics";

type ClerkWebhookEvent = {
  type: string;
  data: { id?: string };
  timestamp?: number;
};

function parseClerkWebhookEvent(payload: string): ClerkWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const { type, data, timestamp } = parsed as Record<string, unknown>;
  if (typeof type !== "string" || !data || typeof data !== "object") {
    return null;
  }
  const { id } = data as Record<string, unknown>;
  return {
    type,
    data: { id: typeof id === "string" ? id : undefined },
    timestamp: typeof timestamp === "number" ? timestamp : undefined,
  };
}

const http = httpRouter();

// Clerk -> Convex webhook. Configure in the Clerk dashboard with the endpoint
// `<convex-site-url>/clerk/webhook` and subscribe to `user.created` and `user.deleted`. The
// signing secret must be set as CLERK_WEBHOOK_SECRET on the Convex deployment.
http.route({
  path: "/clerk/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("Webhook secret is not configured.", { status: 503 });
    }

    const payload = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    try {
      // svix 2.x only checks the signature; it no longer returns the parsed payload.
      new Webhook(secret).verify(payload, headers);
    } catch {
      return new Response("Invalid webhook signature.", { status: 400 });
    }

    const event = parseClerkWebhookEvent(payload);
    if (!event) {
      return new Response("Invalid webhook payload.", { status: 400 });
    }

    if (event.type === "user.deleted" && typeof event.data.id === "string") {
      await ctx.runMutation(internal.users.deleteByClerkUserId, { clerkUserId: event.data.id });
    }

    // Analytics learn only that an account came or went, never which one.
    const accountEvent =
      event.type === "user.created" ? "account_created" : event.type === "user.deleted" ? "account_deleted" : null;
    if (accountEvent) {
      await ctx.scheduler.runAfter(0, internal.analytics.captureAccountEvent, {
        event: accountEvent,
        uuid: await eventUuidFromMessageId(headers["svix-id"]),
        timestamp: event.timestamp ?? Date.now(),
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
