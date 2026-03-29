// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StudioTabs } from "@/components/studio-tabs";
import type { StudioManifest } from "@/lib/studio-manifest";

afterEach(cleanup);

function TestTab() {
  return <div>Tab content</div>;
}

function createManifest(tabCount: number): StudioManifest {
  return {
    id: "example-studio",
    directory: "example-studio",
    defaultTab: "tab-1",
    tabs: Array.from({ length: tabCount }, (_, index) => ({
      id: `tab-${index + 1}`,
      shortLabel: `Tab ${index + 1}`,
      label: `Example tool ${index + 1}`,
      icon: "Wrench",
      metadata: {},
      loadComponent: async () => ({ default: TestTab }),
    })),
  } as unknown as StudioManifest;
}

describe("studio tabs", () => {
  it.each([
    [3, ["grid-cols-2", "sm:grid-cols-3"]],
    [4, ["grid-cols-2", "sm:grid-cols-4"]],
    [8, ["grid-cols-2", "md:grid-cols-4", "xl:grid-cols-8"]],
    [10, ["grid-cols-2", "md:grid-cols-5"]],
  ])(
    "chooses a balanced responsive grid for %i tools",
    (tabCount, expectedClasses) => {
      render(
        <StudioTabs
          manifest={createManifest(tabCount)}
          componentProps={{}}
        />,
      );

      expect(screen.getByRole("tablist")).toHaveClass(
        "grid",
        "h-auto",
        "auto-rows-fr",
        ...expectedClasses,
      );
    },
  );

  it("gives every studio tab a consistent minimum height", () => {
    render(
      <StudioTabs manifest={createManifest(4)} componentProps={{}} />,
    );

    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveClass(
        "h-full",
        "min-h-16",
        "min-w-0",
        "whitespace-normal",
      );
    }
  });
});
