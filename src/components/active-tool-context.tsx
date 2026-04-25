"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToolMetadata } from "@/lib/tool-registry";

interface ActiveToolContextValue {
  activeSubTool: ToolMetadata | null;
  setActiveSubTool: (tool: ToolMetadata | null) => void;
}

const ActiveToolContext = createContext<ActiveToolContextValue | null>(null);

export function ActiveToolProvider({ children }: { children: ReactNode }) {
  const [activeSubTool, setActiveSubTool] = useState<ToolMetadata | null>(null);

  const value = useMemo(
    () => ({ activeSubTool, setActiveSubTool }),
    [activeSubTool],
  );

  return (
    <ActiveToolContext.Provider value={value}>
      {children}
    </ActiveToolContext.Provider>
  );
}

export function useActiveTool() {
  return useContext(ActiveToolContext);
}
