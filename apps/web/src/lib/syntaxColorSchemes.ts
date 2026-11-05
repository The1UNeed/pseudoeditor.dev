import type { ResolvedTheme } from "@/lib/theme";

export type SyntaxColorSchemeId =
  | "classic"
  | "ocean"
  | "forest"
  | "ember"
  | "monochrome"
  | "high-contrast";

export type SyntaxTokenColors = {
  keyword: string;
  type: string;
  routine: string;
  string: string;
  number: string;
  operator: string;
  comment: string;
  identifier: string;
};

export type SyntaxColorScheme = {
  id: SyntaxColorSchemeId;
  dark: SyntaxTokenColors;
  light: SyntaxTokenColors;
  // Monochrome leans on weight instead of hue to tell keywords apart.
  boldKeywords?: boolean;
};

export const DEFAULT_SYNTAX_COLOR_SCHEME: SyntaxColorSchemeId = "classic";

// Token colours only. The editor background, gutter and selection stay with the app theme,
// so every scheme sits on the same surface as the rest of the workspace.
export const SYNTAX_COLOR_SCHEMES: readonly SyntaxColorScheme[] = [
  {
    id: "classic",
    dark: {
      keyword: "#FC5FA3",
      type: "#5DD8FF",
      routine: "#A167E6",
      string: "#FC6A5D",
      number: "#D0BF69",
      operator: "#E5E5EA",
      comment: "#6C7986",
      identifier: "#67B7A4",
    },
    light: {
      keyword: "#9B2D63",
      type: "#0F7A94",
      routine: "#7856B3",
      string: "#B45438",
      number: "#8D6A12",
      operator: "#2A241F",
      comment: "#8C7B6A",
      identifier: "#2D7A6D",
    },
  },
  {
    id: "ocean",
    dark: {
      keyword: "#6CB6FF",
      type: "#39C5CF",
      routine: "#B392F0",
      string: "#7EE0B5",
      number: "#F2C46D",
      operator: "#C9D1D9",
      comment: "#7D8B99",
      identifier: "#E6EDF3",
    },
    light: {
      keyword: "#0550AE",
      type: "#0A6F80",
      routine: "#6639BA",
      string: "#116329",
      number: "#953800",
      operator: "#24292F",
      comment: "#6E7781",
      identifier: "#1F2328",
    },
  },
  {
    id: "forest",
    dark: {
      keyword: "#86D96B",
      type: "#5CCFE6",
      routine: "#D2A6FF",
      string: "#E6C07B",
      number: "#F29E74",
      operator: "#D8DEE4",
      comment: "#808C79",
      identifier: "#B8E0C0",
    },
    light: {
      keyword: "#2E6B30",
      type: "#00677F",
      routine: "#7B3FA8",
      string: "#855000",
      number: "#AE3A12",
      operator: "#1F2A1F",
      comment: "#6B7768",
      identifier: "#2F4F3A",
    },
  },
  {
    id: "ember",
    dark: {
      keyword: "#FF9E64",
      type: "#FFC777",
      routine: "#FF757F",
      string: "#C3E88D",
      number: "#FCA7EA",
      operator: "#E5E5EA",
      comment: "#8C8074",
      identifier: "#F2E4D4",
    },
    light: {
      keyword: "#B03E0A",
      type: "#855700",
      routine: "#B3263A",
      string: "#3F7212",
      number: "#A3237E",
      operator: "#2A241F",
      comment: "#857565",
      identifier: "#3B2F26",
    },
  },
  {
    id: "monochrome",
    boldKeywords: true,
    dark: {
      keyword: "#FFFFFF",
      type: "#E5E5EA",
      routine: "#D1D1D6",
      string: "#BDBDC2",
      number: "#E5E5EA",
      operator: "#AEAEB2",
      comment: "#7C7C82",
      identifier: "#E5E5EA",
    },
    light: {
      keyword: "#000000",
      type: "#1C1C1E",
      routine: "#3A3A3C",
      string: "#545458",
      number: "#1C1C1E",
      operator: "#636366",
      comment: "#85858A",
      identifier: "#1C1C1E",
    },
  },
  {
    id: "high-contrast",
    dark: {
      keyword: "#FF7AC6",
      type: "#6BE4FF",
      routine: "#C9A2FF",
      string: "#FFB86B",
      number: "#FFE66D",
      operator: "#FFFFFF",
      comment: "#A8B3BD",
      identifier: "#8DF0C6",
    },
    light: {
      keyword: "#A1005B",
      type: "#005A8C",
      routine: "#5B2BB5",
      string: "#9E3600",
      number: "#6B5300",
      operator: "#000000",
      comment: "#4F5B66",
      identifier: "#006B4E",
    },
  },
];

const STORAGE_KEY = "pseudoeditor-syntax-color-scheme";

export function isSyntaxColorSchemeId(value: unknown): value is SyntaxColorSchemeId {
  return SYNTAX_COLOR_SCHEMES.some((scheme) => scheme.id === value);
}

export function monacoThemeName(id: SyntaxColorSchemeId, theme: ResolvedTheme): string {
  return `pseudo-${id}-${theme}`;
}

export function loadSyntaxColorScheme(): SyntaxColorSchemeId {
  if (typeof window === "undefined") {
    return DEFAULT_SYNTAX_COLOR_SCHEME;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSyntaxColorSchemeId(stored) ? stored : DEFAULT_SYNTAX_COLOR_SCHEME;
  } catch {
    return DEFAULT_SYNTAX_COLOR_SCHEME;
  }
}

export function saveSyntaxColorScheme(id: SyntaxColorSchemeId): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage can be blocked (private mode, quota); the choice still applies for this session.
  }
}
