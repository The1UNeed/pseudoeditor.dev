import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SYNTAX_COLOR_SCHEME,
  SYNTAX_COLOR_SCHEMES,
  isSyntaxColorSchemeId,
  loadSyntaxColorScheme,
  monacoThemeName,
  saveSyntaxColorScheme,
} from "@/lib/syntaxColorSchemes";

// The editor surfaces each scheme is drawn on: the background and the current-line highlight.
const EDITOR_SURFACES = {
  // The editor background and its current-line highlight (see EDITOR_SURFACE_COLORS).
  dark: ["#16171B", "#1D1E24"],
  light: ["#FFFFFF", "#F5F6F9"],
} as const;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const localStore = new Map<string, string>();

describe("syntax colour schemes", () => {
  beforeEach(() => {
    localStore.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => localStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStore.set(key, value);
        },
        removeItem: (key: string) => {
          localStore.delete(key);
        },
      },
    });
  });

  it("offers several schemes with unique ids", () => {
    const ids = SYNTAX_COLOR_SCHEMES.map((scheme) => scheme.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(DEFAULT_SYNTAX_COLOR_SCHEME);
  });

  // Classic is the palette the editor shipped with, so it is kept as is.
  it.each(SYNTAX_COLOR_SCHEMES.filter((scheme) => scheme.id !== "classic"))(
    "keeps $id readable on the editor surfaces",
    (scheme) => {
      for (const mode of ["dark", "light"] as const) {
        for (const [token, color] of Object.entries(scheme[mode])) {
          const minimum = token === "comment" ? 3 : 4.5;
          for (const surface of EDITOR_SURFACES[mode]) {
            expect(
              contrast(color, surface),
              `${scheme.id} ${mode} ${token} ${color} on ${surface}`,
            ).toBeGreaterThanOrEqual(minimum);
          }
        }
      }
    },
  );

  it("recognises only known scheme ids", () => {
    expect(isSyntaxColorSchemeId("ocean")).toBe(true);
    expect(isSyntaxColorSchemeId("neon")).toBe(false);
  });

  it("names a Monaco theme per scheme and appearance", () => {
    expect(monacoThemeName("ocean", "dark")).toBe("pseudo-ocean-dark");
    expect(monacoThemeName("ocean", "light")).toBe("pseudo-ocean-light");
  });

  it("remembers the chosen scheme and ignores stored junk", () => {
    expect(loadSyntaxColorScheme()).toBe(DEFAULT_SYNTAX_COLOR_SCHEME);
    saveSyntaxColorScheme("forest");
    expect(loadSyntaxColorScheme()).toBe("forest");
    localStore.set("pseudoeditor-syntax-color-scheme", "neon");
    expect(loadSyntaxColorScheme()).toBe(DEFAULT_SYNTAX_COLOR_SCHEME);
  });

  it("still loads when storage is blocked", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    expect(loadSyntaxColorScheme()).toBe(DEFAULT_SYNTAX_COLOR_SCHEME);
    expect(() => saveSyntaxColorScheme("ocean")).not.toThrow();
  });
});
