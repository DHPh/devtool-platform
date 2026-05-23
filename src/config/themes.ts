export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: "legacy",
    label: "Zinc",
    description: "Clean neutral workbench with cobalt accents.",
    icon: "Palette",
  },
  {
    id: "paper",
    label: "Swiss Paper",
    description: "Warm editorial palette with burnt amber accents and crisp corners.",
    icon: "BookOpen",
  },
  {
    id: "neon",
    label: "Precision",
    description: "Deep slate-charcoal workbench with emerald accents.",
    icon: "Zap",
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
