import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  }).index("by_clerk_user", ["clerkUserId"]),
  workspaces: defineTable({
    clerkUserId: v.string(),
    workspaceJson: v.optional(v.string()),
    workspace: v.optional(v.any()),
    /** Bumped on every save so a client can only overwrite the version it last read. Missing on older rows: 0. */
    revision: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_clerk_user", ["clerkUserId"]),
});
