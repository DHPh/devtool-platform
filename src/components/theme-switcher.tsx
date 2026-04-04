"use client";

import { useEffect } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getThemeById, THEMES } from "@/config/themes";
import { useTheme } from "@/store/theme";

export function ThemeSwitcher() {
  const { activeTheme, setActiveTheme } = useTheme();

  useEffect(() => {
    const theme = getThemeById(activeTheme);
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme.id);
    }
  }, [activeTheme]);

  const current = getThemeById(activeTheme) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Switch theme">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setActiveTheme(theme.id)}
          >
            {theme.label}
            {theme.id === current.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          {current.description}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
