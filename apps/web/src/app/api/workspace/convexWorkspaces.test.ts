import { createDefaultWorkspace } from "@pseudoeditor/workspace";
import { describe, expect, it } from "vitest";
import { getCurrentSnapshot, saveCurrent } from "../../../../../../convex/workspaces";

type Row = Record<string, unknown> & { _id: string; clerkUserId: string };

/** Just enough of Convex's ctx for the workspace functions: one signed-in user and an in-memory table per name. */
function createCtx(subject = "user_a") {
  const tables = new Map<string, Row[]>();
  const table = (name: string) => tables.get(name) ?? tables.set(name, []).get(name)!;
  let nextId = 0;
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject, email: "student@example.com" }) },
    db: {
      query: (name: string) => ({
        withIndex: (_index: string, build: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
          let filter: [string, unknown] = ["", undefined];
          build({ eq: (field, value) => (filter = [field, value]) });
          return { unique: async () => table(name).find((row) => row[filter[0]] === filter[1]) ?? null };
        },
      }),
      insert: async (name: string, value: Record<string, unknown>) => {
        const row = { ...value, _id: `${name}_${nextId++}` } as Row;
        table(name).push(row);
        return row._id;
      },
      patch: async (id: string, value: Record<string, unknown>) => {
        for (const rows of tables.values()) {
          const row = rows.find((candidate) => candidate._id === id);
          if (row) Object.assign(row, value);
        }
      },
    },
  };
  return ctx;
}

type Handler<Args, Result> = { _handler: (ctx: unknown, args: Args) => Promise<Result> };
const save = (saveCurrent as unknown as Handler<Record<string, unknown>, { ok: boolean; revision: number | null }>)._handler;
const read = (getCurrentSnapshot as unknown as Handler<Record<string, never>, { workspaceJson: string | null; revision: number } | null>)._handler;

const user = { email: "student@example.com", firstName: null, lastName: null };
const workspaceJson = (source: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ ...createDefaultWorkspace({ sampleSource: source }), ...extra });

describe("convex workspaces", () => {
  it("bumps the revision on each save and refuses a save built on an older revision", async () => {
    const ctx = createCtx();
    await expect(save(ctx, { user, workspaceJson: workspaceJson("OUTPUT 1"), expectedRevision: null })).resolves.toEqual({ ok: true, revision: 1 });
    await expect(save(ctx, { user, workspaceJson: workspaceJson("OUTPUT 2"), expectedRevision: 1 })).resolves.toEqual({ ok: true, revision: 2 });

    // A second device still on revision 1 must not replace revision 2.
    await expect(save(ctx, { user, workspaceJson: workspaceJson("OUTPUT stale"), expectedRevision: 1 })).resolves.toMatchObject({ ok: false, revision: 2 });
    // Nor may a client that thinks the account has no workspace yet.
    await expect(save(ctx, { user, workspaceJson: workspaceJson("OUTPUT new"), expectedRevision: null })).resolves.toMatchObject({ ok: false });

    const snapshot = await read(ctx, {});
    expect(snapshot?.revision).toBe(2);
    expect(snapshot?.workspaceJson).toContain("OUTPUT 2");
  });

  it("keeps last-write-wins for older clients that send no revision", async () => {
    const ctx = createCtx();
    await save(ctx, { user, workspaceJson: workspaceJson("OUTPUT 1") });
    await expect(save(ctx, { user, workspaceJson: workspaceJson("OUTPUT 2") })).resolves.toEqual({ ok: true, revision: 2 });
  });

  it("returns the workspace as text so data files with non-ASCII names can be read back", async () => {
    const ctx = createCtx();
    await save(ctx, { user, workspaceJson: workspaceJson("OUTPUT 1", { virtualFiles: { "成绩.txt": ["90"] } }) });
    const snapshot = await read(ctx, {});
    expect(typeof snapshot?.workspaceJson).toBe("string");
    expect(JSON.parse(snapshot!.workspaceJson!).virtualFiles).toEqual({ "成绩.txt": ["90"] });
  });
});
