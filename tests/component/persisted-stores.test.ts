// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { useBookmarks } from "@/store/bookmarks";
import { useTheme } from "@/store/theme";
import { DEFAULT_THEME_ID, THEMES } from "@/config/themes";

describe("persisted preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    useBookmarks.setState({ bookmarks: [] });
    useTheme.setState({ theme: "system", activeTheme: DEFAULT_THEME_ID });
  });

  it("persists and rehydrates bookmarks", async () => {
    useBookmarks.getState().addBookmark("json-formatter");

    expect(
      JSON.parse(localStorage.getItem("devtool-bookmarks") ?? "{}")
        .state.bookmarks,
    ).toEqual(["json-formatter"]);

    const persisted = localStorage.getItem("devtool-bookmarks");
    useBookmarks.setState({ bookmarks: [] });
    localStorage.setItem("devtool-bookmarks", persisted ?? "{}");
    await useBookmarks.persist.rehydrate();
    expect(useBookmarks.getState().isBookmarked("json-formatter")).toBe(true);
  });

  it("persists and rehydrates the selected mode", async () => {
    useTheme.getState().setTheme("dark");

    expect(
      JSON.parse(localStorage.getItem("devtool-theme") ?? "{}").state.theme,
    ).toBe("dark");

    const persisted = localStorage.getItem("devtool-theme");
    useTheme.setState({ theme: "system" });
    localStorage.setItem("devtool-theme", persisted ?? "{}");
    await useTheme.persist.rehydrate();
    expect(useTheme.getState().theme).toBe("dark");
  });

  it("persists and rehydrates the active theme", async () => {
    useTheme.getState().setActiveTheme("neon");

    expect(
      JSON.parse(localStorage.getItem("devtool-theme") ?? "{}").state
        .activeTheme,
    ).toBe("neon");

    const persisted = localStorage.getItem("devtool-theme");
    useTheme.setState({ activeTheme: DEFAULT_THEME_ID });
    localStorage.setItem("devtool-theme", persisted ?? "{}");
    await useTheme.persist.rehydrate();
    expect(useTheme.getState().activeTheme).toBe("neon");
  });

  it("backfills the active theme for values persisted before themes existed", async () => {
    useTheme.setState({ theme: "system", activeTheme: DEFAULT_THEME_ID });
    localStorage.setItem(
      "devtool-theme",
      JSON.stringify({ state: { theme: "dark" }, version: 0 }),
    );
    await useTheme.persist.rehydrate();

    expect(useTheme.getState().activeTheme).toBe(DEFAULT_THEME_ID);
    expect(useTheme.getState().theme).toBe("dark");
  });
});

describe("theme registry", () => {
  it("contains unique ids and includes the default theme", () => {
    const ids = THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_THEME_ID);
  });
});
