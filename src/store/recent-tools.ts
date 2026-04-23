import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT_TOOLS = 8;

interface RecentToolsState {
  recentTools: string[];
  recordRecentTool: (toolId: string) => void;
  clearRecentTools: () => void;
}

export const useRecentTools = create<RecentToolsState>()(
  persist(
    (set) => ({
      recentTools: [],
      recordRecentTool: (toolId) => {
        if (!toolId) return;
        set((state) => {
          if (state.recentTools[0] === toolId) return state;
          const next = [
            toolId,
            ...state.recentTools.filter((id) => id !== toolId),
          ].slice(0, MAX_RECENT_TOOLS);
          return { recentTools: next };
        });
      },
      clearRecentTools: () => set({ recentTools: [] }),
    }),
    {
      name: "devtool-recent-tools",
    },
  ),
);
