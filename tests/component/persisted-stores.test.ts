// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { useBookmarks } from "@/store/bookmarks";
import { useTheme } from "@/store/theme";

describe("persisted preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    useBookmarks.setState({ bookmarks: [] });
    useTheme.setState({ theme: "system" });
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

  it("persists and rehydrates the selected theme", async () => {
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
});
