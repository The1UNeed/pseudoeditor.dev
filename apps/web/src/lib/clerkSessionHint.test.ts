import { describe, expect, it } from "vitest";
import { mayHaveClerkSession } from "@/lib/auth-components";

describe("mayHaveClerkSession", () => {
  it("is false without a Clerk cookie or when Clerk marks the browser signed out", () => {
    expect(mayHaveClerkSession("")).toBe(false);
    expect(mayHaveClerkSession("theme=dark")).toBe(false);
    expect(mayHaveClerkSession("__client_uat=0")).toBe(false);
    expect(mayHaveClerkSession("a=1; __client_uat=0; __client_uat_Ab12Cd=0")).toBe(false);
    expect(mayHaveClerkSession("x__client_uat=1793800000")).toBe(false);
  });

  it("is true when either the plain or the suffixed cookie records a sign-in", () => {
    expect(mayHaveClerkSession("__client_uat=1793800000")).toBe(true);
    expect(mayHaveClerkSession("a=1; __client_uat=0; __client_uat_Ab12Cd=1793800000")).toBe(true);
  });
});
