export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: "legacy",
    label: "Classic",
    description: "The familiar neutral look with light and dark modes.",
    icon: "Palette",
  },
  {
    id: "neon",
    label: "Neon",
    description: "Vivid green and pink accents over a deep charcoal.",
    icon: "Zap",
  },
  {
    id: "paper",
    label: "Paper",
    description: "A warm editorial theme with amber accents.",
    icon: "BookOpen",
  },
] as const;

export const DEFAULT_THEME_ID = "legacy";

const themesById = new Map(THEMES.map((theme) => [theme.id, theme]));

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themesById.get(id);
}

export function isThemeId(id: string): boolean {
  return themesById.has(id);
}
