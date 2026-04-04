import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID, isThemeId } from "@/config/themes";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  activeTheme: string;
  theme: ThemeMode;
  setActiveTheme: (theme: string) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: DEFAULT_THEME_ID,
      theme: "system",
      setActiveTheme: (theme) => set({ activeTheme: theme }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "devtool-theme",
      // Backfill `activeTheme` for values persisted before themes existed.
      merge: (persisted, current) => {
        const stored = (
          persisted && typeof persisted === "object" && "state" in persisted
            ? (persisted as { state: Partial<ThemeState> }).state
            : ((persisted ?? {}) as Partial<ThemeState>)
        );
        const activeTheme =
          typeof stored.activeTheme === "string" && isThemeId(stored.activeTheme)
            ? stored.activeTheme
            : current.activeTheme;
        return { ...current, ...stored, activeTheme };
      },
    },
  ),
);
